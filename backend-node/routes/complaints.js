const express = require('express');
const router = express.Router();
const axios = require('axios');
const Complaint = require('../models/Complaint');
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

module.exports = router;