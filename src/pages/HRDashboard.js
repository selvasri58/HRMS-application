// src/pages/HRDashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Box, Paper, Button, Grid } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd'; // Register User
import PeopleIcon from '@mui/icons-material/People'; // Manage Employees
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'; // Manage Leaves
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; // Manage Attendance
import LocationOnIcon from '@mui/icons-material/LocationOn'; // Manage Locations

function HRDashboard() {
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // Retrieve HR user's name from localStorage or context if available
        const storedUserName = localStorage.getItem('userName'); // Assuming you store this on login
        if (storedUserName) {
            setUserName(storedUserName);
        } else {
            // Fallback or a call to an API to get user details
            setUserName('HR Manager'); // Default name for HR
        }
    }, []);

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome, {userName}!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Here's your HR operations overview.
                </Typography>

                <Grid container spacing={3} justifyContent="center" sx={{ mt: 3, width: '100%' }}>
                    {/* Quick Link: Register New User */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                            <PersonAddIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                            <Typography variant="h6" component="h2" gutterBottom mt={1}>
                                Register New User
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Add new employees or HR personnel to the system.
                            </Typography>
                            <Button
                                component={Link}
                                to="/register-user"
                                variant="contained"
                                sx={{ mt: 2 }}
                            >
                                Register
                            </Button>
                        </Paper>
                    </Grid>

                    {/* Quick Link: Manage Employees */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
                            <Typography variant="h6" component="h2" gutterBottom mt={1}>
                                Manage Employees
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                View, update, or delete employee records.
                            </Typography>
                            <Button
                                component={Link}
                                to="/manage-employees"
                                variant="contained"
                                sx={{ mt: 2 }}
                            >
                                Manage
                            </Button>
                        </Paper>
                    </Grid>

                    {/* NEW Quick Link: Manage Leaves */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                            <AssignmentTurnedInIcon sx={{ fontSize: 60, color: 'info.main' }} />
                            <Typography variant="h6" component="h2" gutterBottom mt={1}>
                                Manage Leaves
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Review and act on leave applications.
                            </Typography>
                            <Button
                                component={Link}
                                to="/manage-leaves" // This is the path defined in App.js
                                variant="contained"
                                sx={{ mt: 2 }}
                            >
                                Manage
                            </Button>
                        </Paper>
                    </Grid>

                    {/* Quick Link: Manage Attendance */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                            <EventAvailableIcon sx={{ fontSize: 60, color: 'success.main' }} />
                            <Typography variant="h6" component="h2" gutterBottom mt={1}>
                                Manage Attendance
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Track and manage employee attendance.
                            </Typography>
                            <Button
                                component={Link}
                                to="/manage-attendance"
                                variant="contained"
                                sx={{ mt: 2 }}
                            >
                                Manage
                            </Button>
                        </Paper>
                    </Grid>

                    {/* Quick Link: Manage Geo Locations */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                            <LocationOnIcon sx={{ fontSize: 60, color: 'warning.main' }} />
                            <Typography variant="h6" component="h2" gutterBottom mt={1}>
                                Manage Geo Locations
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Set and manage authorized work locations.
                            </Typography>
                            <Button
                                component={Link}
                                to="/manage-locations"
                                variant="contained"
                                sx={{ mt: 2 }}
                            >
                                Manage
                            </Button>
                        </Paper>
                    </Grid>

                </Grid>
            </Box>
        </Container>
    );
}

export default HRDashboard;