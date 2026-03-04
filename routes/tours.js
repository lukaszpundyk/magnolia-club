const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Tours listing
router.get('/', (req, res) => {
  const { transport, days, destination, maxPrice } = req.query;

  let sql = 'SELECT * FROM tours WHERE active = 1';
  const params = [];

  if (transport && transport !== 'all') {
    sql += ' AND transport = ?';
    params.push(transport);
  }

  if (days && days !== 'all') {
    if (days === '1') {
      sql += ' AND days = 1';
    } else if (days === '2-3') {
      sql += ' AND days >= 2 AND days <= 3';
    } else if (days === '4-7') {
      sql += ' AND days >= 4 AND days <= 7';
    } else if (days === '8+') {
      sql += ' AND days >= 8';
    }
  }

  if (destination && destination !== 'all') {
    sql += ' AND destination = ?';
    params.push(destination);
  }

  if (maxPrice) {
    sql += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
  }

  sql += ' ORDER BY departure_date ASC';

  const tours = db.prepare(sql).all(...params);

  // Get all destinations for filter
  const destinations = db.prepare(
    'SELECT DISTINCT destination FROM tours WHERE active = 1 ORDER BY destination'
  ).all().map(d => d.destination);

  // Get price range
  const priceRange = db.prepare(
    'SELECT MIN(price) as min, MAX(price) as max FROM tours WHERE active = 1'
  ).get();

  res.render('pages/tours', {
    title: 'Wycieczki - Magnolia Club',
    layout: 'layout/main',
    tours,
    destinations,
    priceRange: priceRange || { min: 0, max: 1000 },
    filters: { transport, days, destination, maxPrice }
  });
});

// Tour detail
router.get('/:slug', (req, res) => {
  const tour = db.prepare('SELECT * FROM tours WHERE slug = ? AND active = 1').get(req.params.slug);

  if (!tour) {
    return res.status(404).render('pages/error', {
      title: 'Wycieczka nie znaleziona',
      layout: 'layout/main',
      statusCode: 404,
      message: 'Przepraszamy, ta wycieczka nie istnieje lub jest nieaktywna.'
    });
  }

  // Parse gallery images
  tour.galleryImages = JSON.parse(tour.gallery_images || '[]');

  // Related tours (same destination, exclude current)
  const relatedTours = db.prepare(
    'SELECT * FROM tours WHERE destination = ? AND id != ? AND active = 1 LIMIT 3'
  ).all(tour.destination, tour.id);

  // Active tours for inquiry form dropdown
  const activeTours = db.prepare('SELECT id, title FROM tours WHERE active = 1 ORDER BY title').all();

  res.render('pages/tour-detail', {
    title: `${tour.title} - Magnolia Club`,
    layout: 'layout/main',
    tour,
    relatedTours,
    activeTours
  });
});

module.exports = router;
