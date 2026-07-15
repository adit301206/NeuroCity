const express = require('express');
const router = express.Router();
const axios = require('axios');
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/complaints/submit
// @desc    Submit complaint, fetch AI priority from Django, save to Atlas
router.post('/submit', protect, async (req, res) => {
    try {
        const { title, description, location } = req.body;

        if (!description) {
            return res.status(400).json({ status: "fail", message: "Complaint description is required" });
        }

        let aiPriority = 1; // Default fallback level

        // Ping your Django internal microservice safely
        try {
            const djangoResponse = await axios.post('http://127.0.0.1:8000/api/complaints/predict-triage/', {
                description: description
            });

            if (djangoResponse.data && djangoResponse.data.predicted_priority) {
                aiPriority = djangoResponse.data.predicted_priority;
            }
        } catch (djangoErr) {
            console.error("[Microservice Link Warning] Could not reach Django server. Falling back to default priority.", djangoErr.message);
        }

        // Initialize and save to MongoDB Atlas
        const newComplaint = new Complaint({
            user: req.user.id, // Pulled dynamically from verified JWT token details
            title,
            description,
            location,
            priority: aiPriority
        });

        await newComplaint.save();

        res.status(201).json({
            status: "success",
            message: "Your complaint was received and triaged by NeuroCity AI Core.",
            data: newComplaint
        });

    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to submit complaint", error: error.message });
    }
});

// @route   GET /api/complaints/my-tickets
// @desc    Retrieve all complaints raised by logged-in Citizen
router.get('/my-tickets', protect, async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({ status: "success", count: complaints.length, data: complaints });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

module.exports = router;