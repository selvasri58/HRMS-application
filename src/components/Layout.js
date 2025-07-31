// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    CssBaseline, // Important for consistent styling
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle'; // Example icon for user menu
import { useNavigate } from 'react-router-dom';

// CORRECT IMPORT: Import the comprehensive Sidebar component
import Sidebar from './Sidebar'; // This should point to src/components/Sidebar.js

const drawerWidth = 240; // Define your sidebar width (should match the one in Sidebar.js)

function Layout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userRole, setUserRole] = useState(null); // State to hold the user's role
    const navigate = useNavigate();

    useEffect(() => {
        // Retrieve user role from localStorage when the component mounts
        const storedUserRole = localStorage.getItem('userRole');
        if (storedUserRole) {
            setUserRole(storedUserRole);
        } else {
            // If no role is found, redirect to login (or unauthorized)
            console.warn("User role not found in Layout. Redirecting to login.");
            navigate('/');
        }
    }, [navigate]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenu = () => {
        navigate('/my-profile'); // Example: go to profile
    };

    // The drawer content is now simply the Sidebar component
    // Sidebar.js already includes its own Drawer, Toolbar (for app name), and LogoutButton
    const drawer = (
        <Sidebar />
    );

    if (!userRole) {
        // Render a loading state while userRole is being fetched/verified
        return <Box>Loading layout...</Box>;
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            {/* AppBar (Header) */}
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }} // Show on small screens
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        HRMS Application - {userRole} Portal
                    </Typography>
                    <div>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <AccountCircle />
                        </IconButton>
                        {/* You can add a Menu component here for user options */}
                    </div>
                </Toolbar>
            </AppBar>

            {/* Drawer (Sidebar) */}
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                {/* Mobile Drawer (temporary) */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop Drawer (permanent) */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                }}
            >
                <Toolbar /> {/* This creates space for the fixed AppBar */}
                {children} {/* THIS IS WHERE YOUR EMPLOYEE DASHBOARD OR OTHER PAGE CONTENT WILL BE RENDERED */}
            </Box>
        </Box>
    );
}

export default Layout;