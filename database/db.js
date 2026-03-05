const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'magnolia.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    destination TEXT,
    destination_country TEXT,
    departure_city TEXT,
    transport TEXT CHECK(transport IN ('bus', 'train', 'plane', 'own')) DEFAULT 'bus',
    days INTEGER DEFAULT 1,
    price REAL DEFAULT 0,
    departure_date TEXT,
    return_date TEXT,
    max_participants INTEGER DEFAULT 18,
    available_spots INTEGER DEFAULT 18,
    cover_image TEXT,
    gallery_images TEXT DEFAULT '[]',
    itinerary TEXT,
    includes TEXT,
    excludes TEXT,
    featured INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT,
    cover_image TEXT,
    author TEXT DEFAULT 'Łukasz',
    category TEXT,
    published INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    category TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    tour_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    read INTEGER DEFAULT 0,
    FOREIGN KEY (tour_id) REFERENCES tours(id)
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );
`);

// Migrations - add new columns to existing tables
try {
  db.exec(`ALTER TABLE tours ADD COLUMN destination_country TEXT`);
} catch (e) { /* column already exists */ }

try {
  db.exec(`ALTER TABLE tours ADD COLUMN departure_city TEXT`);
} catch (e) { /* column already exists */ }

// Create default admin user if none exists
const adminCount = db.prepare('SELECT COUNT(*) as c FROM admin_users').get().c;
if (adminCount === 0) {
  const bcrypt = require('bcrypt');
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASS || 'magnolia2025';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log(`Admin user "${username}" created.`);
}

module.exports = db;
