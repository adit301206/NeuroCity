const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const { sendOtpEmail, sendWelcomeEmail } = require('../utils/nodemailerEmail');

const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'neurocity_jwt_secret_key_2026';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// Google Auth Endpoint (GET status check)
router.get('/google', (req, res) => {
    res.json({
        status: "success",
        message: "Google Authentication API is active. Send a POST request with Google idToken or credentials to authenticate."
    });
});

// Google Auth Endpoint (POST authentication)
router.post('/google', async (req, res) => {
    try {
        const { idToken, googleUser } = req.body;
        let email, name;

        if (idToken && process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('your_google_client_id')) {
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                const payload = ticket.getPayload();
                email = payload.email;
                name = payload.name;
            } catch (vErr) {
                console.warn('Google ID token verification failed:', vErr.message);
                if (googleUser && googleUser.email) {
                    email = googleUser.email;
                    name = googleUser.name || email.split('@')[0];
                }
            }
        } else if (googleUser && googleUser.email) {
            email = googleUser.email;
            name = googleUser.name || email.split('@')[0];
        }

        if (!email) {
            return res.status(400).json({ status: "fail", message: 'Invalid Google authentication data provided' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            const randomPassword = 'goog_' + Math.random().toString(36).substring(2, 12);
            user = await User.create({
                name: name || normalizedEmail.split('@')[0],
                email: normalizedEmail,
                password: randomPassword,
                role: 'citizen',
                isVerified: true
            });
        }

        const token = generateToken(user._id);

        res.json({
            status: "success",
            token,
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

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Basic input validation
        if (!name || !email || !password) {
            return res.status(400).json({ status: "fail", message: 'Please provide name, email, and password' });
        }

        if (password.length < 6) {
            return res.status(400).json({ status: "fail", message: 'Password must be at least 6 characters long' });
        }

        if (role && !['citizen', 'operator', 'admin'].includes(role)) {
            return res.status(400).json({ status: "fail", message: "Invalid role value. Must be 'citizen', 'operator', or 'admin'" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        
        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            return res.status(400).json({ status: "fail", message: 'Email already registered' });
        }
        
        user = new User({ 
            name, 
            email: normalizedEmail, 
            password, 
            role: role || 'citizen' 
        });
        
        await user.save();
        
        const userData = { 
            id: user._id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
        };
        
        res.status(201).json({
            status: "success",
            token: generateToken(user._id),
            user: userData,
            data: userData
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ status: "fail", message: error.message });
        }
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ status: "fail", message: 'Please provide email and password' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        
        if (!user || !(await user.matchPassword(password))) {
            return res.status(400).json({ status: "fail", message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ status: "fail", message: 'Please verify your email address before logging in' });
        }
        
        const userData = { 
            id: user._id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
        };
        
        res.json({
            status: "success",
            token: generateToken(user._id),
            user: userData,
            data: userData
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Forgot / Reset Password Endpoint
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ status: "fail", message: 'Please provide both registered email address and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ status: "fail", message: 'New password must be at least 6 characters long' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ status: "fail", message: 'No account found with this email address' });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            status: "success",
            message: 'Password reset successfully. You can now log in with your new password.'
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.post('/forgot-password', async (req, res) => {
    // Alias for reset-password
    try {
        const { email, newPassword } = req.body;

        if (!email) {
            return res.status(400).json({ status: "fail", message: 'Please provide your registered email address' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ status: "fail", message: 'No account found with this email address' });
        }

        if (!newPassword) {
            // Email verification check step
            return res.json({
                status: "success",
                message: 'Account verified. You may proceed to enter your new password.',
                userExists: true
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ status: "fail", message: 'New password must be at least 6 characters long' });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            status: "success",
            message: 'Password reset successfully. You can now log in with your new password.'
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});


// Change Password Endpoint
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ status: "fail", message: 'Please provide both current password and new password' });
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
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Update Profile Details Endpoint
router.put('/update-profile', protect, async (req, res) => {
    try {
        const { name, email } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ status: "fail", message: 'User not found' });
        }

        if (name) user.name = name.trim();
        if (email) user.email = email.toLowerCase().trim();

        await user.save();

        res.json({
            status: "success",
            message: 'Profile details updated successfully',
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

// Delete Account Endpoint
router.delete('/delete-account', protect, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ status: "fail", message: 'Please provide your current password to confirm account deletion' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ status: "fail", message: 'User not found' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ status: "fail", message: 'Incorrect password. Account deletion cancelled.' });
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


// @route   POST /api/auth/signup/request-otp
// @desc    Register user details, hash password and OTP, save pending user, send verification OTP
router.post('/signup/request-otp', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ status: "fail", message: 'Please provide name, email, and password' });
        }

        if (password.length < 6) {
            return res.status(400).json({ status: "fail", message: 'Password must be at least 6 characters long' });
        }

        if (role && !['citizen', 'operator', 'admin'].includes(role)) {
            return res.status(400).json({ status: "fail", message: "Invalid role value" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            if (user.isVerified) {
                return res.status(400).json({ status: "fail", message: 'Email already registered and verified' });
            }
            // User exists but is unverified - update their details and set new OTP
            user.name = name;
            user.password = password; // pre-save hook will hash this automatically
            user.role = role || 'citizen';
        } else {
            // Create a new unverified user
            user = new User({
                name,
                email: normalizedEmail,
                password,
                role: role || 'citizen',
                isVerified: false
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hash OTP and save with 10 minutes expiry
        const otpSalt = await bcrypt.genSalt(10);
        user.otpCode = await bcrypt.hash(otp, otpSalt);
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        await user.save();

        // Send OTP email
        await sendOtpEmail(normalizedEmail, otp, 'signup');

        res.json({
            status: "success",
            message: 'Verification OTP has been sent to your email address. It is valid for 10 minutes.'
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// @route   POST /api/auth/signup/verify-otp
// @desc    Validate signup OTP, set isVerified: true, send welcome email, and log in user (return JWT)
router.post('/signup/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ status: "fail", message: 'Please provide email and verification OTP' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ status: "fail", message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ status: "fail", message: 'User is already verified' });
        }

        if (!user.otpCode || !user.otpExpiresAt) {
            return res.status(400).json({ status: "fail", message: 'No OTP requested for this user' });
        }

        if (new Date() > user.otpExpiresAt) {
            return res.status(400).json({ status: "fail", message: 'Verification OTP code has expired' });
        }

        const isMatch = await bcrypt.compare(otp, user.otpCode);
        if (!isMatch) {
            return res.status(400).json({ status: "fail", message: 'Incorrect verification OTP code' });
        }

        // Set verified, clear OTP fields
        user.isVerified = true;
        user.otpCode = undefined;
        user.otpExpiresAt = undefined;

        await user.save();

        // Send welcome email
        await sendWelcomeEmail(normalizedEmail, user.name);

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.json({
            status: "success",
            message: 'Email verification successful. Account activated.',
            token: generateToken(user._id),
            user: userData,
            data: userData
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// @route   POST /api/auth/forgot-password/request-otp
// @desc    Generate password reset OTP, save expiry, send reset OTP email
router.post('/forgot-password/request-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ status: "fail", message: 'Please provide your registered email address' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ status: "fail", message: 'No account found with this email address' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP and save with 10 minutes expiry
        const otpSalt = await bcrypt.genSalt(10);
        user.otpCode = await bcrypt.hash(otp, otpSalt);
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        await user.save();

        // Send password reset OTP email
        await sendOtpEmail(normalizedEmail, otp, 'reset');

        res.json({
            status: "success",
            message: 'Password reset OTP has been sent to your email address. It is valid for 10 minutes.'
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// @route   POST /api/auth/forgot-password/reset-password
// @desc    Validate reset OTP, update user password, clear OTP
router.post('/forgot-password/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ status: "fail", message: 'Please provide email, reset OTP, and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ status: "fail", message: 'New password must be at least 6 characters long' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ status: "fail", message: 'User not found' });
        }

        if (!user.otpCode || !user.otpExpiresAt) {
            return res.status(400).json({ status: "fail", message: 'No password reset requested for this account' });
        }

        if (new Date() > user.otpExpiresAt) {
            return res.status(400).json({ status: "fail", message: 'Password reset OTP code has expired' });
        }

        const isMatch = await bcrypt.compare(otp, user.otpCode);
        if (!isMatch) {
            return res.status(400).json({ status: "fail", message: 'Incorrect reset OTP code' });
        }

        // Update password and clear OTP fields
        user.password = newPassword; // pre-save hook will hash this automatically
        user.otpCode = undefined;
        user.otpExpiresAt = undefined;

        await user.save();

        res.json({
            status: "success",
            message: 'Password has been reset successfully. You can now log in with your new credentials.'
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

module.exports = router;