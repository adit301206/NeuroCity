const mongoose = require('mongoose');

const TrafficLogSchema = new mongoose.Schema({
    cameraLocation: {
        type: String,
        required: [true, 'Please provide the intersection camera location'],
        trim: true
    },
    vehicleCount: {
        type: Number,
        required: [true, 'Vehicle count metric is required'],
        default: 0
    },
    congestionIndex: {
        type: String,
        required: [true, 'Congestion index classification is required'],
        enum: ['LOW', 'MODERATE', 'HEAVY'],
        default: 'LOW'
    },
    emergencyOverrideTriggered: {
        type: Boolean,
        default: false
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TrafficLog', TrafficLogSchema);
