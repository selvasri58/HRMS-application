// hrms-backend/routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const { sql } = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');

// Helper function to calculate working days (excluding weekends)
const calculateWorkingDays = (startDate, endDate) => {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let days = 0;
    while (start <= end) {
        let dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Saturday (6) and Sunday (0)
            days++;
        }
        start.setDate(start.getDate() + 1);
    }
    return days;
};

// @route   POST /api/leaves/apply
// @desc    Employee applies for leave
// @access  Private (only accessible by Employee role)
router.post('/apply', authenticateToken, authorize(['Employee']), async (req, res) => {
    // UPDATED: Destructure new fields: return_date and num_days
    const { from_date, to_date, return_date, reason, num_days } = req.body;
    const employeeId = req.user.id; // Get employee ID from authenticated token

    // UPDATED: Include new fields in validation
    if (!from_date || !to_date || !return_date || !reason || num_days === undefined || num_days === null) {
        return res.status(400).json({ msg: 'Please provide from date, to date, return date, reason, and total number of days for leave.' });
    }

    // Convert dates to Date objects for calculation (already done in frontend, but good to ensure on backend)
    const startDateObj = new Date(from_date);
    const endDateObj = new Date(to_date);
    const returnDateObj = new Date(return_date); // NEW: returnDateObj

    // Basic date validation (kept for robustness, though frontend does this too)
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime()) || isNaN(returnDateObj.getTime())) {
        return res.status(400).json({ msg: 'Invalid date format provided for one or more dates.' });
    }
    if (startDateObj > endDateObj) {
        return res.status(400).json({ msg: 'Start date cannot be after end date.' });
    }
    if (returnDateObj <= endDateObj) { // NEW: Validate return date logic
        return res.status(400).json({ msg: 'Return date must be after the to date.' });
    }

    // You can optionally recalculate numDays here to ensure backend consistency
    // const calculatedNumDays = calculateWorkingDays(startDateObj, endDateObj);
    // if (calculatedNumDays !== num_days) {
    //     console.warn(`Frontend calculated ${num_days} days, backend calculated ${calculatedNumDays}.`);
    //     // You might want to return an error or use the backend-calculated value.
    // }

    // No need to recalculate numDays here if we trust the frontend calculation,
    // as it's being sent from the frontend.
    // The previous error was because 'return_date' was NOT NULL in DB but NULL in insert statement.

    try {
        const request = new sql.Request();
        const result = await request.query`
            INSERT INTO Leave_Applications (employee_id, from_date, to_date, return_date, reason, num_days, status, applied_at)
            VALUES (
                ${employeeId},
                ${from_date},
                ${to_date},
                ${return_date}, -- NEW: Insert return_date
                ${reason},
                ${num_days},    -- NEW: Insert num_days
                'Pending',
                GETDATE()
            );
            SELECT SCOPE_IDENTITY() AS leave_id; -- To get the ID of the newly inserted row
        `;

        res.status(201).json({ msg: 'Leave request submitted successfully.', leave_id: result.recordset[0].leave_id, num_days: num_days });

    } catch (err) {
        console.error('Error submitting leave request:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/leaves/my
// @desc    Employee views their own leave requests
// @access  Private (only accessible by Employee role)
router.get('/my', authenticateToken, authorize(['Employee']), async (req, res) => {
    const employeeId = req.user.id; // Get employee ID from authenticated token

    try {
        const request = new sql.Request();
        const result = await request.query`
            SELECT
                leave_id,
                employee_id,
                from_date,
                to_date,
                return_date,    -- NEW: Select return_date
                reason,
                num_days,       -- NEW: Select num_days
                status,
                applied_at,
                hr_id,          -- Maps to reviewed_by_hr_id
                hr_decision_at, -- Maps to reviewed_at
                hr_comments     -- Assuming this column exists, otherwise remove
            FROM Leave_Applications
            WHERE employee_id = ${employeeId}
            ORDER BY applied_at DESC;
        `;

        // We already have num_days from the DB now, so no need to recalculate if stored
        // If num_days is NOT stored in the DB, then uncomment the recalculation
        // const leavesWithDays = result.recordset.map(leave => ({
        //     ...leave,
        //     num_days: calculateWorkingDays(leave.from_date, leave.to_date)
        // }));

        res.json(result.recordset); // Send result.recordset directly if num_days is in DB

    } catch (err) {
        console.error('Error fetching employee leave history:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/leaves/pending
// @desc    HR views all pending leave requests
// @access  Private (only accessible by HR role)
router.get('/pending', authenticateToken, authorize(['HR']), async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query`
            SELECT
                lr.leave_id,
                lr.employee_id,
                u.role AS employee_role, -- Added to confirm it's an employee
                lr.from_date,
                lr.to_date,
                lr.return_date,    -- NEW: Select return_date
                lr.reason,
                lr.num_days,       -- NEW: Select num_days
                lr.status,
                lr.applied_at
                -- Don't show hr_id, hr_decision_at, hr_comments for pending requests
            FROM Leave_Applications lr
            INNER JOIN Users u ON lr.employee_id = u.user_id
            WHERE lr.status = 'Pending'
            ORDER BY lr.applied_at ASC;
        `;
        // We already have num_days from the DB now, so no need to recalculate if stored
        // const leavesWithDays = result.recordset.map(leave => ({
        //     ...leave,
        //     num_days: calculateWorkingDays(leave.from_date, leave.to_date)
        // }));

        res.json(result.recordset); // Send result.recordset directly if num_days is in DB
    } catch (err) {
        console.error('Error fetching pending leave requests for HR:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/leaves/all
// @desc    HR views all leave requests (pending, approved, declined)
// @access  Private (only accessible by HR role)
router.get('/all', authenticateToken, authorize(['HR']), async (req, res) => {
    try {
        const request = new sql.Request();
        const result = await request.query(`
            SELECT
                lr.leave_id,
                lr.employee_id,
                u.role AS employee_role,
                lr.from_date,
                lr.to_date,
                lr.return_date,    -- NEW: Select return_date
                lr.reason,
                lr.num_days,       -- NEW: Select num_days
                lr.status,
                lr.applied_at,
                lr.hr_id,          -- Maps to reviewed_by_hr_id
                lr.hr_decision_at, -- Maps to reviewed_at
                lr.hr_comments     -- Assuming this column exists, otherwise remove
            FROM Leave_Applications lr
            INNER JOIN Users u ON lr.employee_id = u.user_id
            ORDER BY lr.applied_at DESC;
        `);
        // We already have num_days from the DB now, so no need to recalculate if stored
        // const leavesWithDays = result.recordset.map(leave => ({
        //     ...leave,
        //     num_days: calculateWorkingDays(leave.from_date, leave.to_date)
        // }));
        res.json(result.recordset); // Send result.recordset directly if num_days is in DB
    } catch (err) {
        console.error('Error fetching all leave requests for HR:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/leaves/:leaveId/status
// @desc    HR approves or declines a leave request
// @access  Private (only accessible by HR role)
router.put('/:leaveId/status', authenticateToken, authorize(['HR']), async (req, res) => {
    const { leaveId } = req.params;
    const { status, hr_comments } = req.body; // status should be 'Approved' or 'Declined'
    const hrId = req.user.id; // Get HR ID from authenticated token

    if (!status || (status !== 'Approved' && status !== 'Declined')) {
        return res.status(400).json({ msg: 'Invalid status provided. Must be "Approved" or "Declined".' });
    }

    try {
        const request = new sql.Request();
        const result = await request.query`
            UPDATE Leave_Applications
            SET
                status = ${status},
                hr_id = ${hrId},            -- Maps to reviewed_by_hr_id
                hr_decision_at = GETDATE(), -- Maps to reviewed_at
                hr_comments = ${hr_comments || null} -- Assuming this column exists, otherwise remove this line
            WHERE leave_id = ${leaveId} AND status = 'Pending'; -- Only update pending requests
        `;

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ msg: 'Leave request not found or already reviewed.' });
        }

        res.json({ msg: `Leave request ${leaveId} ${status.toLowerCase()} successfully.` });

    } catch (err) {
        console.error('Error updating leave request status:', err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;