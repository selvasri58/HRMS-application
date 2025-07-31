// src/pages/RegisterUserPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Box, MenuItem, Select, FormControl, InputLabel, Alert } from '@mui/material';

function RegisterUserPage() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(''); // Initialize with empty string, will be set in useEffect
    const [availableRoles, setAvailableRoles] = useState([]); // New state for available roles
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Get the role of the currently logged-in user from localStorage
        const loggedInUserRole = localStorage.getItem('userRole'); // Assuming you store the role here

        // >>>>>>>>>>>>>>>>> IMPORTANT: DEBUGGING CONSOLE LOGS <<<<<<<<<<<<<<<<<
        console.log('RegisterUserPage DEBUG: Logged-in User Role from localStorage:', loggedInUserRole);
        // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        const allSystemRoles = ['Employee', 'Manager', 'HR', 'Admin']; // Define all roles your system supports

        let rolesToDisplay = [];

        if (loggedInUserRole === 'HR') {
            // HR users can now ONLY create 'Employee' accounts
            rolesToDisplay = allSystemRoles.filter(r => r === 'Employee');
        } else if (loggedInUserRole === 'Admin') {
            // Admin users can create any defined role
            rolesToDisplay = allSystemRoles;
        } else {
            // If the logged-in user's role is not recognized or not an authorized role for creating users,
            // then no roles should be displayed, and an error should be set.
            rolesToDisplay = [];
            // Set a general error if the user shouldn't be here at all
            if (!loggedInUserRole || (loggedInUserRole !== 'HR' && loggedInUserRole !== 'Admin')) {
                 setError('You do not have permission to register users. Please log in with an authorized account (HR or Admin).');
            }
        }

        // >>>>>>>>>>>>>>>>> IMPORTANT: DEBUGGING CONSOLE LOG <<<<<<<<<<<<<<<<<
        console.log('RegisterUserPage DEBUG: Available roles after filtering:', rolesToDisplay);
        // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        setAvailableRoles(rolesToDisplay);

        // Set the default selected role to the first available role if any, otherwise empty
        if (rolesToDisplay.length > 0) {
            setRole(rolesToDisplay[0]);
        } else {
            setRole(''); // No role should be selected if no options are available
        }

    }, []); // Empty dependency array means this effect runs once on component mount

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('You must be logged in to register users.');
                return;
            }

            // Client-side validation: Ensure the selected role is actually in availableRoles
            // This is a redundant check if the dropdown is correct, but good for robustness
            if (!availableRoles.includes(role)) {
                 setError(`Invalid role selected: ${role}. Please select one of the allowed roles.`);
                 return;
            }

            await axios.post('http://localhost:5000/api/auth/register', {
                user_id: userId,
                password: password,
                role: role,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setMessage(`User ${userId} (${role}) registered successfully!`);
            setUserId('');
            setPassword('');
            setRole(availableRoles[0] || ''); // Reset role to first available or empty

        } catch (err) {
            console.error('Registration error:', err);
            if (err.response && err.response.data && err.response.data.msg) {
                setError(err.response.data.msg);
            } else {
                setError('Registration failed. Server error or unauthorized.');
            }
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Register New User
                </Typography>
                {message && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{message}</Alert>}
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                {/* Display an alert if no roles are available (e.g., if a non-HR/Admin user accesses this page) */}
                {availableRoles.length === 0 && !error && (
                    <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
                        You do not have the necessary permissions to register new users.
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="userId"
                        label="User ID"
                        name="userId"
                        autoFocus
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="role-label">Role</InputLabel>
                        <Select
                            labelId="role-label"
                            id="role"
                            value={role}
                            label="Role"
                            onChange={(e) => setRole(e.target.value)}
                            disabled={availableRoles.length === 0} // Disable if no roles are available
                            required // Role selection is required
                        >
                            {availableRoles.length > 0 ? (
                                availableRoles.map((roleOption) => (
                                    <MenuItem key={roleOption} value={roleOption}>
                                        {roleOption}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value="" disabled>No roles available</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={availableRoles.length === 0} // Disable submit if no roles can be selected
                    >
                        Register User
                    </Button>
                    <Button
                        type="button"
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/hr-dashboard')}
                        sx={{ mb: 2 }}
                    >
                        Back to HR Dashboard
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default RegisterUserPage;