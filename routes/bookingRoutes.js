const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');

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
            // Optional: return masked name or just position for privacy
            // patientName: `Patient #${index + 1}`
        }));
        res.json({
            queue: patientView,
            currentPatient: activeQueue.length > 0 ? activeQueue[0].patientName : "No patients waiting",
            nextPatient: activeQueue.length > 1 ? activeQueue[1].patientName : "No next patient",
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
            });
        } else {
            res.json({
                patientName: booking.patientName,
                status: booking.status,
                position: null, // Not applicable if Done or Cancelled
                bookingTime: booking.bookingTime,
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
        // Option 1: Delete the booking
        // const result = await Booking.findOneAndDelete({ bookingId: bookingId, status: 'Waiting' });

        // Option 2: Mark as Cancelled (better for history)
        const result = await Booking.findOneAndUpdate(
            { bookingId: bookingId, status: 'Waiting' },
            { status: 'Cancelled' },
            { new: true } // Return the updated document
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

// GET /api/admin/queue - Get detailed active queue for admin
router.get('/admin/queue', async (req, res) => {
    try {
        const activeQueue = await getActiveQueue();
        // Return necessary details including MongoDB _id for marking done
        res.json(activeQueue.map(b => ({
            _id: b._id, // Important for marking done
            patientName: b.patientName,
            bookingTime: b.bookingTime,
            bookingId: b.bookingId
        })));
    } catch (error) {
        console.error("Admin get queue error:", error);
        res.status(500).json({ message: 'Server error fetching admin queue.' });
    }
});

// PATCH /api/admin/bookings/:id/done - Mark patient as done (using MongoDB _id)
router.patch('/admin/bookings/:id/done', async (req, res) => {
    try {
        const { id } = req.params; // This is the MongoDB _id

        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            { status: 'Done' },
            { new: true } // Return the updated document
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        // Optional: Could trigger something here (e.g., notify next patient via websockets later)

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