// hrms-backend/middleware/authorizeMiddleware.js
const authorize = (allowedRoles) => (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(401).json({ msg: 'No authorization token or user role found' });
    }

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'Access denied: You do not have the required role.' });
    }

    next();
};

// hrms-backend/middleware/authorizeRole.js
const authorizeRole = (allowedRoles) => (req, res, next) => { // Changed function name to authorizeRole
    if (!req.user || !req.user.role) {
        return res.status(401).json({ msg: 'No authorization token or user role found' });
    }

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'Access denied: You do not have the required role.' });
    }

    next();
};

module.exports = authorizeRole; // Exporting authorizeRole