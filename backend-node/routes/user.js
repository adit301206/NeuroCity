const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ status: "fail", message: 'User not found' });
        }

        if (name) user.name = name.trim();
        if (email) {
            const normalizedEmail = email.toLowerCase().trim();
            // Check if email already exists
            const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
            if (emailExists) {
                return res.status(400).json({ status: "fail", message: 'Email address already in use' });
            }
            user.email = normalizedEmail;
        }

        await user.save();

        res.json({
            status: "success",
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
router.put('/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ status: "fail", message: 'Please provide both current and new passwords' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ status: "fail", message: 'New password must be at least 6 characters long' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ status: "fail", message: 'User not found' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ status: "fail", message: 'Incorrect current password' });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            status: "success",
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// @desc    Delete user account
// @route   DELETE /api/users/profile
// @access  Private
router.delete('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ status: "fail", message: 'User not found' });
        }

        // Check if they pass a confirmation password
        const { password } = req.body;
        if (password) {
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(400).json({ status: "fail", message: 'Incorrect password. Account deletion cancelled.' });
            }
        }

        await User.findByIdAndDelete(req.user._id);

        res.json({
            status: "success",
            message: 'Account deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

module.exports = router;
