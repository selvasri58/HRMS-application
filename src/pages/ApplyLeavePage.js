// src/pages/ApplyLeavePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container, Typography, Box, TextField, Button, Alert, CircularProgress, Grid, Paper
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { differenceInDays, isValid } from 'date-fns';

function ApplyLeavePage() {
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [returnDate, setReturnDate] = useState(null);
    const [reason, setReason] = useState('');
    const [numDays, setNumDays] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info');

    // Get today's date for minDate
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

    // Effect to calculate numDays whenever fromDate or toDate changes
    useEffect(() => {
        if (isValid(fromDate) && isValid(toDate)) {
            const days = differenceInDays(toDate, fromDate) + 1; // +1 to include both start and end day
            setNumDays(days > 0 ? days : 0); // Ensure days is not negative
        } else {
            setNumDays(0);
        }
    }, [fromDate, toDate]);

    // Effect to auto-set returnDate (e.g., day after toDate)
    useEffect(() => {
        if (isValid(toDate)) {
            const nextDay = new Date(toDate);
            nextDay.setDate(toDate.getDate() + 1);
            setReturnDate(nextDay);
        } else {
            setReturnDate(null);
        }
    }, [toDate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage(''); // Clear previous messages

        if (!fromDate || !toDate || !returnDate || !reason || numDays <= 0) {
            setMessage('Please fill in all required fields and ensure dates are valid.');
            setSeverity('error');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setMessage('Authentication token not found. Please log in.');
            setSeverity('error');
            return;
        }

        const leaveData = {
            from_date: fromDate.toISOString().split('T')[0], // Format to YYYY-MM-DD
            to_date: toDate.toISOString().split('T')[0],     // Format to YYYY-MM-DD
            return_date: returnDate.toISOString().split('T')[0],
            reason,
            num_days: numDays
        };

        try {
            setLoading(true);
            const response = await axios.post('http://localhost:5000/api/leaves/apply', leaveData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setMessage(response.data.msg);
            setSeverity('success');
            // Clear form
            setFromDate(null);
            setToDate(null);
            setReturnDate(null);
            setReason('');
            setNumDays(0);
        } catch (err) {
            console.error('Error applying for leave:', err.response || err);
            setMessage(err.response?.data?.msg || 'Failed to submit leave request. Please try again.');
            setSeverity('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Apply for Leave (Employee)
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Submit your leave application with required details.
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Leave Dates
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <DatePicker
                                        label="From Date"
                                        value={fromDate}
                                        onChange={(newValue) => setFromDate(newValue)}
                                        // *** ADDED: minDate prop here ***
                                        minDate={today}
                                        slotProps={{
                                            textField: { fullWidth: true, margin: 'normal', required: true }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <DatePicker
                                        label="To Date"
                                        value={toDate}
                                        onChange={(newValue) => setToDate(newValue)}
                                        minDate={fromDate || today} // Ensure toDate is not before fromDate or today
                                        slotProps={{
                                            textField: { fullWidth: true, margin: 'normal', required: true }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <DatePicker
                                        label="Return Date"
                                        value={returnDate}
                                        onChange={(newValue) => setReturnDate(newValue)}
                                        minDate={toDate ? new Date(toDate.getTime() + 24 * 60 * 60 * 1000) : today} // Return date must be after toDate or today
                                        slotProps={{
                                            textField: { fullWidth: true, margin: 'normal', required: true }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Total Days (Calculated)"
                                        value={numDays}
                                        fullWidth
                                        margin="normal"
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                        sx={{ mt: 2 }}
                                    />
                                </Grid>
                            </Grid>
                        </LocalizationProvider>
                    </Paper>

                    <TextField
                        label="Reason for Leave"
                        multiline
                        rows={4}
                        fullWidth
                        margin="normal"
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Apply Leave'}
                    </Button>
                    {message && (
                        <Alert severity={severity} sx={{ mt: 2, width: '100%' }}>
                            {message}
                        </Alert>
                    )}
                </Box>
            </Box>
        </Container>
    );
}

export default ApplyLeavePage;