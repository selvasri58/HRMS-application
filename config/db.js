// config/db.js
const sql = require('mssql');

// Database configuration using environment variables
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // You may need to use 'localhost' or '127.0.0.1' or your actual SQL Server IP/instance name
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // For Azure SQL Database or if you use encryption
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' // Change to true for local dev / self-signed certs
    }
};

// Function to connect to the database
async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to MS SQL Server successfully.');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1); // Exit process if database connection fails
    }
}

// Function to close the database connection (optional, good for graceful shutdowns)
async function closeDB() {
    try {
        await sql.close();
        console.log('MS SQL Server connection closed.');
    } catch (err) {
        console.error('Error closing database connection:', err);
    }
}

// Export the sql object for querying and connectDB function
module.exports = {
    sql,
    connectDB,
    closeDB
};