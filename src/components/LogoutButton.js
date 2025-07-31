// src/components/LogoutButton.js
import React from 'react';
import { Button, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName'); // Clear any other user data
        navigate('/'); // Redirect to login page
    };

    return (
        <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
                <ListItemIcon><ExitToAppIcon /></ListItemIcon>
                <ListItemText primary="Logout" />
            </ListItemButton>
        </ListItem>
        // Or a simple button:
        // <Button variant="contained" onClick={handleLogout} sx={{ m: 2 }}>Logout</Button>
    );
}

export default LogoutButton;