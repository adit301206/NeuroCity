const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const EnergyLog = require('../models/EnergyLog');
const { protect } = require('../middleware/authMiddleware');

const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;

// Deduplicated City Capacity Weights
const CITY_WEIGHT_MAP = {
    // Tier 1 Mega Metros (3,500 - 5,200 MW)
    MUMBAI: 14.50,
    DELHI: 15.00,
    BENGALURU: 12.00,

    // Tier 1 Major Hubs (2,200 - 3,500 MW)
    AHMEDABAD: 10.20,
    CHENNAI: 9.80,
    HYDERABAD: 9.50,
    KOLKATA: 9.00,

    // Tier 2 Industrial & Commercial Hubs (1,200 - 2,200 MW)
    SURAT: 6.50,
    PUNE: 6.80,
    VADODARA: 5.20,
    JAIPUR: 5.80,
    KANPUR: 5.50,
    LUCKNOW: 5.80,

    // Tier 3 Regional Urban Nodes (600 - 1,100 MW)
    RAJKOT: 3.20,
    NAGPUR: 3.80,
    AGRA: 3.50,
    NASHIK: 3.40,
    VARANASI: 3.20,
    AURANGABAD: 3.10,
    JODHPUR: 3.20,
    KOTA: 3.40,
    GORAKHPUR: 2.80
};

async function fetchCoordinates(cityName, stateName) {
    try {
        const apiKey = OWM_API_KEY;
        const cleanCity = cityName.replace(/\s*\(.*?\)\s*/g, '').trim();

        // Attempt 1: q={city},{state},IN
        const url1 = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cleanCity)},${encodeURIComponent(stateName)},IN&limit=1&appid=${apiKey}`;
        const res1 = await axios.get(url1, { timeout: 5000 });
        if (res1.data && res1.data.length > 0) {
            return {
                lat: res1.data[0].lat,
                lon: res1.data[0].lon
            };
        }

        // Attempt 2: q={city},IN
        const url2 = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cleanCity)},IN&limit=1&appid=${apiKey}`;
        const res2 = await axios.get(url2, { timeout: 5000 });
        if (res2.data && res2.data.length > 0) {
            return {
                lat: res2.data[0].lat,
                lon: res2.data[0].lon
            };
        }
    } catch (err) {
        console.error(`[fetchCoordinates Error for ${cityName}, ${stateName}]`, err.message);
    }
    return null;
}

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

// @route   POST /api/energy/predict-live
// @desc    Get real-time weather-driven prediction using OpenWeatherMap API and Django ML model
// @route   POST /api/energy/predict-live
router.post('/predict-live', protect, async (req, res) => {
    try {
        const { cityName, stateName } = req.body;

        if (!cityName || !stateName) {
            return res.status(400).json({
                status: "fail",
                message: "Missing required fields (cityName, stateName) in request body"
            });
        }

        if (!OWM_API_KEY) {
            return res.status(500).json({
                status: "error",
                message: "OPENWEATHER_API_KEY is missing in .env"
            });
        }

        const userId = req.user.id || req.user._id;
        let checkedByObjectId = new mongoose.Types.ObjectId(userId);

        // 1. Geocoding Step
        const coords = await fetchCoordinates(cityName, stateName);
        if (!coords) {
            return res.status(404).json({
                status: "fail",
                message: `City '${cityName}' not found by OpenWeatherMap`
            });
        }
        const { lat, lon } = coords;

        // 2. Weather Step
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`;
        const weatherRes = await axios.get(weatherUrl);

        const temperature = weatherRes.data.main.temp;
        const humidity = weatherRes.data.main.humidity;
        const windSpeed = (weatherRes.data.wind && weatherRes.data.wind.speed !== undefined) ? (weatherRes.data.wind.speed * 3.6).toFixed(1) : 0;

        // 3. Normalize state for Django
        let djangoRegion = stateName.toLowerCase().replace(/[\s_-]/g, '');
        if (djangoRegion === 'rajasthan') {
            djangoRegion = 'gujarat';
        } else if (djangoRegion !== 'gujarat' && djangoRegion !== 'maharashtra' && djangoRegion !== 'uttarpradesh') {
            djangoRegion = 'gujarat';
        }

        // 4. Ping Django ML Service
        let basePredictedMW;
        let cityWeight = 1.50;
        let finalScaledMW;
        let uiGridStatus = 'STABLE';

        const djangoResponse = await axios.post(
            'http://127.0.0.1:8000/api/energy/predict/',
            {
                region_zone: djangoRegion,
                temperature: Number(temperature),
                humidity: Number(humidity)
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            }
        );

        if (djangoResponse.data && djangoResponse.data.status === 'success') {
            basePredictedMW = Number(djangoResponse.data.predicted_usage);

            const cleanKey = cityName.replace(/\s*\(.*?\)\s*/g, '').toUpperCase().trim();
            cityWeight = CITY_WEIGHT_MAP[cleanKey] !== undefined ? CITY_WEIGHT_MAP[cleanKey] : 1.50;
            finalScaledMW = Math.round(basePredictedMW * cityWeight);

            if (finalScaledMW > 3500) {
                uiGridStatus = 'CRITICAL_PEAK';
            } else if (finalScaledMW > 2200) {
                uiGridStatus = 'HIGH_LOAD';
            } else {
                uiGridStatus = 'STABLE';
            }
        } else {
            return res.status(502).json({
                status: "error",
                message: "Django predictive microservice returned a non-success response"
            });
        }

        // 5. Log to MongoDB
        const energyLog = new EnergyLog({
            regionZone: stateName,
            city: cityName,
            temperature: Number(temperature),
            humidity: Number(humidity),
            windSpeed: Number(windSpeed),
            predictedLoadMW: finalScaledMW,
            gridStatus: uiGridStatus,
            checkedBy: checkedByObjectId
        });

        await energyLog.save();

        return res.status(200).json({
            status: "success",
            source: "live_pipeline_scaled",
            data: {
                logId: energyLog._id,
                cityName,
                stateName,
                lat,
                lon,
                temperature,
                humidity,
                windSpeed: Number(windSpeed),
                baseModelPredictionMW: basePredictedMW,
                cityMultiplier: cityWeight,
                predictedLoadMW: finalScaledMW,
                gridStatus: uiGridStatus
            }
        });

    } catch (error) {
        console.error("[Predict Live Route Error]", error.message);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

module.exports = router;
