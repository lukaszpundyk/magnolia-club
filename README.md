# Magnolia Club — Strona internetowa biura podróży

Premium small-group travel agency website built with Node.js, Express, EJS and SQLite.

## Tech Stack

- **Backend:** Node.js + Express.js
- **Templating:** EJS (server-side rendering)
- **Database:** SQLite via better-sqlite3
- **Styling:** TailwindCSS (CDN) + custom CSS
- **Auth:** express-session + bcrypt
- **Uploads:** Multer
- **Email:** Nodemailer
- **Markdown:** Marked.js

## Local Development

### 1. Install dependencies

```bash
cd magnolia-club
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Seed demo data

```bash
npm run seed
```

This creates:
- Admin user (default: admin / magnolia2025)
- 4 sample tours
- 2 blog posts
- 2 sample documents

### 4. Start the server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Visit: http://localhost:3000

### Admin Panel

Visit: http://localhost:3000/admin

Default credentials:
- Username: `admin`
- Password: `magnolia2025`

## Project Structure

```
magnolia-club/
├── app.js                  # Express entry point
├── package.json
├── .env                    # Configuration
├── database/
│   ├── db.js               # SQLite connection + schema
│   └── seed.js             # Demo data seeder
├── routes/
│   ├── index.js            # Public pages (home, about, documents)
│   ├── tours.js            # Tours listing + detail
│   ├── blog.js             # Blog listing + detail
│   ├── contact.js          # Contact form
│   └── admin.js            # Admin panel (protected)
├── middleware/
│   └── auth.js             # Session auth middleware
├── views/
│   ├── layout/             # Main + admin layouts
│   ├── pages/              # Public page templates
│   └── admin/              # Admin panel templates
└── public/
    ├── css/custom.css       # Custom styles
    ├── js/                  # Client-side JS
    ├── images/              # Logo and static images
    └── uploads/             # User-uploaded files
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `SESSION_SECRET` | Express session secret | (random) |
| `ADMIN_USER` | Admin username (for seeding) | `admin` |
| `ADMIN_PASS` | Admin password (for seeding) | `magnolia2025` |
| `SMTP_HOST` | SMTP server host | — |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS | `false` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `SMTP_FROM` | Sender email address | — |
| `CONTACT_EMAIL` | Where to send contact form notifications | — |

## Deployment on Hostinger

### Shared Hosting (Node.js)

1. **Create Node.js app** in Hostinger panel:
   - Go to Website → Advanced → Node.js
   - Set Node.js version: 18+
   - Application root: your uploaded folder
   - Application startup file: `app.js`
   - Port: assigned by Hostinger (use their env variable)

2. **Upload files** via FTP/Git:
   - Upload all project files
   - Make sure `node_modules` is NOT uploaded (will be installed on server)

3. **Install dependencies** via SSH or Hostinger terminal:
   ```bash
   npm install --production
   ```

4. **Set environment variables** in Hostinger Node.js panel:
   - Add all variables from `.env.example`
   - Set `SESSION_SECRET` to a random string
   - Configure SMTP settings for email

5. **Seed the database**:
   ```bash
   npm run seed
   ```

6. **Start/Restart** the application from Hostinger panel.

### Important Notes

- SQLite database file (`database/magnolia.db`) is created automatically
- Upload directories (`public/uploads/*`) must be writable
- Change admin password after first login
- Set a strong `SESSION_SECRET` in production
