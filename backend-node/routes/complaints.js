const express = require('express');
const router = express.Router();
const axios = require('axios');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/complaints/submit
// @desc    Submit complaint, fetch AI priority from Django, save to Atlas
router.post('/submit', protect, async (req, res) => {
    try {
        const { title, description, location, ward, isNearCriticalNode } = req.body;
        const resolvedLocation = location || ward;

        if (!title || !description || !resolvedLocation) {
            return res.status(400).json({ status: "fail", message: "Title, description, and location/ward are required" });
        }

        let category = 'Unclassified';
        let priority = 1; // Default fallback level

        // Ping Django complaints ML microservice safely
        try {
            const djangoResponse = await axios.post('http://127.0.0.1:8000/api/complaints/predict-triage/', {
                description: description,
                is_near_critical_node: !!isNearCriticalNode
            }, {
                timeout: 5000
            });

            if (djangoResponse.data) {
                if (djangoResponse.data.predicted_category) {
                    category = djangoResponse.data.predicted_category;
                }
                if (djangoResponse.data.predicted_priority !== undefined) {
                    priority = djangoResponse.data.predicted_priority;
                }
            }
        } catch (djangoErr) {
            console.error("[Microservice Link Warning] Could not reach Django server. Falling back to default priority.", djangoErr.message);
        }

        // Initialize and save to MongoDB Atlas
        const newComplaint = new Complaint({
            user: req.user.id, // Pulled dynamically from verified JWT token details
            title,
            description,
            location: resolvedLocation,
            category,
            priority,
            status: 'Pending'
        });

        await newComplaint.save();
        const populatedComplaint = await Complaint.findById(newComplaint._id).populate('user', 'name email');

        res.status(201).json({
            status: "success",
            message: "Your complaint was received and triaged by NeuroCity AI Core.",
            data: populatedComplaint
        });

    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to submit complaint", error: error.message });
    }
});

// @route   GET /api/complaints/all
// @desc    Retrieve all complaints (admin role) or only user's tickets (citizen role)
router.get('/all', protect, async (req, res) => {
    try {
        let complaints;
        if (req.user.role === 'admin') {
            complaints = await Complaint.find({}).populate('user', 'name email').sort({ priority: -1 });
        } else {
            complaints = await Complaint.find({ user: req.user.id }).populate('user', 'name email').sort({ createdAt: -1 });
        }
        res.json({ status: "success", count: complaints.length, data: complaints });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to retrieve complaints", error: error.message });
    }
});

// @route   GET /api/complaints/my-tickets
// @desc    Retrieve all complaints raised by logged-in Citizen (fallback compatibility)
router.get('/my-tickets', protect, async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({ status: "success", count: complaints.length, data: complaints });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// @route   GET /api/complaints/notifications/my-alerts
// @desc    Fetch notifications for req.user.id sorted by createdAt: -1 (Protected)
router.get('/notifications/my-alerts', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .populate('complaint', 'title status description location')
            .sort({ createdAt: -1 });

        res.json({
            status: "success",
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to fetch notifications", error: error.message });
    }
});

// @route   PUT /api/complaints/notifications/:id/read
// @desc    Mark a notification as read (Protected)
router.put('/notifications/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ status: "fail", message: "Notification not found" });
        }

        // Verify ownership
        if (notification.user.toString() !== req.user.id) {
            return res.status(403).json({ status: "fail", message: "Access denied: Not your notification" });
        }

        notification.isRead = true;
        await notification.save();

        const populatedNotif = await Notification.findById(notification._id)
            .populate('complaint', 'title status description location');

        res.json({
            status: "success",
            message: "Notification marked as read",
            data: populatedNotif
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to mark notification as read", error: error.message });
    }
});

// @route   PUT /api/complaints/:id/status
// @desc    Update Complaint document status and create a Notification document for the user (Admin Protected)
router.put('/:id/status', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ status: "fail", message: "Access denied: Admin role required" });
        }

        const { status } = req.body;
        if (!['In Progress', 'Resolved'].includes(status)) {
            return res.status(400).json({ status: "fail", message: "Invalid status value. Must be 'In Progress' or 'Resolved'." });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ status: "fail", message: "Complaint not found" });
        }

        complaint.status = status;
        await complaint.save();

        // Automatically create a Notification document for the user who created the complaint
        const notification = new Notification({
            user: complaint.user,
            complaint: complaint._id,
            title: `Complaint Status: ${status}`,
            message: `Your complaint titled "${complaint.title}" has been updated to "${status}".`
        });
        await notification.save();

        res.json({
            status: "success",
            message: `Complaint status updated to ${status} and user notified.`,
            data: complaint
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to update status", error: error.message });
    }
});

module.exports = router;