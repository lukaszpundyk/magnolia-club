require('dotenv').config();
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout/main');

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'magnolia-club-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true
  }
}));

// CSRF token middleware
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  res.locals.currentPath = req.path;
  res.locals.isAdmin = !!req.session.adminId;
  next();
});

// CSRF validation for POST requests
app.use((req, res, next) => {
  if (req.method === 'POST') {
    const token = req.body._csrf || req.headers['x-csrf-token'];
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).render('pages/error', {
        title: 'Błąd 403',
        layout: 'layout/main',
        statusCode: 403,
        message: 'Nieprawidłowy token bezpieczeństwa. Odśwież stronę i spróbuj ponownie.'
      });
    }
  }
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/wycieczki', require('./routes/tours'));
app.use('/blog', require('./routes/blog'));
app.use('/kontakt', require('./routes/contact'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: 'Strona nie znaleziona',
    layout: 'layout/main',
    statusCode: 404,
    message: 'Przepraszamy, strona której szukasz nie istnieje.'
  });
});

// 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', {
    title: 'Błąd serwera',
    layout: 'layout/main',
    statusCode: 500,
    message: 'Przepraszamy, wystąpił błąd serwera. Spróbuj ponownie później.'
  });
});

app.listen(PORT, () => {
  console.log(`Magnolia Club running on http://localhost:${PORT}`);
});
