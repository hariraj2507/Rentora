const express = require('express');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/ai-chat — Process user message for product suggestions
router.post('/', authMiddleware, (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const db = getDb();
    const input = message.toLowerCase();

    // 1. Determine Intent / Keywords
    let query = `
      SELECT items.*, users.name as owner_name, users.avatar as owner_avatar
      FROM items
      JOIN users ON items.owner_id = users.id
      WHERE items.available = 1
    `;
    const params = [];

    // Basic Keyword matching
    const categories = ['Electronics', 'Academic', 'Books', 'Equipment', 'Other'];
    const matchedCategory = categories.find(c => input.includes(c.toLowerCase()));

    if (matchedCategory) {
      query += ' AND items.category = ?';
      params.push(matchedCategory);
    }

    // Keyword: "cheap" or "affordable" or "under"
    let isCheapRequest = input.includes('cheap') || input.includes('affordable');
    let underPrice = null;
    const underMatch = input.match(/under (?:₹|rs\.? )?(\d+)/);
    if (underMatch) {
      underPrice = parseInt(underMatch[1]);
      query += ' AND items.price_per_day <= ?';
      params.push(underPrice);
    }

    // Keyword: Search term
    const commonKeywords = ['calculator', 'camera', 'laptop', 'headphones', 'tripod', 'textbook', 'vacuum', 'mic'];
    const matchedKeyword = commonKeywords.find(k => input.includes(k));
    if (matchedKeyword) {
      query += ' AND (items.title LIKE ? OR items.description LIKE ?)';
      params.push(`%${matchedKeyword}%`, `%${matchedKeyword}%`);
    }

    // 2. Sorting
    if (isCheapRequest || underPrice) {
      query += ' ORDER BY items.price_per_day ASC';
    } else {
      query += ' ORDER BY items.created_at DESC';
    }

    // 3. Execution
    const items = db.prepare(query + ' LIMIT 5').all(...params);

    // 4. Generate Response Text
    let aiResponse = "";
    if (items.length > 0) {
      aiResponse = `I found ${items.length} item${items.length > 1 ? 's' : ''} that might interest you:`;
    } else {
      aiResponse = "I couldn't find any specific items matching those criteria, but here are some of our popular listings!";
      const fallbackItems = db.prepare(`
        SELECT items.*, users.name as owner_name 
        FROM items 
        JOIN users ON items.owner_id = users.id 
        WHERE items.available = 1 
        ORDER BY items.created_at DESC LIMIT 3
      `).all();
      return res.json({
        message: aiResponse,
        items: fallbackItems,
        suggestion: "Try asking for 'calculators' or 'electronics under ₹50'."
      });
    }

    res.json({
      message: aiResponse,
      items: items,
      suggestion: items.length < 3 ? "Would you like to see more items in this category?" : null
    });

  } catch (err) {
    console.error('AI Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
