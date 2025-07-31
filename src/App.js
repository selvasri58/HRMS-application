// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HRDashboard from './pages/HRDashboard';
import RegisterUserPage from './pages/RegisterUserPage';
import MyProfilePage from './pages/MyProfilePage';

import Layout from './components/Layout';

// Import all necessary pages
import ManageEmployeesPage from './pages/ManageEmployeesPage';
import ManageLeavesPage from './pages/ManageLeavesPage';
import ManageAttendancePage from './pages/ManageAttendancePage';
import ManageLocationsPage from './pages/ManageLocationsPage';
import MyAttendancePage from './pages/MyAttendancePage';
import ApplyLeavePage from './pages/ApplyLeavePage';
import ApplicationStatusPage from './pages/ApplicationStatusPage';

// NEW: Import ToastContainer and its CSS
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// A simple PrivateRoute component to protect dashboards
const PrivateRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    // --- DEBUGGING CONSOLE LOGS START ---
    console.log('--- PrivateRoute Debug ---');
    console.log('Current Path:', window.location.pathname);
    console.log('Token from localStorage:', token ? 'Exists' : 'Does NOT exist');
    console.log('User Role from localStorage:', userRole);
    console.log('Allowed Roles for this route:', allowedRoles);
    // --- DEBUGGING CONSOLE LOGS END ---

    if (!token) {
        console.log('Decision: No token, redirecting to /');
        return <Navigate to="/" replace />; // Redirect to login if no token
    }

    // Ensure userRole is retrieved. If not, maybe token is invalid or not properly set.
    if (!userRole) {
        console.warn("Decision: User role not found in localStorage, redirecting to login.");
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.log(`Decision: Access denied for role "${userRole}" to path "${window.location.pathname}". Allowed roles: ${allowedRoles.join(', ')}.`);
        return <Navigate to="/unauthorized" replace />; // Or handle unauthorized access
    }

    console.log('Decision: Access granted.');
    // Wrap the children with the Layout component
    return <Layout>{children}</Layout>;
};

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    {/* Login Page - Publicly accessible */}
                    <Route path="/" element={<LoginPage />} />

                    {/* Protected Routes wrapped with Layout */}

                    {/* Employee Dashboard */}
                    <Route
                        path="/employee-dashboard"
                        element={
                            <PrivateRoute allowedRoles={['Employee']}>
                                <EmployeeDashboard />
                            </PrivateRoute>
                        }
                    />
                    {/* Employee Specific Pages */}
                    <Route
                        path="/my-attendance"
                        element={
                            <PrivateRoute allowedRoles={['Employee']}>
                                <MyAttendancePage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/apply-leave"
                        element={
                            <PrivateRoute allowedRoles={['Employee']}>
                                <ApplyLeavePage />
                            </PrivateRoute>
                        }
                    />
                    {/* NEW: Application Status Route for Employee */}
                    <Route
                        path="/application-status"
                        element={
                            <PrivateRoute allowedRoles={['Employee']}>
                                <ApplicationStatusPage />
                            </PrivateRoute>
                        }
                    />


                    {/* HR Dashboard */}
                    <Route
                        path="/hr-dashboard"
                        element={
                            <PrivateRoute allowedRoles={['HR']}>
                                <HRDashboard />
                            </PrivateRoute>
                        }
                    />
                    {/* HR Specific Pages */}
                    <Route
                        path="/register-user"
                        element={
                            <PrivateRoute allowedRoles={['HR']}>
                                <RegisterUserPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/manage-employees"
                        element={
                            <PrivateRoute allowedRoles={['HR']}>
                                <ManageEmployeesPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/manage-leaves"
                        element={
                            <PrivateRoute allowedRoles={['HR']}>
                                <ManageLeavesPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/manage-attendance"
                        element={
                            <PrivateRoute allowedRoles={['HR']}>
                                <ManageAttendancePage />
                            </PrivateRoute>
                        }
                    />
                    {/* **THIS IS THE ROUTE FOR MANAGE LOCATIONS:** */}
                    <Route
                        path="/manage-locations"
                        element={
                            <PrivateRoute allowedRoles={['HR']}>
                                <ManageLocationsPage />
                            </PrivateRoute>
                        }
                    />

                    {/* My Profile Page (Accessible by both HR and Employee) */}
                    <Route
                        path="/my-profile"
                        element={
                            <PrivateRoute allowedRoles={['HR', 'Employee']}>
                                <MyProfilePage />
                            </PrivateRoute>
                        }
                    />


                    {/* Unauthorized Page */}
                    <Route path="/unauthorized" element={<h1>Unauthorized Access!</h1>} />

                    {/* Fallback for unknown routes */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                {/* ToastContainer added here */}
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
        </Router>
    );
}

export default App;