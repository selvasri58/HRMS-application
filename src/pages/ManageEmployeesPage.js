// src/pages/ManageEmployeesPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container, Typography, Box, Paper, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // Import delete icon

function ManageEmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openConfirm, setOpenConfirm] = useState(false); // State for confirmation dialog
    const [employeeToDelete, setEmployeeToDelete] = useState(null); // Employee ID to delete

    useEffect(() => {
        fetchEmployees();
    }, []); // Empty dependency array means this runs once on component mount

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found. Please log in.');
                setLoading(false);
                return;
            }

            // FIX: Changed API endpoint from '/api/employees' to '/api/users'
            const response = await axios.get('http://localhost:5000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setEmployees(response.data);
        } catch (err) {
            console.error('Error fetching employees:', err);
            if (err.response && err.response.data && err.response.data.msg) {
                setError(err.response.data.msg);
            } else {
                setError('Failed to load employee data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle opening the confirmation dialog
    const handleDeleteClick = (userId) => {
        setEmployeeToDelete(userId);
        setOpenConfirm(true);
    };

    // Handle closing the confirmation dialog
    const handleCloseConfirm = () => {
        setOpenConfirm(false);
        setEmployeeToDelete(null);
    };

    // Handle actual deletion after confirmation
    const handleConfirmDelete = async () => {
        handleCloseConfirm(); // Close the dialog immediately
        if (!employeeToDelete) return; // Should not happen

        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');

            // FIX: Changed API endpoint from '/api/employees/:id' to '/api/users/:id'
            await axios.delete(`http://localhost:5000/api/users/${employeeToDelete}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // If successful, remove the employee from the local state
            setEmployees(prevEmployees => prevEmployees.filter(emp => emp.user_id !== employeeToDelete));
            console.log(`Employee ${employeeToDelete} deleted successfully.`);
            // Optional: Show a success message alert
        } catch (err) {
            console.error('Error deleting employee:', err);
            if (err.response && err.response.data && err.response.data.msg) {
                setError(err.response.data.msg);
            } else {
                setError('Failed to delete employee. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Manage Employees
                </Typography>

                {loading ? (
                    <CircularProgress />
                ) : error ? (
                    <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>
                ) : employees.length > 0 ? (
                    <TableContainer component={Paper} elevation={3} sx={{ mt: 3, width: '100%' }}>
                        <Table sx={{ minWidth: 650 }} aria-label="employee table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>User ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Aadhar No.</TableCell>
                                    <TableCell>PAN No.</TableCell>
                                    <TableCell>Skills</TableCell>
                                    <TableCell>Experience</TableCell>
                                    <TableCell>Last Updated</TableCell>
                                    <TableCell align="right">Actions</TableCell> {/* New column for actions */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.map((employee) => (
                                    <TableRow
                                        key={employee.user_id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">{employee.user_id}</TableCell>
                                        <TableCell>{employee.username || 'N/A'}</TableCell> {/* Assuming 'username' for name */}
                                        <TableCell>{employee.role}</TableCell>
                                        <TableCell>{employee.aadhar_number || 'N/A'}</TableCell>
                                        <TableCell>{employee.pan_number || 'N/A'}</TableCell>
                                        <TableCell>{employee.skills || 'N/A'}</TableCell>
                                        <TableCell>{employee.working_experience || 'N/A'}</TableCell>
                                        <TableCell>{employee.profile_last_updated ? new Date(employee.profile_last_updated).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDeleteClick(employee.user_id)}
                                            >
                                                Delete
                                            </Button>
                                            {/* Add Edit button here later */}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Alert severity="info" sx={{ width: '100%', mt: 2 }}>No employee data found. Please ensure employees are registered and have profiles.</Alert>
                )}
            </Box>

            {/* Confirmation Dialog */}
            <Dialog
                open={openConfirm}
                onClose={handleCloseConfirm}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete employee "{employeeToDelete}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirm}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} autoFocus color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default ManageEmployeesPage;