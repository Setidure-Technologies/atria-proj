/**
 * Authentication and Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const { getUserWithRoles } = require('../services/database');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_production_use_env_variable';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 */
function generateToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        name: user.name,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Middleware: Require authentication
 * Validates JWT token and attaches user to req.user
 */
async function requireAuth(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided',
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }

        // Get user with roles
        const user = await getUserWithRoles(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'User account is disabled',
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error',
        });
    }
}

/**
 * Middleware: Require admin role
 * Must be used after requireAuth
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
    }

    if (!req.user.roles || !req.user.roles.includes('ADMIN')) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required',
        });
    }

    next();
}

/**
 * Middleware: Require candidate role
 * Must be used after requireAuth
 */
function requireCandidate(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
    }

    if (!req.user.roles || !req.user.roles.includes('CANDIDATE')) {
        return res.status(403).json({
            success: false,
            error: 'Candidate access required',
        });
    }

    next();
}

/**
 * Middleware: Optional authentication
 * Attaches user if token is valid, but doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);

            if (decoded) {
                const user = await getUserWithRoles(decoded.userId);
                if (user && user.status === 'active') {
                    req.user = user;
                }
            }
        }
        next();
    } catch (error) {
        // Silently continue without user
        next();
    }
}

module.exports = {
    generateToken,
    verifyToken,
    requireAuth,
    requireAdmin,
    requireCandidate,
    optionalAuth,
};
