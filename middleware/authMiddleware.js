// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const token = req.cookies.token; // Get token from cookie

    console.log('Token from cookie:', token); // Debugging line

    if (token) {
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // You could potentially attach user info to req if needed: req.user = decoded;
            next(); // User is authenticated
        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };