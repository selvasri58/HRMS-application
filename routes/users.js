// routes/users.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');

// Example: Get user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const pool = await sql.connect();
        // Updated query to JOIN with Employee_Profiles to get full profile details
        const result = await pool.request()
            .input('user_id', sql.NVarChar(50), req.user.id) // req.user.id comes from verifyToken middleware
            .query(`
                SELECT
                    U.user_id,
                    U.role,
                    EP.name, -- Employee's full name from profile
                    EP.aadhar_number,
                    EP.pan_number,
                    EP.skills,
                    EP.working_experience,
                    EP.profile_last_updated
                FROM Users U
                LEFT JOIN Employee_Profiles EP ON U.user_id = EP.employee_id
                WHERE U.user_id = @user_id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'User profile not found or incomplete.' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        res.status(500).send('Server Error');
    }
});

// --- NEW ROUTES FOR EMPLOYEE MANAGEMENT ---

// @route   GET /api/users
// @desc    Get all users (employees) - Accessible by HR
// @access  Private (HR)
router.get('/', verifyToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const pool = await sql.connect();
        // Updated query to JOIN with Employee_Profiles and now FILTER by role = 'Employee'
        const result = await pool.request().query(`
            SELECT
                U.user_id,
                U.role,
                EP.name, -- Employee's full name from profile
                EP.aadhar_number,
                EP.pan_number,
                EP.skills,
                EP.working_experience,
                EP.profile_last_updated
            FROM Users U
            LEFT JOIN Employee_Profiles EP ON U.user_id = EP.employee_id
            WHERE U.role = 'Employee' -- <-- UNCOMMENTED: Only fetch users with 'Employee' role
            ORDER BY U.user_id ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching all users (employees):', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user by user_id - Accessible by HR
// @access  Private (HR)
router.delete('/:id', verifyToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await sql.connect();

        // Start a transaction for atomicity
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // STEP 1: Delete records from child tables that have FOREIGN KEY constraints
            // Delete from Attendance
            await transaction.request()
                .input('employee_id', sql.NVarChar(50), id)
                .query('DELETE FROM Attendance WHERE employee_id = @employee_id');
            console.log(`Deleted attendance records for employee_id: ${id}`);

            // Delete from Leave_Applications
            await transaction.request()
                .input('employee_id', sql.NVarChar(50), id)
                .query('DELETE FROM Leave_Applications WHERE employee_id = @employee_id');
            console.log(`Deleted leave applications for employee_id: ${id}`);

            // Delete from Employee_Profiles (if exists) due to FOREIGN KEY constraint
            await transaction.request()
                .input('employee_id', sql.NVarChar(50), id)
                .query('DELETE FROM Employee_Profiles WHERE employee_id = @employee_id');
            console.log(`Deleted employee profile for employee_id: ${id}`);

            // STEP 2: Finally, delete the user from the Users table
            const userDeleteResult = await transaction.request()
                .input('user_id', sql.NVarChar(50), id)
                .query('DELETE FROM Users WHERE user_id = @user_id');

            if (userDeleteResult.rowsAffected[0] === 0) {
                await transaction.rollback();
                return res.status(404).json({ msg: 'User not found or already deleted.' });
            }

            await transaction.commit();
            res.json({ msg: 'User and all associated data deleted successfully.' });

        } catch (transactionErr) {
            await transaction.rollback();
            // Log the specific transaction error for detailed backend debugging
            console.error('Transaction Error during user deletion:', transactionErr);
            throw transactionErr; // Re-throw to be caught by the outer catch block
        }

    } catch (err) {
        // Log the full error object for better overall error handling
        console.error('Error deleting user:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;