const mongoose = require('mongoose');

const EnergyLogSchema = new mongoose.Schema({
    regionZone: {
        type: String,
        required: [true, 'Please provide the region zone code'],
        trim: true
    },
    city: {
        type: String,
        default: 'Surat'
    },
    temperature: {
        type: Number,
        required: [true, 'Temperature metric is required']
    },
    humidity: {
        type: Number,
        required: [true, 'Humidity metric is required']
    },
    windSpeed: {
        type: Number,
        default: 0
    },
    hour: {
        type: Number,
        default: 12
    },
    month: {
        type: Number,
        default: 6
    },
    predictedLoadMW: {
        type: Number,
        required: [true, 'Predicted load in megawatts is required']
    },
    gridStatus: {
        type: String,
        required: [true, 'Grid status classification is required'],
        enum: ['NORMAL', 'STRESSED', 'CRITICAL', 'STABLE', 'MODERATE_HIGH', 'CRITICAL_PEAK'],
        default: 'NORMAL'
    },
    checkedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('EnergyLog', EnergyLogSchema);
