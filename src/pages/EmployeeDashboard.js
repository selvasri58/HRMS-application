// src/pages/EmployeeDashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Box, Paper, Button, Grid } from '@mui/material'; // Added Grid for layout
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'; // Icon for leaves
import PersonIcon from '@mui/icons-material/Person'; // Icon for profile
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; // Icon for attendance

function EmployeeDashboard() {
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // Retrieve user's name from localStorage or context if available
        const storedUserName = localStorage.getItem('userName'); // Assuming you store this on login
        if (storedUserName) {
            setUserName(storedUserName);
        } else {
            // Fallback or a call to an API to get user details
            setUserName('Employee'); // Default name
        }
    }, []);

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome, {userName}!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Here's a quick overview of your employee portal.
                </Typography>

                <Grid container spacing={3} justifyContent="center" sx={{ mt: 3, width: '100%' }}>
                    {/* Quick Link: My Profile */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                            <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                            <Typography variant="h6" component="h2" gutterBottom mt={1}>
                                My Profile
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                View and update your personal details.
                            </Typography>
                            <Button
                                component={Link}
                                to="/my-profile"
                                variant="contained"
                                sx={{ mt: 2 }}
                            >
                                View Profile
                            </Button>
                        </Paper>
                    </Grid>

                    {/* Quick Link: My Attendance */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                            <EventAvailableIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
                            <Typography variant="h6" component="h2" gutterBottom mt={1}>
                                My Attendance
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Check your attendance records.
                            </Typography>
                            <Button
                                component={Link}
                                to="/my-attendance"
                                variant="contained"
                                sx={{ mt: 2 }}
                            >
                                View Attendance
                            </Button>
                        </Paper>
                    </Grid>

                    {/* NEW Quick Link: Apply Leave */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                            <AssignmentTurnedInIcon sx={{ fontSize: 60, color: 'info.main' }} />
                            <Typography variant="h6" component="h2" gutterBottom mt={1}>
                                Apply for Leave
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Submit a new leave application.
                            </Typography>
                            <Button
                                component={Link}
                                to="/apply-leave" // This is the path defined in App.js
                                variant="contained"
                                sx={{ mt: 2 }}
                            >
                                Apply Now
                            </Button>
                        </Paper>
                    </Grid>

                    {/* Optional: Quick Link for My Leave History (if you implement this page) */}
                    {/* <Grid item xs={12} sm={6} md={4}>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                            <ListAltIcon sx={{ fontSize: 60, color: 'warning.main' }} />
                            <Typography variant="h6" component="h2" gutterBottom mt={1}>
                                My Leave History
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                View your past and pending leave requests.
                            </Typography>
                            <Button
                                component={Link}
                                to="/my-leave-history"
                                variant="contained"
                                sx={{ mt: 2 }}
                            >
                                View History
                            </Button>
                        </Paper>
                    </Grid> */}

                </Grid>
            </Box>
        </Container>
    );
}

export default EmployeeDashboard;