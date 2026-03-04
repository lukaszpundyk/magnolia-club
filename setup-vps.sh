#!/bin/bash
# ============================================================
# Magnolia Club — Skrypt instalacyjny VPS
# Uruchom jako root na świeżym Ubuntu 22.04/24.04
# ============================================================

set -e

echo ""
echo "=========================================="
echo "  MAGNOLIA CLUB — Instalacja VPS"
echo "=========================================="
echo ""

# ---------- KONFIGURACJA ----------
# Zmień poniższe wartości na swoje!

read -p "Podaj swoją domenę (np. magnoliaclub.com.pl) lub zostaw puste dla IP: " DOMAIN
read -p "Podaj hasło do panelu admin: " ADMIN_PASS
read -p "Podaj adres email (do SSL i powiadomień): " EMAIL

# Generuj losowy secret
SESSION_SECRET=$(openssl rand -hex 32)

echo ""
echo ">>> [1/8] Aktualizacja systemu..."
apt update && apt upgrade -y

echo ""
echo ">>> [2/8] Instalacja narzędzi (git, build-essential, python3)..."
apt install -y build-essential python3 git curl ufw fail2ban

echo ""
echo ">>> [3/8] Instalacja Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

echo ""
echo ">>> [4/8] Instalacja PM2 i Nginx..."
npm install -g pm2
apt install -y nginx

echo ""
echo ">>> [5/8] Konfiguracja firewalla (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
echo "y" | ufw enable
echo "Firewall włączony — dozwolone: SSH, HTTP, HTTPS"

echo ""
echo ">>> [5b/8] Konfiguracja Fail2Ban (blokada ataków brute-force)..."
cat > /etc/fail2ban/jail.local << 'JAIL'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
JAIL

systemctl enable fail2ban
systemctl restart fail2ban
echo "Fail2Ban aktywny — blokuje ataki na SSH i Nginx"

echo ""
echo ">>> [6/8] Pobieranie aplikacji z GitHuba..."
mkdir -p /var/www
cd /var/www

if [ -d "magnolia-club" ]; then
  cd magnolia-club
  git pull
else
  git clone https://github.com/lukaszpundyk/magnolia-club.git
  cd magnolia-club
fi

echo "Instalacja zależności Node.js..."
npm install --production

echo ""
echo ">>> [6b/8] Tworzenie folderów na uploads..."
mkdir -p public/uploads/tours
mkdir -p public/uploads/blog
mkdir -p public/uploads/documents

echo ""
echo ">>> [6c/8] Tworzenie pliku konfiguracyjnego .env..."
cat > /var/www/magnolia-club/.env << ENVFILE
PORT=3000
NODE_ENV=production

SESSION_SECRET=${SESSION_SECRET}

ADMIN_USER=admin
ADMIN_PASS=${ADMIN_PASS}

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=biuro@magnoliaclub.com.pl
CONTACT_EMAIL=biuro@magnoliaclub.com.pl
ENVFILE

chmod 600 /var/www/magnolia-club/.env
echo "Plik .env utworzony (uprawnienia: tylko root)"

echo ""
echo ">>> [7/8] Konfiguracja Nginx..."

# Ustaw server_name
if [ -z "$DOMAIN" ]; then
  SERVER_NAME="_"
  DOMAIN_DISPLAY="IP serwera"
else
  SERVER_NAME="$DOMAIN www.$DOMAIN"
  DOMAIN_DISPLAY="$DOMAIN"
fi

cat > /etc/nginx/sites-available/magnolia-club << NGINXCONF
# Security: rate limiting
limit_req_zone \$binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;

server {
    listen 80;
    server_name ${SERVER_NAME};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Max upload size (images)
    client_max_body_size 10M;

    # Block common attack paths
    location ~ /\. {
        deny all;
        return 404;
    }

    location ~* /(\.env|\.git|database|node_modules) {
        deny all;
        return 404;
    }

    # Rate limit login page
    location /admin/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files — cached, served by Nginx (fast)
    location /uploads/ {
        alias /var/www/magnolia-club/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /css/ {
        alias /var/www/magnolia-club/public/css/;
        expires 30d;
        access_log off;
    }

    location /js/ {
        alias /var/www/magnolia-club/public/js/;
        expires 30d;
        access_log off;
    }

    location /images/ {
        alias /var/www/magnolia-club/public/images/;
        expires 30d;
        access_log off;
    }

    location /fonts/ {
        alias /var/www/magnolia-club/public/fonts/;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Everything else — proxy to Node.js
    location / {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXCONF

# Aktywuj konfigurację
ln -sf /etc/nginx/sites-available/magnolia-club /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Sprawdź konfigurację
nginx -t
systemctl restart nginx

echo "Nginx skonfigurowany dla: ${DOMAIN_DISPLAY}"

echo ""
echo ">>> [8/8] Uruchamianie aplikacji przez PM2..."
cd /var/www/magnolia-club
pm2 delete magnolia-club 2>/dev/null || true
pm2 start app.js --name magnolia-club --env production
pm2 save
pm2 startup systemd -u root --hp /root 2>&1 | tail -1 | bash 2>/dev/null || true

echo ""
echo "=========================================="
echo "  INSTALACJA ZAKOŃCZONA!"
echo "=========================================="
echo ""
echo "  Strona działa pod: http://${DOMAIN_DISPLAY}"
echo "  Panel admina:      http://${DOMAIN_DISPLAY}/admin"
echo "  Login:             admin"
echo "  Hasło:             ${ADMIN_PASS}"
echo ""

# SSL jeśli podano domenę
if [ -n "$DOMAIN" ]; then
  echo ""
  read -p "Czy chcesz zainstalować darmowy certyfikat SSL (https)? [t/n]: " INSTALL_SSL
  if [ "$INSTALL_SSL" = "t" ] || [ "$INSTALL_SSL" = "T" ]; then
    apt install -y certbot python3-certbot-nginx
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"
    echo ""
    echo "SSL zainstalowany! Strona działa pod: https://${DOMAIN}"
  fi
fi

echo ""
echo "=========================================="
echo "  ZABEZPIECZENIA AKTYWNE:"
echo "=========================================="
echo "  [✓] Firewall (UFW) — tylko SSH + HTTP/HTTPS"
echo "  [✓] Fail2Ban — blokada ataków brute-force"
echo "  [✓] Helmet — nagłówki bezpieczeństwa HTTP"
echo "  [✓] Rate limiting — ochrona przed DDoS"
echo "  [✓] CSRF — ochrona formularzy"
echo "  [✓] Secure cookies — bezpieczne sesje"
echo "  [✓] Nginx — ukryty dostęp do .env, .git, database"
echo "  [✓] SSL/HTTPS — szyfrowanie (jeśli włączone)"
echo ""
echo "  Przydatne komendy:"
echo "  pm2 logs magnolia-club  — logi aplikacji"
echo "  pm2 restart magnolia-club — restart"
echo "  pm2 status              — status"
echo ""
echo "  Aktualizacja strony:"
echo "  cd /var/www/magnolia-club && git pull && npm install && pm2 restart magnolia-club"
echo ""
