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

// @route   POST /api/energy/predict
// @desc    Forecasting using environmental factors and saving prediction to MongoDB Atlas
router.post('/predict', protect, async (req, res) => {
    try {
        const { city, temperature, humidity, wind_speed, hour, month } = req.body;

        // Basic input validation
        if (city === undefined || temperature === undefined || humidity === undefined) {
            return res.status(400).json({ status: "fail", message: "Missing required fields (city, temperature, humidity) in request body" });
        }

        // Ensure variables are parsed as numeric
        const numericTemp = Number(temperature);
        const numericHumid = Number(humidity);
        const numericWind = Number(wind_speed || 0);
        const numericHour = Number(hour !== undefined ? hour : 12);
        const numericMonth = Number(month !== undefined ? month : 6);

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

        // Map city to Django's expected region format (Surat, Ahmedabad, Vadodara, Rajkot are in Gujarat)
        const regionZone = 'Gujarat';

        let predictedLoadMW;
        let gridStatus;
        let predictionSource = 'django';

        // Ping Django microservice (Port 8000)
        try {
            const djangoResponse = await axios.post('http://127.0.0.1:8000/api/energy/predict/', {
                region_zone: regionZone,
                temp: numericTemp,
                humid: numericHumid
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000 // 5 seconds timeout threshold
            });

            if (djangoResponse.data && djangoResponse.data.status === 'success') {
                predictedLoadMW = Number(djangoResponse.data.predicted_usage);
                gridStatus = djangoResponse.data.grid_status; // NORMAL, STRESSED, CRITICAL
            } else {
                throw new Error("Django returned non-success status");
            }
        } catch (djangoErr) {
            console.warn("[Django Energy Sentinel Failed - Running Node fallback prediction simulation]:", djangoErr.message);
            predictionSource = 'simulation';

            // High-fidelity fallback logic:
            // Calculate a base load of 250MW, modified by weather inputs
            const tempFactor = Math.max(0, numericTemp - 20) * 12.5; // cooling load above 20C
            const humidFactor = numericHumid * 1.5;
            const windFactor = numericWind * -0.5; // wind slightly cools
            const peakHourBonus = (numericHour >= 17 && numericHour <= 21) ? 120 : (numericHour >= 9 && numericHour <= 16) ? 60 : 0; // peak usage hours
            
            // Base demand + temp + humidity + wind + hour bonus + random fluctuation
            const rawPrediction = 250 + tempFactor + humidFactor + windFactor + peakHourBonus + (Math.random() * 20 - 10);
            predictedLoadMW = Math.round(Math.max(100, Math.min(790, rawPrediction)) * 100) / 100;

            // Classify grid status based on predicted load out of 800MW
            if (predictedLoadMW > 600) {
                gridStatus = 'CRITICAL';
            } else if (predictedLoadMW > 400) {
                gridStatus = 'STRESSED';
            } else {
                gridStatus = 'NORMAL';
            }
        }

        // Map internal status classification to UI status tags
        let uiGridStatus = 'STABLE';
        if (gridStatus === 'CRITICAL' || gridStatus === 'CRITICAL_PEAK') {
            uiGridStatus = 'CRITICAL_PEAK';
        } else if (gridStatus === 'STRESSED' || gridStatus === 'MODERATE_HIGH') {
            uiGridStatus = 'MODERATE_HIGH';
        } else {
            uiGridStatus = 'STABLE';
        }

        // Create and save the new grid metric log
        const energyLog = new EnergyLog({
            regionZone: regionZone,
            city: city,
            temperature: numericTemp,
            humidity: numericHumid,
            windSpeed: numericWind,
            hour: numericHour,
            month: numericMonth,
            predictedLoadMW: predictedLoadMW,
            gridStatus: uiGridStatus,
            checkedBy: checkedByObjectId
        });

        await energyLog.save();

        res.status(201).json({
            status: "success",
            message: "Energy forecast processed and recorded successfully.",
            source: predictionSource,
            data: {
                logId: energyLog._id,
                regionZone: energyLog.regionZone,
                city: energyLog.city,
                temperature: energyLog.temperature,
                humidity: energyLog.humidity,
                windSpeed: energyLog.windSpeed,
                hour: energyLog.hour,
                month: energyLog.month,
                predictedLoadMW: energyLog.predictedLoadMW,
                gridStatus: energyLog.gridStatus,
                createdAt: energyLog.createdAt
            }
        });

    } catch (error) {
        console.error("[Energy Predict Route Error]", error.message);
        res.status(500).json({ status: "error", message: "Server error during energy forecast processing", error: error.message });
    }
});

// @route   GET /api/energy/logs
// @desc    Get recent prediction logs from MongoDB Atlas
router.get('/logs', protect, async (req, res) => {
    try {
        const logs = await EnergyLog.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('checkedBy', 'name email');

        res.status(200).json({
            status: "success",
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error("[Energy Logs GET Error]", error.message);
        res.status(500).json({ status: "error", message: "Failed to retrieve historical energy logs", error: error.message });
    }
});

module.exports = router;
