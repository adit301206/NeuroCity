const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const EnergyLog = require('../models/EnergyLog');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/energy/forecast
// @desc    Evaluate environmental metrics, ping Django ML regressor, and save results to MongoDB Atlas
router.post('/forecast', protect, async (req, res) => {
    try {
        const { regionZone, temperature, humidity } = req.body;

        // Basic input validation
        if (regionZone === undefined || temperature === undefined || humidity === undefined) {
            return res.status(400).json({ status: "fail", message: "Missing required fields (regionZone, temperature, humidity) in request body" });
        }

        // Ensure variables are parsed as numeric
        const numericTemp = Number(temperature);
        const numericHumid = Number(humidity);

        if (isNaN(numericTemp) || isNaN(numericHumid)) {
            return res.status(400).json({ status: "fail", message: "Temperature and humidity must be numeric values" });
        }

        // User verification and ObjectId extraction
        if (!req.user || (!req.user.id && !req.user._id)) {
            return res.status(401).json({ status: "fail", message: "User context not found on request" });
        }
        
        const userId = req.user.id || req.user._id;
        let checkedByObjectId;
        try {
            checkedByObjectId = new mongoose.Types.ObjectId(userId);
        } catch (castErr) {
            return res.status(400).json({ status: "fail", message: "Invalid user ID format" });
        }

        // Ping your Django internal predictive regressor microservice
        let djangoResponse;
        try {
            djangoResponse = await axios.post('http://127.0.0.1:8000/api/energy/predict/', {
                region_zone: regionZone,
                temp: numericTemp,
                humid: numericHumid
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 seconds timeout threshold
            });
        } catch (djangoErr) {
            console.error("[Django Energy Microservice Connection Error]", djangoErr.message);
            return res.status(502).json({
                status: "error",
                message: "Failed to communicate with Django Energy Sentinel microservice.",
                error: djangoErr.message
            });
        }

        const predictionData = djangoResponse.data;

        if (predictionData.status !== 'success') {
            return res.status(502).json({
                status: "error",
                message: "Django Energy Sentinel microservice failed to process prediction.",
                details: predictionData
            });
        }

        // Create and save the new grid metric log
        const energyLog = new EnergyLog({
            regionZone: regionZone,
            temperature: numericTemp,
            humidity: numericHumid,
            predictedLoadMW: Number(predictionData.predicted_usage),
            gridStatus: predictionData.grid_status,
            checkedBy: checkedByObjectId
        });

        await energyLog.save();

        res.status(201).json({
            status: "success",
            message: "Energy forecast processed and recorded successfully.",
            data: {
                logId: energyLog._id,
                regionZone: energyLog.regionZone,
                temperature: energyLog.temperature,
                humidity: energyLog.humidity,
                predictedLoadMW: energyLog.predictedLoadMW,
                gridStatus: energyLog.gridStatus,
                createdAt: energyLog.createdAt
            }
        });

    } catch (error) {
        console.error("[Energy Route Error]", error.message);
        res.status(500).json({ status: "error", message: "Server error during energy forecast processing", error: error.message });
    }
});

module.exports = router;
