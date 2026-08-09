const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

// @route   GET /api/stats
// @desc    Get core city telemetry statistics for the Global Hub dashboard
router.get('/', async (req, res) => {
    try {
        const totalComplaints = await Complaint.countDocuments();
        
        res.json({
            status: "success",
            activeSensors: 1420,
            gridLoadPercentage: 64.2,
            totalComplaints: totalComplaints,
            systemStatus: "OPTIMAL",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

module.exports = router;
