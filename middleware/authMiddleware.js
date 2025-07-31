// hrms-backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = process.env; // Assuming your JWT_SECRET is in your .env or similar

function verifyToken(req, res, next) { // Changed function name to verifyToken
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        // The 'jwt.verify' method will throw an error if the token is invalid or expired
        const decoded = jwt.verify(token, config.JWT_SECRET); // Use config.JWT_SECRET

        // Attach user payload to the request object
        req.user = decoded.user;
        next(); // Move to the next middleware/route handler
    } catch (err) {
        res.status(403).json({ msg: 'Token is not valid' });
    }
}

module.exports = verifyToken; // Exporting verifyToken