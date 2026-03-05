const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');

// Multer config for tour images
const tourStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'tours')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  }
});

// Multer config for blog images
const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'blog')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  }
});

// Multer config for documents
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'documents')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  }
});

const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Dozwolone formaty: JPG, PNG, WebP'), false);
  }
};

const pdfFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Dozwolony format: PDF'), false);
  }
};

const uploadTourCover = multer({ storage: tourStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('cover_image');
const uploadTourGallery = multer({ storage: tourStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }).array('gallery_images', 10);
const uploadBlogCover = multer({ storage: blogStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('cover_image');
const uploadDocument = multer({ storage: docStorage, fileFilter: pdfFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single('file');

// CSRF check for multipart forms (after multer parses body)
function checkCsrf(req) {
  const token = req.body._csrf || req.headers['x-csrf-token'];
  return token && token === req.session.csrfToken;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ==================== AUTH ====================

router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', {
    title: 'Logowanie - Admin',
    layout: 'layout/admin',
    error: null
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.render('admin/login', {
      title: 'Logowanie - Admin',
      layout: 'layout/admin',
      error: 'Nieprawidłowa nazwa użytkownika lub hasło.'
    });
  }

  req.session.adminId = user.id;
  req.session.adminUsername = user.username;
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ==================== DASHBOARD ====================

router.get('/', requireAuth, (req, res) => {
  const stats = {
    totalTours: db.prepare('SELECT COUNT(*) as c FROM tours').get().c,
    activeTours: db.prepare('SELECT COUNT(*) as c FROM tours WHERE active = 1').get().c,
    totalContacts: db.prepare('SELECT COUNT(*) as c FROM contacts').get().c,
    unreadContacts: db.prepare('SELECT COUNT(*) as c FROM contacts WHERE read = 0').get().c
  };

  const recentContacts = db.prepare(
    'SELECT contacts.*, tours.title as tour_title FROM contacts LEFT JOIN tours ON contacts.tour_id = tours.id ORDER BY contacts.created_at DESC LIMIT 10'
  ).all();

  res.render('admin/dashboard', {
    title: 'Panel administracyjny',
    layout: 'layout/admin',
    stats,
    recentContacts,
    adminUsername: req.session.adminUsername
  });
});

// ==================== TOURS ====================

router.get('/tours', requireAuth, (req, res) => {
  const tours = db.prepare('SELECT * FROM tours ORDER BY created_at DESC').all();
  res.render('admin/tours-list', {
    title: 'Zarządzanie wycieczkami',
    layout: 'layout/admin',
    tours,
    adminUsername: req.session.adminUsername
  });
});

router.get('/tours/add', requireAuth, (req, res) => {
  res.render('admin/tour-form', {
    title: 'Dodaj wycieczkę',
    layout: 'layout/admin',
    tour: null,
    error: null,
    adminUsername: req.session.adminUsername
  });
});

router.post('/tours/add', requireAuth, (req, res) => {
  uploadTourCover(req, res, (err) => {
    if (err) {
      return res.render('admin/tour-form', {
        title: 'Dodaj wycieczkę',
        layout: 'layout/admin',
        tour: req.body,
        error: err.message,
        adminUsername: req.session.adminUsername
      });
    }

    if (!checkCsrf(req)) {
      return res.status(403).render('admin/tour-form', {
        title: 'Dodaj wycieczkę', layout: 'layout/admin', tour: req.body,
        error: 'Token bezpieczeństwa wygasł. Spróbuj ponownie.', adminUsername: req.session.adminUsername
      });
    }

    const data = req.body;
    let slug = slugify(data.title);

    // Ensure unique slug
    const existing = db.prepare('SELECT id FROM tours WHERE slug = ?').get(slug);
    if (existing) slug += '-' + Date.now();

    const coverImage = req.file ? req.file.filename : null;

    db.prepare(`
      INSERT INTO tours (title, slug, description, highlights, destination, destination_country, departure_city, transport, days, price, departure_date, return_date, max_participants, available_spots, cover_image, includes, excludes, notes, featured, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.title, slug, data.description, data.highlights || null,
      data.destination, data.destination_country || null, data.departure_city || null,
      data.transport, parseInt(data.days) || 1,
      parseFloat(data.price) || 0, data.departure_date || null, data.return_date || null,
      parseInt(data.max_participants) || 18, parseInt(data.available_spots) || 18,
      coverImage, data.includes, data.excludes || null,
      data.notes || null, data.featured ? 1 : 0, data.active ? 1 : 0
    );

    res.redirect('/admin/tours');
  });
});

router.get('/tours/edit/:id', requireAuth, (req, res) => {
  const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(req.params.id);
  if (!tour) return res.redirect('/admin/tours');

  res.render('admin/tour-form', {
    title: 'Edytuj wycieczkę',
    layout: 'layout/admin',
    tour,
    error: null,
    adminUsername: req.session.adminUsername
  });
});

router.post('/tours/edit/:id', requireAuth, (req, res) => {
  uploadTourCover(req, res, (err) => {
    if (err) {
      const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(req.params.id);
      return res.render('admin/tour-form', {
        title: 'Edytuj wycieczkę',
        layout: 'layout/admin',
        tour: { ...tour, ...req.body },
        error: err.message,
        adminUsername: req.session.adminUsername
      });
    }

    if (!checkCsrf(req)) {
      return res.status(403).render('admin/tour-form', {
        title: 'Edytuj wycieczkę', layout: 'layout/admin', tour: req.body,
        error: 'Token bezpieczeństwa wygasł. Spróbuj ponownie.', adminUsername: req.session.adminUsername
      });
    }

    const data = req.body;
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM tours WHERE id = ?').get(id);
    if (!existing) return res.redirect('/admin/tours');

    const coverImage = req.file ? req.file.filename : existing.cover_image;

    // Delete old cover if new one uploaded
    if (req.file && existing.cover_image) {
      const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'tours', existing.cover_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    db.prepare(`
      UPDATE tours SET title=?, description=?, highlights=?, destination=?, destination_country=?, departure_city=?, transport=?, days=?, price=?, departure_date=?, return_date=?, max_participants=?, available_spots=?, cover_image=?, includes=?, excludes=?, notes=?, featured=?, active=?
      WHERE id=?
    `).run(
      data.title, data.description, data.highlights || null,
      data.destination, data.destination_country || null, data.departure_city || null,
      data.transport, parseInt(data.days) || 1,
      parseFloat(data.price) || 0, data.departure_date || null, data.return_date || null,
      parseInt(data.max_participants) || 18, parseInt(data.available_spots) || 18,
      coverImage, data.includes, data.excludes || null,
      data.notes || null, data.featured ? 1 : 0, data.active ? 1 : 0, id
    );

    res.redirect('/admin/tours');
  });
});

// Gallery upload
router.post('/tours/gallery/:id', requireAuth, (req, res) => {
  uploadTourGallery(req, res, (err) => {
    if (err) return res.redirect('/admin/tours/edit/' + req.params.id);
    if (!checkCsrf(req)) return res.redirect('/admin/tours/edit/' + req.params.id);

    const tour = db.prepare('SELECT gallery_images FROM tours WHERE id = ?').get(req.params.id);
    if (!tour) return res.redirect('/admin/tours');

    const currentImages = JSON.parse(tour.gallery_images || '[]');
    const newImages = req.files ? req.files.map(f => f.filename) : [];
    const allImages = [...currentImages, ...newImages].slice(0, 10);

    db.prepare('UPDATE tours SET gallery_images = ? WHERE id = ?').run(JSON.stringify(allImages), req.params.id);
    res.redirect('/admin/tours/edit/' + req.params.id);
  });
});

// Delete gallery image
router.post('/tours/gallery-delete/:id', requireAuth, (req, res) => {
  const { image } = req.body;
  const tour = db.prepare('SELECT gallery_images FROM tours WHERE id = ?').get(req.params.id);
  if (!tour) return res.redirect('/admin/tours');

  const images = JSON.parse(tour.gallery_images || '[]').filter(i => i !== image);
  db.prepare('UPDATE tours SET gallery_images = ? WHERE id = ?').run(JSON.stringify(images), req.params.id);

  // Delete file
  const filePath = path.join(__dirname, '..', 'public', 'uploads', 'tours', image);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  res.redirect('/admin/tours/edit/' + req.params.id);
});

router.post('/tours/delete/:id', requireAuth, (req, res) => {
  const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(req.params.id);
  if (tour) {
    // Delete cover image
    if (tour.cover_image) {
      const coverPath = path.join(__dirname, '..', 'public', 'uploads', 'tours', tour.cover_image);
      if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    }
    // Delete gallery images
    const gallery = JSON.parse(tour.gallery_images || '[]');
    for (const img of gallery) {
      const imgPath = path.join(__dirname, '..', 'public', 'uploads', 'tours', img);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    db.prepare('DELETE FROM tours WHERE id = ?').run(req.params.id);
  }
  res.redirect('/admin/tours');
});

router.post('/tours/toggle/:id', requireAuth, (req, res) => {
  db.prepare('UPDATE tours SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(req.params.id);
  res.redirect('/admin/tours');
});

// ==================== BLOG ====================

router.get('/blog', requireAuth, (req, res) => {
  const posts = db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
  res.render('admin/blog-list', {
    title: 'Zarządzanie blogiem',
    layout: 'layout/admin',
    posts,
    adminUsername: req.session.adminUsername
  });
});

router.get('/blog/add', requireAuth, (req, res) => {
  res.render('admin/blog-form', {
    title: 'Dodaj wpis',
    layout: 'layout/admin',
    post: null,
    error: null,
    adminUsername: req.session.adminUsername
  });
});

router.post('/blog/add', requireAuth, (req, res) => {
  uploadBlogCover(req, res, (err) => {
    if (err) {
      return res.render('admin/blog-form', {
        title: 'Dodaj wpis',
        layout: 'layout/admin',
        post: req.body,
        error: err.message,
        adminUsername: req.session.adminUsername
      });
    }

    if (!checkCsrf(req)) {
      return res.status(403).render('admin/blog-form', {
        title: 'Dodaj wpis', layout: 'layout/admin', post: req.body,
        error: 'Token bezpieczeństwa wygasł. Spróbuj ponownie.', adminUsername: req.session.adminUsername
      });
    }

    const data = req.body;
    let slug = slugify(data.title);

    const existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(slug);
    if (existing) slug += '-' + Date.now();

    const coverImage = req.file ? req.file.filename : null;

    db.prepare(`
      INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, author, category, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.title, slug, data.excerpt, data.content, coverImage, data.author || 'Łukasz', data.category, data.published ? 1 : 0);

    res.redirect('/admin/blog');
  });
});

router.get('/blog/edit/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.redirect('/admin/blog');

  res.render('admin/blog-form', {
    title: 'Edytuj wpis',
    layout: 'layout/admin',
    post,
    error: null,
    adminUsername: req.session.adminUsername
  });
});

router.post('/blog/edit/:id', requireAuth, (req, res) => {
  uploadBlogCover(req, res, (err) => {
    if (err) {
      const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
      return res.render('admin/blog-form', {
        title: 'Edytuj wpis',
        layout: 'layout/admin',
        post: { ...post, ...req.body },
        error: err.message,
        adminUsername: req.session.adminUsername
      });
    }

    if (!checkCsrf(req)) {
      return res.status(403).render('admin/blog-form', {
        title: 'Edytuj wpis', layout: 'layout/admin', post: req.body,
        error: 'Token bezpieczeństwa wygasł. Spróbuj ponownie.', adminUsername: req.session.adminUsername
      });
    }

    const data = req.body;
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id);
    if (!existing) return res.redirect('/admin/blog');

    const coverImage = req.file ? req.file.filename : existing.cover_image;

    if (req.file && existing.cover_image) {
      const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'blog', existing.cover_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    db.prepare(`
      UPDATE blog_posts SET title=?, excerpt=?, content=?, cover_image=?, author=?, category=?, published=?
      WHERE id=?
    `).run(data.title, data.excerpt, data.content, coverImage, data.author || 'Łukasz', data.category, data.published ? 1 : 0, id);

    res.redirect('/admin/blog');
  });
});

router.post('/blog/delete/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  if (post && post.cover_image) {
    const imgPath = path.join(__dirname, '..', 'public', 'uploads', 'blog', post.cover_image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  res.redirect('/admin/blog');
});

router.post('/blog/toggle/:id', requireAuth, (req, res) => {
  db.prepare('UPDATE blog_posts SET published = CASE WHEN published = 1 THEN 0 ELSE 1 END WHERE id = ?').run(req.params.id);
  res.redirect('/admin/blog');
});

// ==================== DOCUMENTS ====================

router.get('/documents', requireAuth, (req, res) => {
  const documents = db.prepare('SELECT * FROM documents ORDER BY category, title').all();
  res.render('admin/documents', {
    title: 'Zarządzanie dokumentami',
    layout: 'layout/admin',
    documents,
    error: null,
    adminUsername: req.session.adminUsername
  });
});

router.post('/documents/add', requireAuth, (req, res) => {
  uploadDocument(req, res, (err) => {
    if (err) {
      const documents = db.prepare('SELECT * FROM documents ORDER BY category, title').all();
      return res.render('admin/documents', {
        title: 'Zarządzanie dokumentami',
        layout: 'layout/admin',
        documents,
        error: err.message,
        adminUsername: req.session.adminUsername
      });
    }

    if (!checkCsrf(req)) {
      return res.redirect('/admin/documents');
    }

    if (!req.file) {
      const documents = db.prepare('SELECT * FROM documents ORDER BY category, title').all();
      return res.render('admin/documents', {
        title: 'Zarządzanie dokumentami',
        layout: 'layout/admin',
        documents,
        error: 'Proszę wybrać plik PDF.',
        adminUsername: req.session.adminUsername
      });
    }

    const data = req.body;
    db.prepare('INSERT INTO documents (title, description, filename, category) VALUES (?, ?, ?, ?)').run(
      data.title, data.description, req.file.filename, data.category
    );

    res.redirect('/admin/documents');
  });
});

router.post('/documents/delete/:id', requireAuth, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (doc) {
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'documents', doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  }
  res.redirect('/admin/documents');
});

// ==================== CONTACTS ====================

router.get('/contacts', requireAuth, (req, res) => {
  const contacts = db.prepare(
    'SELECT contacts.*, tours.title as tour_title FROM contacts LEFT JOIN tours ON contacts.tour_id = tours.id ORDER BY contacts.created_at DESC'
  ).all();

  res.render('admin/contacts', {
    title: 'Zapytania',
    layout: 'layout/admin',
    contacts,
    adminUsername: req.session.adminUsername
  });
});

router.post('/contacts/read/:id', requireAuth, (req, res) => {
  db.prepare('UPDATE contacts SET read = 1 WHERE id = ?').run(req.params.id);
  res.redirect('/admin/contacts');
});

router.post('/contacts/delete/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.redirect('/admin/contacts');
});

module.exports = router;
