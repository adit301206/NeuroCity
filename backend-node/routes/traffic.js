const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const TrafficLog = require('../models/TrafficLog');
const { protect } = require('../middleware/authMiddleware');

// Configure Multer memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// @route   POST /api/traffic/analyze
// @desc    Process camera snapshot, pipeline to Django AI model, and save telemetry to MongoDB Atlas
router.post('/analyze', protect, upload.single('traffic_image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: "fail", message: "Missing traffic_image file in multipart form-data" });
        }
        
        // Grab camera location from request body or set standard default fallback
        const cameraLocation = req.body.cameraLocation || "Surat_Central_Junction_04";

        // Pack the buffered image file into a FormData instance
        const form = new FormData();
        form.append('image', req.file.buffer, {
            filename: req.file.originalname || 'traffic_capture.jpg',
            contentType: req.file.mimetype
        });

        // Forward to Django REST view via protected internal POST request
        let djangoResponse;
        try {
            djangoResponse = await axios.post('http://127.0.0.1:8000/api/traffic/analyze/', form, {
                headers: {
                    ...form.getHeaders()
                },
                timeout: 15000 // 15 seconds timeout
            });
        } catch (djangoErr) {
            console.error("[Django AI Connection Error]", djangoErr.message);
            return res.status(502).json({
                status: "error",
                message: "Failed to communicate with Django AI microservice.",
                error: djangoErr.message
            });
        }

        const telemetry = djangoResponse.data;

        if (telemetry.status !== 'success') {
            return res.status(502).json({
                status: "error",
                message: "Django AI brain failed to process the image frame.",
                details: telemetry
            });
        }

        // Extract user context from protect middleware
        if (!req.user || (!req.user.id && !req.user._id)) {
            return res.status(401).json({ status: "fail", message: "User context not found on request" });
        }
        const userId = req.user.id || req.user._id;

        let processedByObjectId;
        try {
            processedByObjectId = new mongoose.Types.ObjectId(userId);
        } catch (castErr) {
            return res.status(400).json({ status: "fail", message: "Invalid user ID format" });
        }

        // Build breakdown ensuring safe defaults
        const rawBreakdown = telemetry.vehicle_breakdown || {};
        const vehicleBreakdown = {
            car: rawBreakdown.car || 0,
            bike: rawBreakdown.bike || 0,
            truck: rawBreakdown.truck || 0,
            bus: rawBreakdown.bus || 0,
            auto_rickshaw: rawBreakdown.auto_rickshaw || 0,
            ambulance: rawBreakdown.ambulance || 0
        };

        // Create new TrafficLog record
        const trafficLog = new TrafficLog({
            cameraLocation: cameraLocation,
            totalVehicles: telemetry.total_vehicles_detected || 0,
            congestionIndex: telemetry.congestion_index || 'LOW',
            emergencyOverride: telemetry.emergency_override_triggered || false,
            vehicleBreakdown: vehicleBreakdown,
            processedImageUrl: telemetry.processed_image_url || '',
            processedBy: processedByObjectId
        });

        await trafficLog.save();

        res.status(201).json({
            status: "success",
            message: "Traffic telemetry recorded successfully.",
            data: {
                logId: trafficLog._id,
                cameraLocation: trafficLog.cameraLocation,
                totalVehicles: trafficLog.totalVehicles,
                congestionIndex: trafficLog.congestionIndex,
                emergencyOverride: trafficLog.emergencyOverride,
                vehicleBreakdown: trafficLog.vehicleBreakdown,
                processedImageUrl: trafficLog.processedImageUrl,
                createdAt: trafficLog.createdAt,
                updatedAt: trafficLog.updatedAt
            }
        });

    } catch (error) {
        console.error("[Traffic Route Error]", error.message);
        res.status(500).json({ status: "error", message: "Server breakdown on processing traffic snapshot", error: error.message });
    }
});

// @route   GET /api/traffic/logs
// @desc    Retrieve historical logs from MongoDB Atlas sorted by latest first
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
