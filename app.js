require('dotenv').config();
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ==================== SECURITY ====================

// Trust proxy (required behind Nginx)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Helmet — security HTTP headers (XSS, clickjacking, sniffing protection)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  strictTransportSecurity: false // Disable HSTS until HTTPS/SSL is configured
}));

// Hide X-Powered-By header
app.disable('x-powered-by');

// Rate limiting — general (100 requests per 15 min per IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Zbyt wiele zapytań. Spróbuj ponownie za kilka minut.'
});
app.use(generalLimiter);

// Rate limiting — login (5 attempts per 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.'
});
app.use('/admin/login', loginLimiter);

// Rate limiting — contact form (10 per hour)
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Zbyt wiele wiadomości. Spróbuj ponownie za godzinę.'
});
app.use('/kontakt', contactLimiter);

// ==================== VIEW ENGINE ====================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout/main');

// ==================== BODY PARSING ====================

app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

// ==================== STATIC FILES ====================

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProduction ? '7d' : 0,
  etag: true
}));

// ==================== SESSION ====================

app.use(session({
  secret: process.env.SESSION_SECRET || 'magnolia-club-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax'
  }
}));

// ==================== CSRF PROTECTION ====================

app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  res.locals.currentPath = req.path;
  res.locals.isAdmin = !!req.session.adminId;
  next();
});

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

// ==================== ROUTES ====================

app.use('/', require('./routes/index'));
app.use('/wycieczki', require('./routes/tours'));
app.use('/blog', require('./routes/blog'));
app.use('/kontakt', require('./routes/contact'));
app.use('/admin', require('./routes/admin'));

// ==================== ERROR HANDLING ====================

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

// ==================== START ====================

app.listen(PORT, () => {
  console.log(`Magnolia Club running on http://localhost:${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
});
