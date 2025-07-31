// routes/attendance.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');

const geolib = require('geolib');
const axios = require('axios');

async function getGlobalGeofence() {
    try {
        const response = await axios.get('http://localhost:5000/api/geo-locations');
        return response.data; // Should contain latitude, longitude, radius_meters, location_name
    } catch (error) {
        console.error('Error fetching global geofence:', error.message);
        return null;
    }
}

// @route   POST /api/attendance/mark-present
// @desc    Employee marks themselves as present for the day
// @access  Private (Employee)
router.post('/mark-present', verifyToken, authorizeRole(['Employee']), async (req, res) => {
    const { latitude, longitude } = req.body;
    const employee_id = req.user.id;

    if (!latitude || !longitude) {
        return res.status(400).json({ msg: 'Current location (latitude and longitude) is required to mark attendance.' });
    }

    try {
        const pool = await sql.connect();

        // Get today's date in YYYY-MM-DD format for the attendance_date column
        const today = new Date();
        const attendance_date = today.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

        // Check if employee has already marked 'Present' for today
        const existingAttendance = await pool.request()
            .input('employee_id', sql.NVarChar(50), employee_id)
            .input('attendance_date', sql.Date, attendance_date)
            .query(`SELECT attendance_id FROM Attendance
                    WHERE employee_id = @employee_id
                    AND attendance_date = @attendance_date
                    AND status = 'Present'`);

        if (existingAttendance.recordset.length > 0) {
            return res.status(400).json({ msg: 'You have already marked yourself present for today.' });
        }

        // --- Geofence Check (if applicable) ---
        const globalGeofence = await getGlobalGeofence();

        if (!globalGeofence) {
            console.warn('Company attendance location is not set by HR. Proceeding without geofence check.');
        } else {
            const distance = geolib.getDistance(
                { latitude: globalGeofence.latitude, longitude: globalGeofence.longitude },
                { latitude: latitude, longitude: longitude }
            );

            if (distance > globalGeofence.radius_meters) {
                return res.status(400).json({ msg: `You are outside the allowed attendance zone (${globalGeofence.location_name}). Distance: ${distance.toFixed(2)}m` });
            }
        }
        // --- End Geofence Check ---

        // Fix: Explicitly format time to 'HH:MM:SS' and pass as NVARCHAR
        // Use a function to ensure two digits for hours, minutes, seconds
        const formatTime = (date) => {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        };
        const currentTimeString = formatTime(today); // Get formatted time string

        await pool.request()
            .input('employee_id', sql.NVarChar(50), employee_id)
            .input('attendance_date', sql.Date, attendance_date)
            .input('time_in', sql.NVarChar(8), currentTimeString)
            .input('status', sql.NVarChar(20), 'Present')
            .input('recorded_latitude', sql.Decimal(9, 6), latitude)
            .input('recorded_longitude', sql.Decimal(9, 6), longitude)
            .query(`INSERT INTO Attendance (employee_id, attendance_date, time_in, status, recorded_latitude, recorded_longitude)
                    VALUES (@employee_id, @attendance_date, @time_in, @status, @recorded_latitude, @recorded_longitude)`);

        res.status(201).json({ msg: 'Attendance marked as Present for today!' });

    } catch (err) {
        console.error('Error marking attendance as present:', err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET /api/attendance/my-attendance
// @desc    Get attendance records for the logged-in employee based on the new schema
// @access  Private (Employee)
router.get('/my-attendance', verifyToken, authorizeRole(['Employee']), async (req, res) => {
    const employee_id = req.user.id;
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .input('employee_id', sql.NVarChar(50), employee_id)
            .query(`SELECT attendance_id, attendance_date, time_in, status, recorded_latitude, recorded_longitude, created_at
                    FROM Attendance
                    WHERE employee_id = @employee_id
                    ORDER BY attendance_date DESC, time_in DESC`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching employee attendance:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/attendance
// @desc    Get all attendance records (for HR) - also updated to match new schema
// @access  Private (HR)
router.get('/', verifyToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            // CHANGED: u.username to u.user_id to match your Users table schema
            .query(`SELECT a.attendance_id, a.employee_id, a.attendance_date, a.time_in, a.status, a.recorded_latitude, a.recorded_longitude, a.created_at, u.user_id as employee_name
                    FROM Attendance a
                    JOIN Users u ON a.employee_id = u.user_id
                    ORDER BY attendance_date DESC, time_in DESC`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching all attendance records:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;