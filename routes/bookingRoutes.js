const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware'); // Import the protection middleware


const router = express.Router();

// --- Helper Function to get active queue ---
const getActiveQueue = async () => {
    return await Booking.find({ status: 'Waiting' }).sort({ bookingTime: 1 });
};

// --- Patient Routes ---

// POST /api/bookings - Create a new booking
router.post('/bookings', async (req, res) => {
    try {
        const { patientName } = req.body;
        if (!patientName || patientName.trim() === '') {
            return res.status(400).json({ message: 'Patient name is required.' });
        }

        const newBooking = new Booking({
            patientName: patientName.trim(),
            bookingId: uuidv4().substring(0, 8), // Short, unique ID
        });

        await newBooking.save();
        res.status(201).json({
            message: 'Booking successful!',
            bookingId: newBooking.bookingId,
            patientName: newBooking.patientName,
        });
    } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({ message: 'Server error during booking.' });
    }
});

// GET /api/queue - View current active queue (simplified for patient view)
router.get('/queue', async (req, res) => {
    try {
        const activeQueue = await getActiveQueue();
        const patientView = activeQueue.map((booking, index) => ({
            position: index + 1,
        }));
        res.json({
            queue: patientView,
            currentPatient: activeQueue.length > 0 ? `Patient #${activeQueue[0].bookingId.substring(0, 4)}` : "No patients waiting", // Mask name
            nextPatient: activeQueue.length > 1 ? `Patient #${activeQueue[1].bookingId.substring(0, 4)}` : "No next patient", // Mask name
            totalWaiting: activeQueue.length
        });
    } catch (error) {
        console.error("Get queue error:", error);
        res.status(500).json({ message: 'Server error fetching queue.' });
    }
});

// GET /api/bookings/:bookingId - Check status of a specific booking
router.get('/bookings/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findOne({ bookingId });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        if (booking.status === 'Waiting') {
            const activeQueue = await getActiveQueue();
            const position = activeQueue.findIndex(b => b.bookingId === bookingId) + 1;
            res.json({
                patientName: booking.patientName,
                status: booking.status,
                position: position > 0 ? position : 'Not in active queue', // Should be > 0 if status is Waiting
                bookingTime: booking.bookingTime,
                bookingId: booking.bookingId, // Include bookingId in response
            });
        } else {
            res.json({
                patientName: booking.patientName,
                status: booking.status,
                position: null, // Not applicable if Done or Cancelled
                bookingTime: booking.bookingTime,
                bookingId: booking.bookingId, // Include bookingId in response
            });
        }
    } catch (error) {
        console.error("Check status error:", error);
        res.status(500).json({ message: 'Server error checking status.' });
    }
});

// DELETE /api/bookings/:bookingId - Cancel a booking
router.delete('/bookings/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const result = await Booking.findOneAndUpdate(
            { bookingId: bookingId, status: 'Waiting' },
            { status: 'Cancelled' },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'Active booking not found or already processed.' });
        }
        res.json({ message: 'Booking successfully cancelled.' });
    } catch (error) {
        console.error("Cancel booking error:", error);
        res.status(500).json({ message: 'Server error cancelling booking.' });
    }
});


// --- Admin Routes ---
// GET /api/admin/queue
router.get('/admin/queue', protect, async (req, res) => { // <-- Added 'protect'
    try {
        const activeQueue = await getActiveQueue();
        res.json(activeQueue.map(b => ({
            _id: b._id,
            patientName: b.patientName,
            bookingTime: b.bookingTime,
            bookingId: b.bookingId
        })));
    } catch (error) {
        console.error("Admin get queue error:", error);
        res.status(500).json({ message: 'Server error fetching admin queue.' });
    }
});

// PATCH /api/admin/bookings/:id/done
router.patch('/admin/bookings/:id/done', protect, async (req, res) => { // <-- Added 'protect'
    try {
        const { id } = req.params;
        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            { status: 'Done' },
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        res.json({ message: `Patient ${updatedBooking.patientName} marked as done.` });
    } catch (error) {
        console.error("Mark done error:", error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid booking ID format.' });
        }
        res.status(500).json({ message: 'Server error marking booking as done.' });
    }
});



module.exports = router;