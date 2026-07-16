const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');

// Helper to map Mongoose readyState values to human-readable strings
const getDbStatus = (state) => {
    switch (state) {
        case 0: return 'disconnected';
        case 1: return 'connected';
        case 2: return 'connecting';
        case 3: return 'disconnecting';
        default: return 'unknown';
    }
};

// @route   GET /api/health
// @desc    Gateway status diagnostic endpoint (Mongoose & Django AI Brain)
router.get('/', async (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = getDbStatus(dbState);
    const dbHealthy = dbState === 1;

    let djangoStatus = 'offline';
    let djangoDetails = null;
    let djangoHealthy = false;

    // Async handshake call to Django AI Brain
    try {
        const djangoResponse = await axios.get('http://127.0.0.1:8000/api/complaints/health/', {
            timeout: 5000 // 5 seconds threshold to avoid cascading blockage
        });
        
        if (djangoResponse.status === 200) {
            djangoStatus = 'online';
            djangoDetails = djangoResponse.data;
            // Check if both models are successfully loaded in Django's memory
            if (djangoDetails && djangoDetails.ml_models && 
                djangoDetails.ml_models.triage_rf_model_loaded && 
                djangoDetails.ml_models.tfidf_vectorizer_loaded) {
                djangoHealthy = true;
            }
        } else {
            djangoStatus = 'degraded';
            djangoDetails = djangoResponse.data;
        }
    } catch (error) {
        djangoStatus = 'offline';
        djangoDetails = {
            message: error.message,
            code: error.code || 'CONNECTION_ERROR'
        };
    }

    const overallHealthy = dbHealthy && djangoHealthy;
    const httpStatus = overallHealthy ? 200 : 503;

    res.status(httpStatus).json({
        status: overallHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
            gateway: {
                status: 'online',
                uptime: `${Math.floor(process.uptime())}s`
            },
            database: {
                status: dbStatus,
                readyState: dbState,
                healthy: dbHealthy
            },
            django_ai_brain: {
                status: djangoStatus,
                healthy: djangoHealthy,
                details: djangoDetails
            }
        }
    });
});

module.exports = router;
