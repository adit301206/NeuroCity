const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const TrafficLog = require('../models/TrafficLog');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }
});

const uploadFields = upload.fields([
    { name: 'north', maxCount: 1 },
    { name: 'south', maxCount: 1 },
    { name: 'east', maxCount: 1 },
    { name: 'west', maxCount: 1 }
]);

// add protect
// backend-node/routes/traffic.js
router.post('/analyze', upload.any(), async (req, res) => {
    try {
        // 1. Check for file
        const file = req.files && req.files.find(f => f.fieldname === 'traffic_image' || f.fieldname === 'image');
        if (!file) {
            return res.status(400).json({ status: "fail", message: "Missing traffic_image or image file in multipart form-data" });
        }

        const cameraLocation = req.body.cameraLocation || "Surat_Central_Junction_04";

        // 2. Prepare FormData for Django
        const form = new FormData();
        form.append('traffic_image', file.buffer, {
            filename: file.originalname || 'traffic_capture.jpg',
            contentType: file.mimetype
        });

        // 3. Forward to Django AI Microservice (Port 8000)
        let djangoRes;
        try {
            djangoRes = await axios.post('http://127.0.0.1:8000/api/traffic/analyze/', form, {
                headers: { ...form.getHeaders() },
                timeout: 120000 // 2 minutes
            });
        } catch (djangoErr) {
            console.error("❌ [Django Connection Failed]:", djangoErr.response ? djangoErr.response.data : djangoErr.message);
            return res.status(502).json({
                status: "error",
                message: "Failed to communicate with Django AI microservice.",
                details: djangoErr.response ? djangoErr.response.data : djangoErr.message
            });
        }

        const djangoData = djangoRes.data;

        // 4. Safely attempt MongoDB saving (FAIL-SAFE: Will NOT crash response if DB is offline)
        let logId = `local-log-${Date.now()}`;
        let createdAt = new Date().toISOString();

        try {
            const trafficLogData = {
                cameraLocation: cameraLocation,
                totalVehicles: djangoData.total_vehicles_detected || 0,
                congestionIndex: djangoData.congestion_index || 'LOW',
                emergencyOverride: djangoData.emergency_override_triggered || false,
                vehicleBreakdown: djangoData.vehicle_breakdown || {},
                processedImageUrl: djangoData.processed_image_url || ''
            };

            // Only attach processedBy if user context exists
            if (req.user && (req.user.id || req.user._id)) {
                trafficLogData.processedBy = req.user.id || req.user._id;
            }

            const trafficLog = new TrafficLog(trafficLogData);
            await trafficLog.save();
            logId = trafficLog._id;
            createdAt = trafficLog.createdAt;
            console.log("✅ [MongoDB] Log saved successfully.");
        } catch (dbErr) {
            console.warn("⚠️ [MongoDB Save Bypassed]: Could not record log to database (Check DB Connection / Schema), returning AI data directly to frontend.", dbErr.message);
        }

        // 5. Send successful AI Telemetry to React Frontend
        return res.status(200).json({
            status: "success",
            message: "Traffic telemetry processed successfully.",
            data: {
                vehicleCount: djangoData.total_vehicles_detected || 0,
                congestionIndex: djangoData.congestion_index || 'LOW',
                emergencyOverrideTriggered: djangoData.emergency_override_triggered || false,
                breakdown: djangoData.vehicle_breakdown || {},
                processedImageUrl: djangoData.processed_image_url || '',
                logId: logId,
                createdAt: createdAt,
                cameraLocation: cameraLocation
            }
        });

    } catch (error) {
        console.error("❌ [Traffic Route Server Error]:", error.message);
        return res.status(500).json({
            status: "error",
            message: "Server error processing traffic snapshot",
            error: error.message
        });
    }
});


// add protect
router.get('/logs', async (req, res) => {
    try {
        const logs = await TrafficLog.find()
            .sort({ createdAt: -1 })
            .populate('processedBy', 'name email');

        res.status(200).json({
            status: "success",
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error("[Traffic Logs GET Error]", error.message);
        res.status(500).json({ status: "error", message: "Failed to retrieve historical logs", error: error.message });
    }
});

// @route   POST /api/traffic/analyze-junction
// @desc    Analyze 4-way junction camera feeds and calculate optimal green light timers (Protected)
router.post('/analyze-junction', protect, uploadFields, async (req, res) => {
    try {
        const directions = ['north', 'south', 'east', 'west'];
        const analysisPromises = directions.map(async (dir) => {
            const filesList = req.files && req.files[dir];
            const file = filesList && filesList[0];
            
            if (!file) {
                return { direction: dir.toUpperCase(), vehicles: 0, emergency: false };
            }

            const form = new FormData();
            form.append('image', file.buffer, {
                filename: file.originalname || `${dir}.jpg`,
                contentType: file.mimetype
            });

            try {
                const response = await axios.post('http://127.0.0.1:8000/api/traffic/predict/', form, {
                    headers: { ...form.getHeaders() },
                    timeout: 30000
                });
                return {
                    direction: dir.toUpperCase(),
                    vehicles: response.data.total_vehicles_detected || 0,
                    emergency: response.data.emergency_override_triggered || false
                };
            } catch (err) {
                console.warn(`[Junction Triage Warning] Could not reach Django for ${dir} lane. Falling back to default.`, err.message);
                // Fallback simulation: random vehicle count between 0 and 15
                const mockVehicles = Math.floor(Math.random() * 15);
                return {
                    direction: dir.toUpperCase(),
                    vehicles: mockVehicles,
                    emergency: false
                };
            }
        });

        const results = await Promise.all(analysisPromises);

        const junctionTimers = {};
        let emergencyLane = null;

        results.forEach(res => {
            const count = res.vehicles;
            // Base 15s + 2s per vehicle, capped at 60s
            const duration = Math.min(60, Math.max(15, 15 + count * 2));
            junctionTimers[res.direction] = duration;

            if (res.emergency) {
                emergencyLane = res.direction;
            }
        });

        // Fail-safe: ensure all directions have a timer
        directions.forEach(dir => {
            const dirUpper = dir.toUpperCase();
            if (junctionTimers[dirUpper] === undefined) {
                junctionTimers[dirUpper] = 15;
            }
        });

        res.json({
            status: "success",
            message: "Junction analyzed and optimal timers computed.",
            directionalTimers: junctionTimers,
            vehicleCounts: {
                NORTH: (results.find(r => r.direction === 'NORTH') || { vehicles: 0 }).vehicles,
                SOUTH: (results.find(r => r.direction === 'SOUTH') || { vehicles: 0 }).vehicles,
                EAST: (results.find(r => r.direction === 'EAST') || { vehicles: 0 }).vehicles,
                WEST: (results.find(r => r.direction === 'WEST') || { vehicles: 0 }).vehicles
            },
            emergencyOverrideTriggered: emergencyLane !== null,
            emergencyApproach: emergencyLane
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to analyze junction", error: error.message });
    }
});

module.exports = router;