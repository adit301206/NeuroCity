const mongoose = require('mongoose');

const TrafficLogSchema = new mongoose.Schema({
    cameraLocation: {
        type: String,
        default: 'Surat_Central_Junction_04',
        trim: true
    },
    totalVehicles: {
        type: Number,
        required: [true, 'Total vehicles count metric is required'],
        default: 0
    },
    congestionIndex: {
        type: String,
        required: [true, 'Congestion index classification is required'],
        enum: ['LOW', 'MEDIUM', 'HEAVY'],
        default: 'LOW'
    },
    emergencyOverride: {
        type: Boolean,
        default: false
    },
    vehicleBreakdown: {
        car: { type: Number, default: 0 },
        bike: { type: Number, default: 0 },
        truck: { type: Number, default: 0 },
        bus: { type: Number, default: 0 },
        auto_rickshaw: { type: Number, default: 0 },
        ambulance: { type: Number, default: 0 }
    },
    processedImageUrl: {
        type: String,
        default: ''
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TrafficLog', TrafficLogSchema);
