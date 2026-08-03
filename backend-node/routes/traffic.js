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

module.exports = router;