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

router.post('/analyze', protect, upload.any(), async (req, res) => {
    try {
        const file = req.files && req.files.find(f => f.fieldname === 'traffic_image' || f.fieldname === 'image');
        if (!file) {
            return res.status(400).json({ status: "fail", message: "Missing traffic_image or image file in multipart form-data" });
        }

        const cameraLocation = req.body.cameraLocation || "Surat_Central_Junction_04";

        const form = new FormData();
        form.append('traffic_image', file.buffer, {
            filename: file.originalname || 'traffic_capture.jpg',
            contentType: file.mimetype
        });

        // Django REST endpoint call with 120s connection timeout
        const djangoRes = await axios.post('http://127.0.0.1:8000/api/v1/traffic/analyze/', form, {
            headers: { ...form.getHeaders() },
            timeout: 120000
        });

        const djangoData = djangoRes.data;

        // Save to MongoDB Atlas
        const trafficLog = new TrafficLog({
            cameraLocation: cameraLocation,
            totalVehicles: djangoData.total_vehicles_detected || 0,
            congestionIndex: djangoData.congestion_index || 'LOW',
            emergencyOverride: djangoData.emergency_override_triggered || false,
            vehicleBreakdown: djangoData.vehicle_breakdown || {},
            processedImageUrl: djangoData.processed_image_url || '',
            processedBy: req.user ? req.user._id : null
        });

        await trafficLog.save();

        return res.status(200).json({
            status: "success",
            message: "Traffic telemetry recorded successfully.",
            data: {
                vehicleCount: djangoData.total_vehicles_detected || 0,
                congestionIndex: djangoData.congestion_index || 'LOW',
                emergencyOverrideTriggered: djangoData.emergency_override_triggered || false,
                breakdown: djangoData.vehicle_breakdown || {},
                processedImageUrl: djangoData.processed_image_url || '',
                logId: trafficLog._id,
                createdAt: trafficLog.createdAt,
                cameraLocation: trafficLog.cameraLocation
            }
        });

    } catch (error) {
        console.error("[Traffic Route Error]", error.message);
        res.status(500).json({
            status: "error",
            message: "Server breakdown on processing traffic snapshot",
            error: error.response ? error.response.data : error.message
        });
    }
});

router.get('/logs', protect, async (req, res) => {
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