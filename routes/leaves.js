// routes/leaves.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');

// @route   POST /api/leaves/apply
// @desc    Apply for a new leave
// @access  Private (Employee)
router.post('/apply', verifyToken, authorizeRole(['Employee']), async (req, res) => {
    // 1. Correctly destructure req.body to match frontend payload
    const { from_date, to_date, return_date, reason, num_days } = req.body;
    // Note: 'leave_type' was present in original backend code but not sent by frontend,
    // so it's removed here for consistency. If you add it to frontend, add it back here.

    const employee_id = req.user.id;

    // --- IMPORTANT: Add these console logs for immediate backend debugging ---
    console.log('--- Incoming Leave Application Request ---');
    console.log('User ID from Token:', employee_id);
    console.log('Request Body (data sent from frontend):', req.body);
    console.log('------------------------------------------');
    // --- End of important console logs ---

    // 2. Updated validation to include return_date and num_days
    if (!from_date || !to_date || !return_date || !reason || num_days === undefined || num_days <= 0) {
        return res.status(400).json({ msg: 'Please provide all required leave details (From Date, To Date, Return Date, Reason, and valid Total Days).' });
    }

    try {
        const pool = await sql.connect();
        await pool.request()
            .input('employee_id', sql.NVarChar(50), employee_id)
            .input('from_date', sql.Date, from_date)
            .input('to_date', sql.Date, to_date)
            .input('return_date', sql.Date, return_date) // Add return_date input
            .input('reason', sql.NVarChar(sql.MAX), reason)
            .input('num_days', sql.Int, num_days) // Add num_days input (assuming INT in DB)
            .input('status', sql.NVarChar(20), 'Pending')
            .query(`INSERT INTO Leave_Applications (employee_id, from_date, to_date, return_date, reason, num_days, status, applied_at)
                    VALUES (@employee_id, @from_date, @to_date, @return_date, @reason, @num_days, @status, GETDATE())`);

        res.status(201).json({ msg: 'Leave application submitted successfully.' });
    } catch (err) {
        // 4. Log the full error object for better backend debugging
        console.error('Error applying for leave:', err); // Log the entire error object, not just err.message
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/leaves/my-applications
// @desc    Get leave applications for the logged-in employee
// @access  Private (Employee)
router.get('/my-applications', verifyToken, authorizeRole(['Employee']), async (req, res) => {
    const employee_id = req.user.id;

    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .input('employee_id', sql.NVarChar(50), employee_id)
            .query(`SELECT leave_id, reason, from_date, to_date, return_date, num_days, status, applied_at, hr_comments, hr_id, hr_decision_at
                    FROM Leave_Applications
                    WHERE employee_id = @employee_id
                    ORDER BY applied_at DESC`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching employee leave applications:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/leaves/pending
// @desc    Get all pending leave applications (for HR to manage)
// @access  Private (HR)
router.get('/pending', verifyToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .query(`SELECT l.*, u.user_id as employee_name
                    FROM Leave_Applications l
                    JOIN Users u ON l.employee_id = u.user_id
                    WHERE l.status = 'Pending'
                    ORDER BY l.applied_at DESC`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching pending leave applications:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/leaves
// @desc    Get all leave applications (for HR to manage, including approved/declined)
// @access  Private (HR)
router.get('/', verifyToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .query(`SELECT l.*, u.user_id as employee_name
                    FROM Leave_Applications l
                    JOIN Users u ON l.employee_id = u.user_id
                    ORDER BY l.applied_at DESC`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching all leave applications:', err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/leaves/:leave_id/status
// @desc    Update leave application status
// @access  Private (HR)
router.put('/:leave_id/status', verifyToken, authorizeRole(['HR']), async (req, res) => {
    const { leave_id } = req.params;
    const { status, hr_comments } = req.body;
    const hr_id = req.user.id;

    if (!status) {
        return res.status(400).json({ msg: 'Status is required.' });
    }

    if (!['Approved', 'Declined', 'Pending'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid leave status.' });
    }

    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .input('leave_id', sql.Int, leave_id)
            .input('status', sql.NVarChar(20), status)
            .input('hr_comments', sql.NVarChar(sql.MAX), hr_comments || null)
            .input('hr_id', sql.NVarChar(50), hr_id)
            .query(`UPDATE Leave_Applications
                    SET status = @status,
                        hr_comments = @hr_comments,
                        hr_id = @hr_id,
                        hr_decision_at = GETDATE()
                    WHERE leave_id = @leave_id`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ msg: 'Leave application not found.' });
        }

        res.json({ msg: `Leave application ${status.toLowerCase()} successfully.` });
    } catch (err) {
        console.error('Error updating leave status:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;