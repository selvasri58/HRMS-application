// server.js (or wherever you define your main Express app)

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sql = require('mssql');
require('dotenv').config(); // Load environment variables

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON request bodies

// Database configuration (ensure this is correctly set up in your .env)
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // Use true for Azure SQL Database, false for local dev
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' // Change to true for local dev / self-signed certs
    }
};

// Connect to SQL Server
sql.connect(dbConfig)
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => console.error('Database connection failed!', err));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leaveRoutes = require('./routes/leaves');
const attendanceRoutes = require('./routes/attendance');
const geoLocationsRoutes = require('./routes/geoLocations'); // NEW: Import geoLocations routes

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/geo-locations', geoLocationsRoutes); // NEW: Use geoLocations routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));