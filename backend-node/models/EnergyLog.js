const mongoose = require('mongoose');

const EnergyLogSchema = new mongoose.Schema({
    regionZone: {
        type: String,
        required: [true, 'Please provide the region zone code'],
        trim: true
    },
    temperature: {
        type: Number,
        required: [true, 'Temperature metric is required']
    },
    humidity: {
        type: Number,
        required: [true, 'Humidity metric is required']
    },
    predictedLoadMW: {
        type: Number,
        required: [true, 'Predicted load in megawatts is required']
    },
    gridStatus: {
        type: String,
        required: [true, 'Grid status classification is required'],
        enum: ['NORMAL', 'STRESSED', 'CRITICAL'],
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
