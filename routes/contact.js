const express = require('express');
const router = express.Router();
const db = require('../database/db');
const nodemailer = require('nodemailer');

// Contact page
router.get('/', (req, res) => {
  const activeTours = db.prepare('SELECT id, title FROM tours WHERE active = 1 ORDER BY title').all();

  res.render('pages/contact', {
    title: 'Kontakt - Magnolia Club',
    layout: 'layout/main',
    activeTours,
    success: req.query.success === '1',
    error: null
  });
});

// Handle contact form
router.post('/', async (req, res) => {
  const { name, email, phone, message, tour_id, gdpr } = req.body;
  const activeTours = db.prepare('SELECT id, title FROM tours WHERE active = 1 ORDER BY title').all();

  // Validate
  if (!name || !email || !message) {
    return res.render('pages/contact', {
      title: 'Kontakt - Magnolia Club',
      layout: 'layout/main',
      activeTours,
      success: false,
      error: 'Proszę wypełnić wszystkie wymagane pola.'
    });
  }

  if (!gdpr) {
    return res.render('pages/contact', {
      title: 'Kontakt - Magnolia Club',
      layout: 'layout/main',
      activeTours,
      success: false,
      error: 'Proszę zaakceptować zgodę na przetwarzanie danych osobowych.'
    });
  }

  // Save to database
  const tourId = tour_id && tour_id !== '' ? parseInt(tour_id) : null;
  db.prepare(
    'INSERT INTO contacts (name, email, phone, message, tour_id) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email, phone || null, message, tourId);

  // Send email notification
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const tourName = tourId
        ? db.prepare('SELECT title FROM tours WHERE id = ?').get(tourId)?.title || ''
        : 'Brak';

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        subject: `Nowe zapytanie od ${name} - Magnolia Club`,
        html: `
          <h2>Nowe zapytanie ze strony internetowej</h2>
          <p><strong>Imię i nazwisko:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefon:</strong> ${phone || 'Nie podano'}</p>
          <p><strong>Zainteresowanie wycieczką:</strong> ${tourName}</p>
          <hr>
          <p><strong>Wiadomość:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      });
    } catch (err) {
      console.error('Email send error:', err.message);
    }
  }

  res.redirect('/kontakt?success=1');
});

module.exports = router;
