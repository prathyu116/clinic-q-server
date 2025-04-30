// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Import cookie-parser

const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes'); // Import auth routes

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// --- Database Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- Middleware ---
// Configure CORS to allow credentials (cookies) from your frontend origin
app.use(cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true, // Allow cookies
}));
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware

// --- Routes ---
app.use('/api/auth', authRoutes); // Mount auth routes (public)
app.use('/api', bookingRoutes); // Mount booking routes (some parts will be protected)

// --- Basic Error Handler ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});