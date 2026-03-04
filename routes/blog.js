const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { marked } = require('marked');

// Blog listing
router.get('/', (req, res) => {
  const { category, page } = req.query;
  const perPage = 6;
  const currentPage = parseInt(page) || 1;
  const offset = (currentPage - 1) * perPage;

  let countSql = 'SELECT COUNT(*) as total FROM blog_posts WHERE published = 1';
  let sql = 'SELECT * FROM blog_posts WHERE published = 1';
  const params = [];

  if (category && category !== 'all') {
    countSql += ' AND category = ?';
    sql += ' AND category = ?';
    params.push(category);
  }

  const total = db.prepare(countSql).get(...params).total;
  const totalPages = Math.ceil(total / perPage);

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const posts = db.prepare(sql).all(...params, perPage, offset);

  // Get all categories
  const categories = db.prepare(
    'SELECT DISTINCT category FROM blog_posts WHERE published = 1 ORDER BY category'
  ).all().map(c => c.category);

  res.render('pages/blog', {
    title: 'Blog - Magnolia Club',
    layout: 'layout/main',
    posts,
    categories,
    currentCategory: category || 'all',
    currentPage,
    totalPages
  });
});

// Blog post detail
router.get('/:slug', (req, res) => {
  const post = db.prepare('SELECT * FROM blog_posts WHERE slug = ? AND published = 1').get(req.params.slug);

  if (!post) {
    return res.status(404).render('pages/error', {
      title: 'Artykuł nie znaleziony',
      layout: 'layout/main',
      statusCode: 404,
      message: 'Przepraszamy, ten artykuł nie istnieje.'
    });
  }

  // Render markdown content
  post.htmlContent = marked(post.content || '');

  // Related posts
  const relatedPosts = db.prepare(
    'SELECT * FROM blog_posts WHERE category = ? AND id != ? AND published = 1 ORDER BY created_at DESC LIMIT 3'
  ).all(post.category, post.id);

  res.render('pages/blog-post', {
    title: `${post.title} - Magnolia Club`,
    layout: 'layout/main',
    post,
    relatedPosts
  });
});

module.exports = router;
