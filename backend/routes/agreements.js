const express = require('express');
const PDFDocument = require('pdfkit');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// POST /api/agreements — Store a new agreement
router.post('/', authMiddleware, (req, res) => {
  try {
    const { booking_id, item_id, renter_id, owner_id, price, deposit, start_date, end_date, terms_accepted } = req.body;

    if (!booking_id || !terms_accepted) {
      return res.status(400).json({ error: 'Missing required agreement data' });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO agreements (id, booking_id, item_id, renter_id, owner_id, price, deposit, start_date, end_date, terms_accepted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, booking_id, item_id, renter_id, owner_id, price, deposit, start_date, end_date, terms_accepted ? 1 : 0);

    res.status(201).json({ id });
  } catch (err) {
    console.error('Create agreement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI-powered Agreement Content Generation using Hugging Face
async function getAiAgreementContent(renter, owner, item, price) {
  try {
    const prompt = `[INST] Draft a professional academic rental agreement for '${item}' between ${owner} (Lender) and ${renter} (Renter) at ${price}/day. 
    Output ONLY in this JSON format:
    {
      "verification_note": "one sentence trust seal",
      "terms": ["term 1", "term 2", "term 3", "term 4", "term 5"]
    }
    [/INST]`;
    
    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        inputs: prompt,
        parameters: { max_new_tokens: 500, return_full_text: false }
      })
    });

    const result = await response.json();
    let text = '';
    if (Array.isArray(result)) text = result[0].generated_text;
    else if (result.generated_text) text = result.generated_text;

    // Parse JSON from free-form response if necessary
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if formatting fails
    return {
      verification_note: `Agreed by ${renter} and ${owner} for ${item} under Rentora Secure Protocol.`,
      terms: [
        '1. Mutual agreement on condition and return expectation.',
        '2. Zero tolerance for damage beyond normal wear.',
        '3. Late fee applied synchronously via platform.',
        '4. Verification seal anchored to Rentora ID.',
        '5. Safe handling and professional care required.'
      ]
    };
  } catch (err) {
    console.error('HF API Error (Mistral):', err);
    return {
      verification_note: `Verified Agreement between ${renter} and ${owner} via Rentora Secure Protocol.`,
      terms: [
        '1. Condition of item confirmed at handover.',
        '2. Responsible usage and maintenance by renter.',
        '3. Timely return as specified in booking.',
        '4. Damage coverage via security deposit.',
        '5. Campus-exclusive trust policy applied.'
      ]
    };
  }
}

// GET /api/agreements/pdf/:booking_id — Generate PDF
router.get('/pdf/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const db = getDb();

    // Fetch agreement and related data
    const agreement = db.prepare(`
      SELECT a.*, 
             u_renter.name as renter_name, u_renter.email as renter_email,
             u_owner.name as owner_name, u_owner.email as owner_email,
             i.title as item_title
      FROM agreements a
      JOIN users u_renter ON a.renter_id = u_renter.id
      JOIN users u_owner ON a.owner_id = u_owner.id
      JOIN items i ON a.item_id = i.id
      WHERE a.booking_id = ?
    `).get(bookingId);

    if (!agreement) {
      // FIX: If agreement is missing, but booking exists, create one on-demand
      console.log(`🔍 Agreement missing for booking ${bookingId}, attempting on-demand generation...`);
      const booking = db.prepare(`
        SELECT b.*, i.title as item_title, i.price_per_day
        FROM bookings b
        JOIN items i ON b.item_id = i.id
        WHERE b.id = ?
      `).get(bookingId);

      if (!booking) {
        return res.status(404).json({ error: 'Agreement and Booking not found' });
      }

      const id = uuidv4();
      db.prepare(`
        INSERT INTO agreements (id, booking_id, item_id, renter_id, owner_id, price, deposit, start_date, end_date, terms_accepted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(id, bookingId, booking.item_id, booking.renter_id, booking.owner_id, booking.price_per_day, booking.deposit, booking.start_date, booking.end_date);

      // Re-fetch to get joined names/emails
      return res.redirect(req.originalUrl);
    }

    // AI dynamic agreement generation
    const aiContent = await getAiAgreementContent(
      agreement.renter_name, 
      agreement.owner_name, 
      agreement.item_title,
      `₹${agreement.price}`
    );

    const doc = new PDFDocument({ margin: 50 });
    let filename = `Agreement_${bookingId}.pdf`;
    filename = encodeURIComponent(filename);

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('RENTAL AGREEMENT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Agreement ID: ${agreement.id}`, { align: 'right' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);

    // Parties — two-column layout using absolute positioning
    const partyY = doc.y;
    // Left column: Lender
    doc.fontSize(14).font('Helvetica-Bold').text('BETWEEN:', 50, partyY);
    doc.fontSize(12).font('Helvetica-Bold').text('Lender (Owner):', 50, partyY + 24);
    doc.font('Helvetica').text(agreement.owner_name, 50, partyY + 42);
    doc.text(agreement.owner_email, 50, partyY + 58);

    // Right column: Renter
    doc.fontSize(14).font('Helvetica-Bold').text('AND:', 320, partyY);
    doc.fontSize(12).font('Helvetica-Bold').text('Renter:', 320, partyY + 24);
    doc.font('Helvetica').text(agreement.renter_name, 320, partyY + 42);
    doc.text(agreement.renter_email, 320, partyY + 58);

    // Move cursor below both columns
    doc.y = partyY + 90;
    doc.moveDown(2);

    // Item Details
    doc.fontSize(16).font('Helvetica-Bold').text('ITEM DETAILS', { underline: true });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Item: ${agreement.item_title}`);
    doc.text(`Rental Period: ${agreement.start_date} to ${agreement.end_date}`);
    doc.moveDown();
    doc.text(`Daily Rate: ₹${agreement.price}`);
    doc.text(`Security Deposit: ₹${agreement.deposit}`);
    doc.moveDown(2);

    // Terms
    doc.fontSize(16).font('Helvetica-Bold').text('TERMS & CONDITIONS', { underline: true });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').fillColor('#333');
    
    aiContent.terms.forEach(t => {
      doc.text(t, { lineGap: 5 });
      doc.moveDown(0.2);
    });
    
    doc.moveDown(2);

    // Signatures (Placeholder style)
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('DIGITAL ACCEPTANCE', { underline: true });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a2e').text(`AI Trust Verification:`, { continued: true }).font('Helvetica').fillColor('#000').text(` ${aiContent.verification_note}`);
    doc.moveDown();
    doc.fontSize(9).font('Helvetica').text(`The Renter (${agreement.renter_name}) has electronically accepted these terms on ${agreement.created_at}.`);
    doc.text('This document is a legally binding electronic agreement processed by Rentora.');

    doc.moveDown(4);
    doc.fontSize(8).font('Helvetica-Oblique').text('Note: This is a system-generated document and does not require a physical signature.', { align: 'center', color: '#666' });

    doc.end();

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
