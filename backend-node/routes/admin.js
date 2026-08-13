const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get database collection statistics and records
// @route   GET /api/admin/database
// @access  Private (Admin Only)
router.get('/database', protect, async (req, res) => {
    try {
        // Double-check role from request user (attached by protect middleware)
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'fail',
                message: 'Access denied: Admin clearance required'
            });
        }

        // Fetch statistics for Users
        const totalUsers = await User.countDocuments();
        const citizenCount = await User.countDocuments({ role: 'citizen' });
        const operatorCount = await User.countDocuments({ role: 'operator' });
        const adminCount = await User.countDocuments({ role: 'admin' });

        // Fetch statistics for Complaints
        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
        const inProgressComplaints = await Complaint.countDocuments({ status: 'In Progress' });
        const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
        const urgentComplaints = await Complaint.countDocuments({ status: 'Urgent' });

        // Fetch all documents (passwords and verification codes excluded for security)
        const users = await User.find({}, '-password -otpCode -otpExpiresAt').sort({ createdAt: -1 });
        const complaints = await Complaint.find().populate('user', 'name email role').sort({ createdAt: -1 });

        res.json({
            status: 'success',
            data: {
                stats: {
                    users: {
                        total: totalUsers,
                        citizen: citizenCount,
                        operator: operatorCount,
                        admin: adminCount
                    },
                    complaints: {
                        total: totalComplaints,
                        pending: pendingComplaints,
                        inProgress: inProgressComplaints,
                        resolved: resolvedComplaints,
                        urgent: urgentComplaints
                    }
                },
                collections: {
                    users,
                    complaints
                }
            }
        });
    } catch (error) {
        console.error('[Admin Database Inspector API Error]:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve database collections'
        });
    }
});

module.exports = router;
