const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

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
        
        res.status(201).json({
            status: "success",
            token: generateToken(user._id),
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            }
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
        
        res.json({
            status: "success",
            token: generateToken(user._id),
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

module.exports = router;