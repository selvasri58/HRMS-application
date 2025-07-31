// hrms-backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('../config/db');
// UPDATED: Changed from authenticateToken to verifyToken for consistency
const verifyToken = require('../middleware/authMiddleware');
// UPDATED: Changed from authorizeMiddleware to authorizeRole and variable name
const authorizeRole = require('../middleware/authorizeRole');

// @route   POST /api/auth/register
// @desc    Register a new user (HR can register employees/other HRs)
// @access  Private (only accessible by HR roles)
// UPDATED: Changed authenticateToken to verifyToken, and authorize to authorizeRole
router.post('/register', verifyToken, authorizeRole(['HR']), async (req, res) => {
    const { user_id, password, role } = req.body;

    if (!user_id || !password || !role) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }
    if (role !== 'Employee' && role !== 'HR') {
        return res.status(400).json({ msg: 'Role must be Employee or HR' });
    }

    let transaction; // Declare transaction here for scope

    try {
        const checkUserRequest = new sql.Request();
        const userExists = await checkUserRequest.query`SELECT user_id FROM Users WHERE user_id = ${user_id}`;

        if (userExists.recordset.length > 0) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Start a transaction for atomicity: either both user and profile are created, or neither are.
        transaction = new sql.Transaction();
        await transaction.begin();

        const insertUserRequest = new sql.Request(transaction);
        await insertUserRequest.query`
            INSERT INTO Users (user_id, password_hash, role)
            VALUES (${user_id}, ${password_hash}, ${role})
        `;

        if (role === 'HR') {
            const insertHRProfileRequest = new sql.Request(transaction);
            await insertHRProfileRequest.query`
                INSERT INTO HR_Profiles (hr_id, name, address, aadhar_number, pan_number, skills, working_experience)
                VALUES (${user_id}, NULL, NULL, NULL, NULL, NULL, NULL)
            `;
        } else if (role === 'Employee') {
            const insertEmployeeProfileRequest = new sql.Request(transaction);
            await insertEmployeeProfileRequest.query`
                INSERT INTO Employee_Profiles (employee_id, name, address, aadhar_number, pan_number, skills, working_experience)
                VALUES (${user_id}, NULL, NULL, NULL, NULL, NULL, NULL)
            `;
        }

        await transaction.commit(); // Commit the transaction if all operations are successful
        res.status(201).json({ msg: 'User registered successfully' });

    } catch (err) {
        if (transaction) {
            try {
                await transaction.rollback(); // Rollback if any error occurs
            } catch (rollbackErr) {
                console.error('Transaction rollback failed:', rollbackErr);
            }
        }
        console.error('Error registering user:', err.message);
        res.status(500).send('Server error');
    }
});

// Existing login route:
router.post('/login', async (req, res) => {
    const { user_id, password, role } = req.body;

    if (!user_id || !password || !role) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }
    if (role !== 'Employee' && role !== 'HR') {
        return res.status(400).json({ msg: 'Role must be Employee or HR' });
    }

    try {
        const request = new sql.Request();
        const result = await request.query`SELECT user_id, password_hash, role FROM Users WHERE user_id = ${user_id}`;

        const user = result.recordset[0];

        if (!user || user.role !== role) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.user_id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error('Error logging in user:', err.message);
        res.status(500).send('Server error');
    }
});


// @route   GET /api/auth/me
// @desc    Get logged in user details (UPDATED to fetch from HR_Profiles/Employee_Profiles)
// @access  Private
// UPDATED: Changed authenticateToken to verifyToken
router.get('/me', verifyToken, async (req, res) => {
    try {
        const userIdFromToken = req.user.id;
        const userRoleFromToken = req.user.role;

        const userRequest = new sql.Request();
        const userResult = await userRequest.query`
            SELECT user_id, role FROM Users WHERE user_id = ${userIdFromToken}
        `;

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ msg: 'User not found in database.' });
        }

        const user = userResult.recordset[0];
        let profile = {};

        if (user.role === 'HR') {
            const hrProfileRequest = new sql.Request();
            const hrProfileResult = await hrProfileRequest.query`
                SELECT name, address, aadhar_number, pan_number, skills, working_experience, profile_last_updated
                FROM HR_Profiles
                WHERE hr_id = ${userIdFromToken}
            `;
            profile = hrProfileResult.recordset[0] || {}; // Return empty object if no profile found
        } else if (user.role === 'Employee') {
            const employeeProfileRequest = new sql.Request();
            const employeeProfileResult = await employeeProfileRequest.query`
                SELECT name, address, aadhar_number, pan_number, skills, working_experience, profile_last_updated
                FROM Employee_Profiles
                WHERE employee_id = ${userIdFromToken}
            `;
            profile = employeeProfileResult.recordset[0] || {}; // Return empty object if no profile found
        }

        res.json({
            user_id: user.user_id,
            role: user.role,
            ...profile // Spread profile properties into the response
        });

    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/auth/profile
// @desc    Update logged in user's profile details (UPDATED for HR_Profiles/Employee_Profiles)
// @access  Private
// UPDATED: Changed authenticateToken to verifyToken
router.put('/profile', verifyToken, async (req, res) => {
    // These are the fields from HR_Profiles / Employee_Profiles
    const { name, address, aadhar_number, pan_number, skills, working_experience } = req.body;
    const userIdToUpdate = req.user.id;
    const userRole = req.user.role;

    // Backend Validation for Length of Aadhar and PAN
    // Aadhar is typically 12 digits
    if (aadhar_number !== null && aadhar_number !== undefined && aadhar_number.length > 12) {
        return res.status(400).json({ msg: 'Aadhar Number cannot exceed 12 characters.' });
    }
    // PAN is typically 10 characters (alphanumeric)
    if (pan_number !== null && pan_number !== undefined && pan_number.length > 10) {
        return res.status(400).json({ msg: 'PAN Number cannot exceed 10 characters.' });
    }
    // You could also add minimum length checks if they are mandatory fields
    // if (aadhar_number && aadhar_number.length !== 12) {
    //     return res.status(400).json({ msg: 'Aadhar Number must be exactly 12 characters.' });
    // }
    // if (pan_number && pan_number.length !== 10) {
    //     return res.status(400).json({ msg: 'PAN Number must be exactly 10 characters.' });
    // }


    try {
        const request = new sql.Request();
        let updateQuery;
        let params;

        // Use a SQL query builder style for clarity with multiple parameters,
        // or ensure the order of parameters matches the order in the query string
        if (userRole === 'HR') {
            updateQuery = `
                UPDATE HR_Profiles
                SET
                    name = @name,
                    address = @address,
                    aadhar_number = @aadhar_number,
                    pan_number = @pan_number,
                    skills = @skills,
                    working_experience = @working_experience,
                    profile_last_updated = GETDATE()
                WHERE hr_id = @hr_id
            `;
            params = {
                name: name,
                address: address,
                aadhar_number: aadhar_number,
                pan_number: pan_number,
                skills: skills,
                working_experience: working_experience,
                hr_id: userIdToUpdate
            };
        } else if (userRole === 'Employee') {
            updateQuery = `
                UPDATE Employee_Profiles
                SET
                    name = @name,
                    address = @address,
                    aadhar_number = @aadhar_number,
                    pan_number = @pan_number,
                    skills = @skills,
                    working_experience = @working_experience,
                    profile_last_updated = GETDATE()
                WHERE employee_id = @employee_id
            `;
            params = {
                name: name,
                address: address,
                aadhar_number: aadhar_number,
                pan_number: pan_number,
                skills: skills,
                working_experience: working_experience,
                employee_id: userIdToUpdate
            };
        } else {
            return res.status(403).json({ msg: 'Unauthorized role for profile update.' });
        }

        // Add parameters to the request object
        for (const key in params) {
            request.input(key, params[key]);
        }

        const result = await request.query(updateQuery);

        // Check if any row was actually updated
        if (result.rowsAffected[0] === 0) {
            // This case might happen if a profile row was somehow not created during registration
            // Or if the user ID from token doesn't match an existing profile entry
            console.warn(`Profile update failed: No rows affected for user ${userIdToUpdate} with role ${userRole}`);
            return res.status(404).json({ msg: 'Profile not found or no changes made.' });
        }

        res.json({ msg: 'Profile updated successfully' });

    } catch (err) {
        console.error('Error updating user profile:', err.message);
        // Check for specific truncation errors and provide a more user-friendly message
        if (err.message.includes('String or binary data would be truncated')) {
            return res.status(400).json({ msg: 'Data entered is too long for one or more fields. Please check lengths for Aadhar/PAN.' });
        }
        res.status(500).send('Server error');
    }
});


module.exports = router;