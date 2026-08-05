const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Links this record to the registered Citizen who made it
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please provide a short summary/title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please type your complaint description'],
        trim: true
    },
    location: {
        type: String, // E.g., "Ghod Dod Road, Surat"
        required: true
    },
    category: {
        type: String,
        default: 'Unclassified'
    },
    priority: {
        type: Number, // Computed by Django and updated automatically
        default: 1
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Urgent'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Complaint', ComplaintSchema);