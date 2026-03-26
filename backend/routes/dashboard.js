const express = require('express');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard — get dashboard stats for the logged-in user
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    // Active rentals (as renter)
    const activeRentals = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE renter_id = ? AND status IN ('confirmed', 'active')
    `).get(userId);

    // Items lent out
    const activeLent = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE owner_id = ? AND status IN ('confirmed', 'active')
    `).get(userId);

    // Total earnings from completed bookings as owner
    const earnings = db.prepare(`
      SELECT COALESCE(SUM(total_rental), 0) as total FROM bookings
      WHERE owner_id = ? AND status = 'completed'
    `).get(userId);

    // Items listed
    const itemsListed = db.prepare(`
      SELECT COUNT(*) as count FROM items WHERE owner_id = ?
    `).get(userId);

    // Upcoming bookings (as renter, confirmed/pending)
    const upcoming = db.prepare(`
      SELECT bookings.*, items.title as item_title, items.image_url as item_image,
             items.price_per_day, owner.name as owner_name
      FROM bookings
      JOIN items ON bookings.item_id = items.id
      JOIN users owner ON bookings.owner_id = owner.id
      WHERE bookings.renter_id = ? AND bookings.status IN ('pending', 'confirmed')
      ORDER BY bookings.start_date ASC
      LIMIT 5
    `).all(userId);

    // Recent activity (all bookings as renter or owner)
    const recentActivity = db.prepare(`
      SELECT bookings.*, items.title as item_title, items.image_url as item_image,
             renter.name as renter_name, owner.name as owner_name
      FROM bookings
      JOIN items ON bookings.item_id = items.id
      JOIN users renter ON bookings.renter_id = renter.id
      JOIN users owner ON bookings.owner_id = owner.id
      WHERE bookings.renter_id = ? OR bookings.owner_id = ?
      ORDER BY bookings.created_at DESC
      LIMIT 10
    `).all(userId, userId);

    // Trust score
    const user = db.prepare('SELECT trust_score FROM users WHERE id = ?').get(userId);

    res.json({
      active_rentals: activeRentals.count,
      active_lent: activeLent.count,
      total_earnings: earnings.total,
      items_listed: itemsListed.count,
      trust_score: user?.trust_score || 80,
      upcoming,
      recent_activity: recentActivity
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
