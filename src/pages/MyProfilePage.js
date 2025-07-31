// src/pages/MyProfilePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Box, Paper, CircularProgress, Alert, TextField, Button } from '@mui/material';

function MyProfilePage() {
  const [profile, setProfile] = useState({
    user_id: '',
    role: '',
    name: '', // Corresponds to 'name' in HR_Profiles/Employee_Profiles
    address: '',
    aadhar_number: '',
    pan_number: '',
    skills: '',
    working_experience: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For success messages
  const [isEditing, setIsEditing] = useState(false); // To toggle edit mode

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        // Set all fetched data to state, ensuring nulls become empty strings for controlled inputs
        setProfile({
            user_id: response.data.user_id || '',
            role: response.data.role || '',
            name: response.data.name || '',
            address: response.data.address || '',
            aadhar_number: response.data.aadhar_number || '',
            pan_number: response.data.pan_number || '',
            skills: response.data.skills || '',
            working_experience: response.data.working_experience || ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (err.response && err.response.data && err.response.data.msg) {
          setError(err.response.data.msg);
        } else {
          setError('Failed to load profile. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prevProfile => ({
      ...prevProfile,
      [name]: value
    }));
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoading(false);
        return;
      }

      await axios.put('http://localhost:5000/api/auth/profile', {
        // Send only the updatable profile fields
        name: profile.name,
        address: profile.address,
        aadhar_number: profile.aadhar_number,
        pan_number: profile.pan_number,
        skills: profile.skills,
        working_experience: profile.working_experience
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMessage('Profile updated successfully!');
      setIsEditing(false); // Exit edit mode on success
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err.response && err.response.data && err.response.data.msg) {
        setError(err.response.data.msg);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>
        ) : profile ? (
          <Paper elevation={3} sx={{ p: 4, mt: 3, width: '100%' }}>
            {message && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{message}</Alert>}
            <Typography variant="h6" gutterBottom sx={{mb: 3}}>
              Your Information
            </Typography>

            <TextField
              fullWidth
              label="User ID"
              name="user_id"
              value={profile.user_id || ''}
              margin="normal"
              InputProps={{ readOnly: true }} // User ID is read-only
            />
            <TextField
              fullWidth
              label="Role"
              name="role"
              value={profile.role || ''}
              margin="normal"
              InputProps={{ readOnly: true }} // Role is read-only
            />
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={profile.name || ''}
              onChange={handleChange}
              margin="normal"
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={profile.address || ''}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Aadhar Number"
              name="aadhar_number"
              value={profile.aadhar_number || ''}
              onChange={handleChange}
              margin="normal"
              disabled={!isEditing}
              inputProps={{ maxLength: 12 }} // Added maxLength for Aadhar
            />
            <TextField
              fullWidth
              label="PAN Number"
              name="pan_number"
              value={profile.pan_number || ''}
              onChange={handleChange}
              margin="normal"
              disabled={!isEditing}
              inputProps={{ maxLength: 10 }} // Added maxLength for PAN
            />
            <TextField
              fullWidth
              label="Skills"
              name="skills"
              value={profile.skills || ''}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Working Experience"
              name="working_experience"
              value={profile.working_experience || ''}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
              disabled={!isEditing}
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                {!isEditing ? (
                    <Button variant="contained" onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </Button>
                ) : (
                    <>
                        <Button variant="outlined" onClick={() => {
                            setIsEditing(false);
                            // To revert changes if user cancels, re-fetch profile data
                            // A simple way for now is to reload, but in a real app,
                            // you'd store initial fetched data and revert to it.
                            window.location.reload();
                        }}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleUpdate}>
                            Save Changes
                        </Button>
                    </>
                )}
            </Box>
          </Paper>
        ) : (
          <Alert severity="info" sx={{ width: '100%', mt: 2 }}>No profile data available.</Alert>
        )}
      </Box>
    </Container>
  );
}

export default MyProfilePage;