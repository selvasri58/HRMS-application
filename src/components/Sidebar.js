// src/components/Sidebar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Divider,
    Typography,
    Box
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // NEW: Import for Application Status Icon

const drawerWidth = 240;

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const userRole = localStorage.getItem('userRole');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/');
    };

    const hrNavItems = [
        { text: 'HR Dashboard', icon: <DashboardIcon />, path: '/hr-dashboard' },
        { text: 'My Profile', icon: <PersonIcon />, path: '/my-profile' },
        { text: 'Register User', icon: <PersonAddIcon />, path: '/register-user' },
        { text: 'Manage Employees', icon: <PeopleIcon />, path: '/manage-employees' },
        { text: 'Manage Leaves', icon: <EventBusyIcon />, path: '/manage-leaves' },
        { text: 'Manage Attendance', icon: <AccessTimeIcon />, path: '/manage-attendance' },
        { text: 'Manage Geo Locations', icon: <LocationOnIcon />, path: '/manage-locations' },
    ];

    const employeeNavItems = [
        { text: 'Employee Dashboard', icon: <DashboardIcon />, path: '/employee-dashboard' },
        { text: 'My Profile', icon: <PersonIcon />, path: '/my-profile' },
        { text: 'My Attendance', icon: <AssignmentTurnedInIcon />, path: '/my-attendance' },
        { text: 'Apply Leave', icon: <EventBusyIcon />, path: '/apply-leave' },
        // NEW: Add Application Status to employee navigation items
        { text: 'Application Status', icon: <CheckCircleOutlineIcon />, path: '/application-status' },
    ];

    const currentNavItems = userRole === 'HR' ? hrNavItems : employeeNavItems;

    return (
        <Drawer
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                },
            }}
            variant="permanent"
            anchor="left"
        >
            <Toolbar sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '64px',
                backgroundColor: '#28a745',
                color: 'white'
            }}>
                <Typography variant="h6" noWrap component="div">
                    HRMS App
                </Typography>
            </Toolbar>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            <List>
                {currentNavItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            onClick={() => navigate(item.path)}
                            selected={location.pathname === item.path}
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    color: '#28a745',
                                    '& .MuiListItemIcon-root': {
                                        color: '#28a745',
                                    },
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} sx={{ '& .MuiListItemText-primary': { fontWeight: 'bold' } }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            <List sx={{ mt: 'auto' }}>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIcon sx={{ color: 'white' }}><ExitToAppIcon /></ListItemIcon>
                        <ListItemText primary="Logout" sx={{ '& .MuiListItemText-primary': { fontWeight: 'bold' } }} />
                    </ListItemButton>
                </ListItem>
            </List>
        </Drawer>
    );
}

export default Sidebar;