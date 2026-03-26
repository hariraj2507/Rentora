const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

// Send message
router.post('/', authMiddleware, (req, res) => {
  const { receiver_id, item_id, message_text } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !item_id || !message_text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, sender_id, receiver_id, item_id, message_text)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, sender_id, receiver_id, item_id, message_text);

    res.status(201).json({ id, sender_id, receiver_id, item_id, message_text, created_at: new Date().toISOString() });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Get all recent message threads for the user (MUST be before /:itemId)
router.get('/user', authMiddleware, (req, res) => {
  const userId = req.user.id;
  try {
    const db = getDb();
    const threads = db.prepare(`
      SELECT m.*, 
             u_sender.name as sender_name, u_sender.avatar as sender_avatar,
             u_receiver.name as receiver_name, u_receiver.avatar as receiver_avatar,
             i.title as item_title, i.image_url as item_image
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      JOIN users u_receiver ON m.receiver_id = u_receiver.id
      JOIN items i ON m.item_id = i.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at DESC
    `).all(userId, userId);

    res.json(threads);
  } catch (err) {
    console.error('Get user messages error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Get messages for an item context (strictly between two users)
router.get('/:itemId', authMiddleware, (req, res) => {
  const { itemId } = req.params;
  const { user1, user2 } = req.query;
  const currentUserId = req.user.id;

  // Identify conversation parties
  const party1 = user1 || currentUserId;
  const party2 = user2 || req.query.partnerId;

  if (!party2) {
    return res.status(400).json({ error: 'Missing conversation partner ID' });
  }

  // Security: only allow users in the conversation to see the messages
  if (currentUserId !== party1 && currentUserId !== party2) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const db = getDb();
    const messages = db.prepare(`
      SELECT id as message_id, sender_id, receiver_id, item_id, message_text, created_at as timestamp
      FROM messages 
      WHERE item_id = ? 
      AND (
        (sender_id = ? AND receiver_id = ?) OR 
        (sender_id = ? AND receiver_id = ?)
      )
      ORDER BY created_at ASC
    `).all(itemId, party1, party2, party2, party1);

    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
