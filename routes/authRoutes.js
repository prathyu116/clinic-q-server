// server/routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Retrieve stored admin credentials (INSECURELY stored in .env for demo)
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD; // This is the HASH

    if (!adminUsername || !adminPasswordHash) {
        console.error("Admin credentials not set in .env");
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    // Compare provided username and compare password hash
    const isUsernameMatch = username === adminUsername;
    const isPasswordMatch = await bcrypt.compare(password, adminPasswordHash);

    if (isUsernameMatch && isPasswordMatch) {
        // Credentials match - Generate JWT
        const token = jwt.sign(
            { username: adminUsername, role: 'admin' }, // Payload
            process.env.JWT_SECRET,                      // Secret
            { expiresIn: process.env.JWT_EXPIRES_IN }    // Expiry
        );

        // Set JWT as an HTTP-Only cookie
        res.cookie('token', token, {
            httpOnly: true, // Cannot be accessed by client-side JS
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 60 * 60 * 1000 || 3600000, // Cookie expiry in ms
        });

        res.json({ message: 'Login successful' });

    } else {
        // Credentials don't match
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    // Clear the cookie by setting an expired one
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0), // Set expiry date to the past
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });
    res.status(200).json({ message: 'Logout successful' });
});

// GET /api/auth/status (Optional: Check if user is logged in)
router.get('/status', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(200).json({ isAuthenticated: false });
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ isAuthenticated: true });
    } catch (error) {
        // If token is invalid/expired, clear it
        res.cookie('token', '', { httpOnly: true, expires: new Date(0), secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
        res.status(200).json({ isAuthenticated: false });
    }
});


module.exports = router;
