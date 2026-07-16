const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const TrafficLog = require('../models/TrafficLog');
const { protect } = require('../middleware/authMiddleware');

// Configure Multer memory storage to buffer the file without leaving disk footprints
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB file size ceiling
});

// @route   POST /api/traffic/analyze
// @desc    Process camera snapshot, pipeline to Django AI model, and save telemetry to MongoDB Atlas
router.post('/analyze', protect, upload.single('traffic_image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: "fail", message: "Missing traffic_image file in multipart form-data" });
        }
        
        // Grab camera location from request body or set standard fallback
        const cameraLocation = req.body.cameraLocation || "Unknown Intersection";

        // Pack the buffered image file into a standard FormData instance using the form-data library
        const form = new FormData();
        form.append('image', req.file.buffer, {
            filename: req.file.originalname || 'traffic_capture.jpg',
            contentType: req.file.mimetype
        });

        // Forward to Django REST view via protected internal POST request
        let djangoResponse;
        try {
            djangoResponse = await axios.post('http://127.0.0.1:8000/api/traffic/predict/', form, {
                headers: {
                    ...form.getHeaders()
                },
                timeout: 15000 // 15 seconds threshold
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

        // Map the dynamic calculation objects and save to MongoDB Atlas
        // congestionIndex must be mapped to ENUM ['LOW', 'MODERATE', 'HEAVY'].
        // Django returns: LOW, MODERATE, HEAVY. If Django returns 'MEDIUM', map it to 'MODERATE'.
        let mappedCongestion = telemetry.congestion_index || 'LOW';
        if (mappedCongestion === 'MEDIUM') {
            mappedCongestion = 'MODERATE';
        }

        const trafficLog = new TrafficLog({
            cameraLocation: cameraLocation,
            vehicleCount: telemetry.total_vehicles_detected || 0,
            congestionIndex: mappedCongestion,
            emergencyOverrideTriggered: telemetry.emergency_override_triggered || false,
            processedBy: req.user.id
        });

        await trafficLog.save();

        res.status(201).json({
            status: "success",
            message: "Traffic telemetry recorded successfully.",
            data: {
                logId: trafficLog._id,
                cameraLocation: trafficLog.cameraLocation,
                vehicleCount: trafficLog.vehicleCount,
                congestionIndex: trafficLog.congestionIndex,
                emergencyOverrideTriggered: trafficLog.emergencyOverrideTriggered,
                createdAt: trafficLog.createdAt,
                breakdown: telemetry.vehicle_breakdown
            }
        });

    } catch (error) {
        console.error("[Traffic Route Error]", error.message);
        res.status(500).json({ status: "error", message: "Server breakdown on processing traffic snapshot", error: error.message });
    }
});

module.exports = router;
