const express = require('express');
const router = express.Router();
const { pool } = require('../services/database');
const { requireAuth } = require('../middleware/auth');

// GET /api/me/profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT profile_json, is_completed FROM student_profiles WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ exists: false });
        }

        res.json({
            exists: true,
            profile: result.rows[0].profile_json,
            is_completed: result.rows[0].is_completed
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// POST /api/me/profile
router.post('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const studentData = req.body;

        // Basic validation
        if (!studentData.name || !studentData.email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Upsert profile
        await pool.query(`
            INSERT INTO student_profiles (user_id, profile_json, is_completed, updated_at)
            VALUES ($1, $2, true, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                profile_json = $2,
                is_completed = true,
                updated_at = NOW()
        `, [userId, studentData]);

        res.json({ success: true });
    } catch (error) {
        console.error('Save profile error:', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

module.exports = router;
