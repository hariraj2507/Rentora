const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/rental-requests -> create a new request
router.post('/', authMiddleware, (req, res) => {
  try {
    const { item_id, start_date, end_date } = req.body;
    
    if (!item_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'item_id, start_date, and end_date are required' });
    }

    const db = getDb();
    
    // Get the item to find owner
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(item_id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.owner_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot request your own item' });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO rental_requests (id, item_id, renter_id, owner_id, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, item_id, req.user.id, item.owner_id, start_date, end_date);

    const request = db.prepare('SELECT * FROM rental_requests WHERE id = ?').get(id);

    res.status(201).json(request);
  } catch (err) {
    console.error('Create rental request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rental-requests/owner/:owner_id -> fetch requests for lender
router.get('/owner/:owner_id', authMiddleware, (req, res) => {
  try {
    const { owner_id } = req.params;
    
    if (owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view these requests' });
    }

    const db = getDb();
    const requests = db.prepare(`
      SELECT rental_requests.*, 
             items.title as item_title, items.image_url as item_image, items.price_per_day, items.deposit,
             renter.name as renter_name, renter.avatar as renter_avatar
      FROM rental_requests
      JOIN items ON rental_requests.item_id = items.id
      JOIN users renter ON rental_requests.renter_id = renter.id
      WHERE rental_requests.owner_id = ?
      ORDER BY rental_requests.created_at DESC
    `).all(owner_id);

    res.json(requests);
  } catch (err) {
    console.error('Get owner rental requests error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rental-requests/renter/:renter_id -> fetch requests for renter
router.get('/renter/:renter_id', authMiddleware, (req, res) => {
  try {
    const { renter_id } = req.params;
    
    if (renter_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view these requests' });
    }

    const db = getDb();
    const requests = db.prepare(`
      SELECT rental_requests.*, 
             items.title as item_title, items.image_url as item_image, items.price_per_day, items.deposit,
             owner.name as owner_name, owner.avatar as owner_avatar
      FROM rental_requests
      JOIN items ON rental_requests.item_id = items.id
      JOIN users owner ON rental_requests.owner_id = owner.id
      WHERE rental_requests.renter_id = ?
      ORDER BY rental_requests.created_at DESC
    `).all(renter_id);

    res.json(requests);
  } catch (err) {
    console.error('Get renter rental requests error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PATCH /api/rental-requests/:id -> accept/reject/booked
router.patch('/:id', authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['accepted', 'rejected', 'booked'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted, rejected, or booked' });
    }

    const db = getDb();
    const request = db.prepare('SELECT * FROM rental_requests WHERE id = ?').get(req.params.id);

    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    if (status === 'accepted' || status === 'rejected') {
      if (request.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Only owner can accept or reject' });
      }
    } else if (status === 'booked') {
      if (request.renter_id !== req.user.id) {
        return res.status(403).json({ error: 'Only renter can mark as booked' });
      }
    }
    
    // Check if already processed (except for converting accepted to booked)
    if (request.status !== 'pending' && status !== 'booked') {
      return res.status(400).json({ error: 'Request is already ' + request.status });
    }

    db.prepare('UPDATE rental_requests SET status = ? WHERE id = ?').run(status, req.params.id);
    
    const updated = db.prepare('SELECT * FROM rental_requests WHERE id = ?').get(req.params.id);

    res.json(updated);
  } catch (err) {
    console.error('Update request status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
