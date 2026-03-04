const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Home page
router.get('/', (req, res) => {
  const featuredTours = db.prepare(
    'SELECT * FROM tours WHERE featured = 1 AND active = 1 ORDER BY departure_date ASC LIMIT 3'
  ).all();

  const recentPosts = db.prepare(
    'SELECT * FROM blog_posts WHERE published = 1 ORDER BY created_at DESC LIMIT 3'
  ).all();

  res.render('pages/home', {
    title: 'Magnolia Club - Poznaj świat inaczej',
    layout: 'layout/main',
    featuredTours,
    recentPosts
  });
});

// About page
router.get('/o-nas', (req, res) => {
  res.render('pages/about', {
    title: 'O nas - Magnolia Club',
    layout: 'layout/main'
  });
});

// Documents page
router.get('/dokumenty', (req, res) => {
  const documents = db.prepare(
    'SELECT * FROM documents ORDER BY category, title'
  ).all();

  // Group by category
  const grouped = {};
  for (const doc of documents) {
    if (!grouped[doc.category]) grouped[doc.category] = [];
    grouped[doc.category].push(doc);
  }

  res.render('pages/documents', {
    title: 'Dokumenty - Magnolia Club',
    layout: 'layout/main',
    documentsByCategory: grouped
  });
});

module.exports = router;
