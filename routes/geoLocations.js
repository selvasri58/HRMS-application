// routes/geoLocations.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');

// Remove the GLOBAL_ATTENDANCE_HR_ID constant as we will use req.user.id directly
// const GLOBAL_ATTENDANCE_HR_ID = 'GLOBAL_ATTENDANCE_HR';

// Helper function to calculate Haversine distance (keep this as is)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (x) => (x * Math.PI) / 180;

    const R = 6371e3; // metres
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // in meters
    return distance;
}


// @route   GET /api/geo-locations
// @desc    Get the single global attendance location
// @access  Public (or HR/Employee, depending on your needs. Employee will also need to fetch this)
router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect();
        // UPDATED: No longer filter by a specific HR_ID, just get the first (and only) global record
        const result = await pool.request()
            .query(`SELECT TOP 1 location_name, latitude, longitude, radius_meters FROM Geo_Locations ORDER BY set_at DESC`);
            // Assumption: Geo_Locations table will always have at most one global record.
            // If you later need multiple types of locations, you'd add a 'type' column.

        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'No global attendance location set yet.' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching global geo-location:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/geo-locations
// @desc    Set or update the single global attendance location (UPSERT)
// @access  Private (HR only)
router.post('/', verifyToken, authorizeRole(['HR']), async (req, res) => {
    const { location_name, latitude, longitude, radius_meters } = req.body;
    // Get the actual HR's user ID from the token
    const hr_id = req.user.id; // This is the ID of the HR who is setting/updating the location

    if (!location_name || latitude === undefined || longitude === undefined || radius_meters === undefined) {
        return res.status(400).json({ msg: 'Please provide location name, latitude, longitude, and radius.' });
    }

    try {
        const pool = await sql.connect();

        // UPDATED LOGIC: Check if ANY global location record exists (assuming only one global record)
        const checkResult = await pool.request()
            .query(`SELECT TOP 1 location_id FROM Geo_Locations`); // Get the ID of the existing global record

        if (checkResult.recordset.length > 0) {
            // Record exists, perform UPDATE on the existing record
            const existingLocationId = checkResult.recordset[0].location_id;

            await pool.request()
                .input('location_id', sql.Int, existingLocationId) // Use the found ID to update
                .input('location_name', sql.NVarChar(100), location_name)
                .input('latitude', sql.Decimal(9, 6), latitude)
                .input('longitude', sql.Decimal(9, 6), longitude)
                .input('radius_meters', sql.Int, radius_meters)
                .input('hr_id', sql.NVarChar(50), hr_id) // Attribute to the currently logged-in HR
                .query(`UPDATE Geo_Locations
                        SET location_name = @location_name,
                            latitude = @latitude,
                            longitude = @longitude,
                            radius_meters = @radius_meters,
                            hr_id = @hr_id, -- Update the HR who last set it
                            set_at = GETDATE()
                        WHERE location_id = @location_id`);
            res.json({ msg: 'Global attendance location updated successfully.' });
        } else {
            // No record exists, perform INSERT
            await pool.request()
                .input('location_name', sql.NVarChar(100), location_name)
                .input('latitude', sql.Decimal(9, 6), latitude)
                .input('longitude', sql.Decimal(9, 6), longitude)
                .input('radius_meters', sql.Int, radius_meters)
                .input('hr_id', sql.NVarChar(50), hr_id) // Insert with the currently logged-in HR
                .query(`INSERT INTO Geo_Locations (location_name, latitude, longitude, radius_meters, hr_id, set_at)
                        VALUES (@location_name, @latitude, @longitude, @radius_meters, @hr_id, GETDATE())`);
            res.status(201).json({ msg: 'Global attendance location set successfully.' });
        }
    } catch (err) {
        console.error('Error setting global geo-location:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/geo-locations
// @desc    Delete the single global attendance location
// @access  Private (HR only)
router.delete('/', verifyToken, authorizeRole(['HR']), async (req, res) => {
    try {
        const pool = await sql.connect();
        // UPDATED: No longer filter by a specific HR_ID, just delete the first (and only) global record
        const result = await pool.request()
            .query(`DELETE TOP (1) FROM Geo_Locations`); // Delete the first (and likely only) global record

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ msg: 'No global attendance location found to delete.' });
        }

        res.json({ msg: 'Global attendance location deleted successfully.' });
    } catch (err) {
        console.error('Error deleting global geo-location:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;