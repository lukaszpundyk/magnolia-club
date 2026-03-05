const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Tours listing
router.get('/', (req, res) => {
  const { transport, days, country, departure_city, maxPrice } = req.query;

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

  if (country && country !== 'all') {
    sql += ' AND destination_country LIKE ?';
    params.push('%' + country + '%');
  }

  if (departure_city && departure_city !== 'all') {
    sql += ' AND departure_city = ?';
    params.push(departure_city);
  }

  if (maxPrice) {
    sql += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
  }

  sql += ' ORDER BY departure_date ASC';

  const tours = db.prepare(sql).all(...params);

  // Get all countries for filter (parse comma-separated values)
  const countryRows = db.prepare(
    'SELECT destination_country FROM tours WHERE active = 1 AND destination_country IS NOT NULL'
  ).all();
  const countriesSet = new Set();
  countryRows.forEach(row => {
    row.destination_country.split(',').forEach(c => {
      const trimmed = c.trim();
      if (trimmed) countriesSet.add(trimmed);
    });
  });
  const countries = [...countriesSet].sort();

  // Get all departure cities for filter
  const departureCities = db.prepare(
    'SELECT DISTINCT departure_city FROM tours WHERE active = 1 AND departure_city IS NOT NULL ORDER BY departure_city'
  ).all().map(d => d.departure_city);

  // Get price range
  const priceRange = db.prepare(
    'SELECT MIN(price) as min, MAX(price) as max FROM tours WHERE active = 1'
  ).get();

  res.render('pages/tours', {
    title: 'Wycieczki - Magnolia Club',
    layout: 'layout/main',
    tours,
    countries,
    departureCities,
    priceRange: priceRange || { min: 0, max: 1000 },
    filters: { transport, days, country, departure_city, maxPrice }
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

  // Backward compatibility: use highlights, fall back to short_description
  if (!tour.highlights && tour.short_description) {
    tour.highlights = tour.short_description;
  }
  // Backward compatibility: if itinerary exists separately, append to description
  if (tour.itinerary && tour.description) {
    tour.description = tour.description + '\n\n' + tour.itinerary;
  } else if (tour.itinerary && !tour.description) {
    tour.description = tour.itinerary;
  }

  // Parse gallery images
  tour.galleryImages = JSON.parse(tour.gallery_images || '[]');

  // Related tours (same country, exclude current)
  const relatedTours = db.prepare(
    'SELECT * FROM tours WHERE destination_country = ? AND id != ? AND active = 1 LIMIT 3'
  ).all(tour.destination_country, tour.id);

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
