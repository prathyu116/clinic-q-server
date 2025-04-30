const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    patientName: {
        type: String,
        required: true,
        trim: true,
    },
    bookingTime: {
        type: Date,
        default: Date.now,
    },
    // Unique, user-friendly ID for patients to check/cancel
    bookingId: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['Waiting', 'Done', 'Cancelled'],
        default: 'Waiting',
    },
    // Position will be calculated dynamically, not stored
});

// Ensure faster lookups by status and bookingTime
bookingSchema.index({ status: 1, bookingTime: 1 });
bookingSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);