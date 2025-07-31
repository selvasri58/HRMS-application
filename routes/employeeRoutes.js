// hrms-backend/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const { sql } = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');

// @route   GET /api/employees
// @desc    Get all employee profiles
// @access  Private (only accessible by HR role)
router.get('/', authenticateToken, authorize(['HR']), async (req, res) => {
    try {
        const request = new sql.Request();
        // Select specific columns, not all, for better security and performance
        const result = await request.query(`
            SELECT
                u.user_id,
                u.role,
                ep.name,
                ep.address,
                ep.aadhar_number,
                ep.pan_number,
                ep.skills,
                ep.working_experience,
                ep.profile_last_updated
            FROM Users u
            INNER JOIN Employee_Profiles ep ON u.user_id = ep.employee_id
            WHERE u.role = 'Employee'
        `);

        res.json(result.recordset);

    } catch (err) {
        console.error('Error fetching employee profiles:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE /api/employees/:userId
// @desc    Delete an employee and their profile
// @access  Private (only accessible by HR role)
router.delete('/:userId', authenticateToken, authorize(['HR']), async (req, res) => {
    const { userId } = req.params; // The user_id to delete

    let transaction; // Declare transaction here for scope

    try {
        // Start a transaction for atomicity
        transaction = new sql.Transaction();
        await transaction.begin();

        // 1. Check if the user exists and what their role is
        const checkUserRequest = new sql.Request(transaction);
        const userResult = await checkUserRequest.query`
            SELECT user_id, role FROM Users WHERE user_id = ${userId}
        `;

        const userToDelete = userResult.recordset[0];

        if (!userToDelete) {
            await transaction.rollback();
            return res.status(404).json({ msg: 'User not found.' });
        }

        // IMPORTANT: Prevent HR from deleting other HRs or self unless explicitly allowed
        // For this scenario, we assume HR can only delete 'Employee' roles.
        // If HR should be able to delete other HRs, the logic here needs adjustment.
        if (userToDelete.role !== 'Employee') {
            await transaction.rollback();
            return res.status(403).json({ msg: 'Unauthorized: Cannot delete non-employee users via this endpoint.' });
        }

        // 2. Delete from the specific profile table first
        const deleteProfileRequest = new sql.Request(transaction);
        const profileTable = userToDelete.role === 'HR' ? 'HR_Profiles' : 'Employee_Profiles';
        const profileIdColumn = userToDelete.role === 'HR' ? 'hr_id' : 'employee_id';

        await deleteProfileRequest.query`
            DELETE FROM ${profileTable} WHERE ${profileIdColumn} = ${userId}
        `;
        // Note: No need to check rowsAffected here, as the user might not have a profile,
        // but we still want to proceed to delete from the Users table.

        // 3. Delete from the Users table
        const deleteUserRequest = new sql.Request(transaction);
        const userDeleteResult = await deleteUserRequest.query`
            DELETE FROM Users WHERE user_id = ${userId}
        `;

        if (userDeleteResult.rowsAffected[0] === 0) {
            // This case should ideally not happen if userToDelete was found, but good for robustness
            await transaction.rollback();
            return res.status(404).json({ msg: 'User not found in Users table after profile deletion attempt.' });
        }

        await transaction.commit(); // Commit the transaction if all operations are successful
        res.json({ msg: `User ${userId} and their profile deleted successfully.` });

    } catch (err) {
        if (transaction) {
            try {
                await transaction.rollback(); // Rollback if any error occurs
            } catch (rollbackErr) {
                console.error('Transaction rollback failed:', rollbackErr);
            }
        }
        console.error('Error deleting user and profile:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;