// src/pages/ApplicationStatusPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Container, Typography, Box, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Alert
} from '@mui/material';
import { format } from 'date-fns'; // For consistent date formatting

function ApplicationStatusPage() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Authentication token not found. Please log in.');
                    setLoading(false);
                    return;
                }

                // FIX: Changed API endpoint from /api/leaves/my to /api/leaves/my-applications
                const response = await axios.get('http://localhost:5000/api/leaves/my-applications', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setLeaves(response.data);
            } catch (err) {
                console.error('Error fetching employee leave applications:', err.response?.data || err);
                setError(err.response?.data?.msg || 'Failed to fetch leave applications.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaves();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'dd MMM yyyy');
        } catch (e) {
            return dateString; // Return original if formatting fails
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    My Leave Application Status
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    View the status of your submitted leave requests.
                </Typography>

                {loading ? (
                    <CircularProgress sx={{ mt: 5 }} />
                ) : error ? (
                    <Alert severity="error" sx={{ mt: 3, width: '100%' }}>{error}</Alert>
                ) : leaves.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 3, width: '100%' }}>
                        You have no leave applications submitted yet.
                    </Alert>
                ) : (
                    <TableContainer component={Paper} elevation={3} sx={{ mt: 3, width: '100%' }}>
                        <Table aria-label="leave applications table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Leave ID</TableCell>
                                    <TableCell>From Date</TableCell>
                                    <TableCell>To Date</TableCell>
                                    <TableCell>Return Date</TableCell>
                                    <TableCell>Total Days</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Applied At</TableCell>
                                    <TableCell>HR Comments</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leaves.map((leave) => (
                                    <TableRow
                                        key={leave.leave_id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">{leave.leave_id}</TableCell>
                                        <TableCell>{formatDate(leave.from_date)}</TableCell>
                                        <TableCell>{formatDate(leave.to_date)}</TableCell>
                                        <TableCell>{formatDate(leave.return_date)}</TableCell>
                                        <TableCell>{leave.num_days}</TableCell>
                                        <TableCell>{leave.reason}</TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color:
                                                        leave.status === 'Approved' ? 'success.main' :
                                                        leave.status === 'Declined' ? 'error.main' :
                                                        'warning.main'
                                                }}
                                            >
                                                {leave.status}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{formatDate(leave.applied_at)}</TableCell>
                                        <TableCell>{leave.hr_comments || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Container>
    );
}

export default ApplicationStatusPage;