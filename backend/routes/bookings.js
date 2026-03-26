const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/bookings — create a booking (auth required)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { item_id, start_date, end_date, payment_method } = req.body;
    console.log(`\n📦 New Booking Request:`, { item_id, start_date, end_date, payment_method });

    if (!item_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'item_id, start_date, and end_date are required' });
    }

    const db = getDb();

    // Get the item
    const item = db.prepare('SELECT * FROM items WHERE id = ? AND available = 1').get(item_id);
    if (!item) return res.status(404).json({ error: 'Item not found or unavailable' });

    // Cannot book own item
    if (item.owner_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot book your own item' });
    }

    // Check date overlap with existing active bookings
    const overlapping = db.prepare(`
      SELECT id FROM bookings
      WHERE item_id = ?
        AND status IN ('pending', 'confirmed', 'active')
        AND start_date <= ?
        AND end_date >= ?
    `).get(item_id, end_date, start_date);

    if (overlapping) {
      return res.status(409).json({ error: 'These dates overlap with an existing booking. Please select different dates.' });
    }

    // Calculate total
    const startMs = new Date(start_date).getTime();
    const endMs = new Date(end_date).getTime();
    const days = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
    const total_rental = days * item.price_per_day;

    const id = uuidv4();

    db.prepare(`
      INSERT INTO bookings (id, item_id, renter_id, owner_id, start_date, end_date, total_rental, deposit, status, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(id, item_id, req.user.id, item.owner_id, start_date, end_date, total_rental, item.deposit, payment_method || 'card');

    // Automatically create an agreement entry for this booking
    const agreementId = uuidv4();
    db.prepare(`
      INSERT INTO agreements (id, booking_id, item_id, renter_id, owner_id, price, deposit, start_date, end_date, terms_accepted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(agreementId, id, item_id, req.user.id, item.owner_id, item.price_per_day, item.deposit, start_date, end_date);

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

    res.status(201).json({
      ...booking,
      days,
      item_title: item.title,
      item_image: item.image_url
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings — list user's bookings (as renter or owner)
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();

    const bookings = db.prepare(`
      SELECT bookings.*, items.title as item_title, items.image_url as item_image,
             items.price_per_day, renter.name as renter_name, owner.name as owner_name
      FROM bookings
      JOIN items ON bookings.item_id = items.id
      JOIN users renter ON bookings.renter_id = renter.id
      JOIN users owner ON bookings.owner_id = owner.id
      WHERE bookings.renter_id = ? OR bookings.owner_id = ?
      ORDER BY bookings.created_at DESC
    `).all(req.user.id, req.user.id);

    res.json(bookings);
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/bookings/:id/status — update booking status (confirm, complete, cancel)
router.patch('/:id/status', authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'active', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Only owner can confirm, only renter/owner can cancel
    if (status === 'confirmed' && booking.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the item owner can confirm a booking' });
    }

    if (status === 'cancelled' && booking.renter_id !== req.user.id && booking.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the renter or owner can cancel' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);

    // If status is becoming active (pickup) or completed (return), update escrow
    if (status === 'active') {
       db.prepare("UPDATE bookings SET escrow_status = 'held' WHERE id = ?").run(req.params.id);
    } else if (status === 'completed') {
       db.prepare("UPDATE bookings SET escrow_status = 'released' WHERE id = ?").run(req.params.id);
    }

    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/bookings/:id/escrow — update escrow status (for damage deduction)
router.patch('/:id/escrow', authMiddleware, (req, res) => {
  try {
    const { escrow_status } = req.body;
    const validEscrowStatuses = ['held', 'released', 'deducted'];

    if (!validEscrowStatuses.includes(escrow_status)) {
       return res.status(400).json({ error: 'Invalid escrow status' });
    }

    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Only owner can report damage/update escrow status to deducted
    if (booking.owner_id !== req.user.id) {
       return res.status(403).json({ error: 'Only the item owner can update escrow status' });
    }

    db.prepare('UPDATE bookings SET escrow_status = ? WHERE id = ?').run(escrow_status, req.params.id);
    
    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Update escrow status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/item/:itemId — get bookings for a specific item (for availability calendar)
router.get('/item/:itemId', (req, res) => {
  try {
    const db = getDb();
    const bookings = db.prepare(`
      SELECT start_date, end_date, status FROM bookings
      WHERE item_id = ? AND status IN ('pending', 'confirmed', 'active')
    `).all(req.params.itemId);

    res.json(bookings);
  } catch (err) {
    console.error('Item bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
