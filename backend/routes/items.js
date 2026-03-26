const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/items — list all items (optional ?category=, ?search=, ?sort=)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { category, search, sort } = req.query;

    let query = `
      SELECT items.*, users.name as owner_name, users.trust_score as owner_trust_score, users.avatar as owner_avatar
      FROM items
      JOIN users ON items.owner_id = users.id
      WHERE items.available = 1
    `;
    const params = [];

    if (category && category !== 'All') {
      query += ' AND items.category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (items.title LIKE ? OR items.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (sort === 'price_asc') {
      query += ' ORDER BY items.price_per_day ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY items.price_per_day DESC';
    } else {
      query += ' ORDER BY items.created_at DESC';
    }

    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (err) {
    console.error('List items error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/items/:id — get single item detail
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const item = db.prepare(`
      SELECT items.*, users.name as owner_name, users.trust_score as owner_trust_score,
             users.avatar as owner_avatar, users.major as owner_major, users.created_at as owner_joined
      FROM items
      JOIN users ON items.owner_id = users.id
      WHERE items.id = ?
    `).get(req.params.id);

    if (!item) return res.status(404).json({ error: 'Item not found' });

    // Get reviews for this item's owner
    const reviews = db.prepare(`
      SELECT reviews.*, users.name as reviewer_name
      FROM reviews
      JOIN users ON reviews.reviewer_id = users.id
      WHERE reviews.reviewee_id = ?
      ORDER BY reviews.created_at DESC
      LIMIT 10
    `).all(item.owner_id);

    // Get existing bookings for availability calendar
    const bookings = db.prepare(`
      SELECT start_date, end_date FROM bookings
      WHERE item_id = ? AND status IN ('pending', 'confirmed', 'active')
    `).all(req.params.id);

    res.json({ ...item, reviews, bookings });
  } catch (err) {
    console.error('Get item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/items — create a new listing (auth required)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, description, price_per_day, deposit, category, condition, image_url } = req.body;

    if (!title || !price_per_day) {
      return res.status(400).json({ error: 'Title and price per day are required' });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO items (id, title, description, price_per_day, deposit, category, condition, image_url, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, description || '', price_per_day, deposit || 0, category || 'Other', condition || 'Good', image_url || '', req.user.id);

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.status(201).json(item);
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/items/predict-price — AI price suggestion
router.post('/predict-price', authMiddleware, async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const prompt = `[INST] Suggest a reasonable daily rental price in Indian Rupees (INR) for a campus rental platform. Respond with ONLY the numeric value (no currency symbols or text).
    Item: '${title}'
    Category: '${category || 'Other'}' [/INST]`;

    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        inputs: prompt,
        parameters: { max_new_tokens: 10, return_full_text: false }
      })
    });

    const result = await response.json();
    let priceText = '';
    if (Array.isArray(result)) priceText = result[0].generated_text;
    else if (result.generated_text) priceText = result.generated_text;

    const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 50; // Default fallback ₹50
    const suggestedDeposit = Math.round(price * 10); // Simple heuristic: 10x rent

    res.json({ suggestedPrice: price, suggestedDeposit });
  } catch (err) {
    console.error('Price prediction error:', err);
    res.status(500).json({ error: 'Failed to predict price' });
  }
});

// PUT /api/items/:id — update item (auth required, owner only)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { price_per_day, deposit, title, description, category, condition, image_url, available } = req.body;
    const db = getDb();

    // Verify ownership
    const item = db.prepare('SELECT owner_id FROM items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.owner_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized to update this item' });

    db.prepare(`
      UPDATE items SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        price_per_day = COALESCE(?, price_per_day),
        deposit = COALESCE(?, deposit),
        category = COALESCE(?, category),
        condition = COALESCE(?, condition),
        image_url = COALESCE(?, image_url),
        available = COALESCE(?, available)
      WHERE id = ?
    `).run(title, description, price_per_day, deposit, category, condition, image_url, available, req.params.id);

    const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
