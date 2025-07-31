// src/pages/ManageLeavesPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container, Typography, Box, Paper, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Approve icon
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'; // Decline icon

function ManageLeavesPage() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [actionType, setActionType] = useState(''); // 'Approved' or 'Declined'
    const [hrComments, setHrComments] = useState('');

    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found. Please log in as HR.');
                setLoading(false);
                return;
            }

            const response = await axios.get('http://localhost:5000/api/leaves/pending', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setLeaveRequests(response.data);
        } catch (err) {
            console.error('Error fetching leave requests:', err);
            setError(err.response?.data?.msg || 'Failed to load leave requests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (leave, type) => {
        setSelectedLeave(leave);
        setActionType(type);
        setHrComments(''); // Clear comments on new dialog open
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedLeave(null);
        setActionType('');
        setHrComments('');
    };

    const handleUpdateLeaveStatus = async () => {
        if (!selectedLeave || !actionType) return;

        handleCloseDialog(); // Close dialog immediately

        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');

            await axios.put(`http://localhost:5000/api/leaves/${selectedLeave.leave_id}/status`,
                { status: actionType, hr_comments: hrComments }, // Send status and comments
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Re-fetch pending requests to update the list
            fetchLeaveRequests();
            // Optional: Show success message via a Snackbar or Alert
        } catch (err) {
            console.error('Error updating leave status:', err.response || err);
            setError(err.response?.data?.msg || `Failed to ${actionType.toLowerCase()} leave request.`);
            setLoading(false); // Stop loading on error
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Manage Leave Applications (HR)
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    This page will allow HR to view, approve, and decline leave requests.
                </Typography>

                {loading ? (
                    <CircularProgress />
                ) : error ? (
                    <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>
                ) : leaveRequests.length > 0 ? (
                    <TableContainer component={Paper} elevation={3} sx={{ mt: 3, width: '100%' }}>
                        <Table sx={{ minWidth: 650 }} aria-label="leave requests table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Leave ID</TableCell>
                                    <TableCell>Employee ID</TableCell>
                                    <TableCell>From Date</TableCell>
                                    <TableCell>To Date</TableCell>
                                    <TableCell>Days</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Applied At</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leaveRequests.map((leave) => (
                                    <TableRow
                                        key={leave.leave_id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell>{leave.leave_id}</TableCell>
                                        <TableCell>{leave.employee_id}</TableCell>
                                        <TableCell>{new Date(leave.from_date).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(leave.to_date).toLocaleDateString()}</TableCell>
                                        <TableCell>{leave.num_days}</TableCell>
                                        <TableCell>{leave.reason}</TableCell>
                                        <TableCell>{leave.status}</TableCell>
                                        <TableCell>{new Date(leave.applied_at).toLocaleString()}</TableCell>
                                        <TableCell align="right">
                                            {leave.status === 'Pending' && (
                                                <>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        startIcon={<CheckCircleOutlineIcon />}
                                                        sx={{ mr: 1 }}
                                                        onClick={() => handleOpenDialog(leave, 'Approved')}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        startIcon={<CancelOutlinedIcon />}
                                                        onClick={() => handleOpenDialog(leave, 'Declined')}
                                                    >
                                                        Decline
                                                    </Button>
                                                </>
                                            )}
                                            {/* Optionally show reviewed status if not pending */}
                                            {leave.status !== 'Pending' && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {leave.status}
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Alert severity="info" sx={{ width: '100%', mt: 2 }}>No pending leave requests found.</Alert>
                )}
            </Box>

            {/* Confirmation/Comments Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>
                    {actionType === 'Approved' ? 'Approve Leave Request' : 'Decline Leave Request'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to {actionType.toLowerCase()} this leave request from {selectedLeave?.employee_id}?
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="HR Comments (Optional)"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={hrComments}
                        onChange={(e) => setHrComments(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleUpdateLeaveStatus}
                        color={actionType === 'Approved' ? 'success' : 'error'}
                        variant="contained"
                    >
                        Confirm {actionType}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default ManageLeavesPage;