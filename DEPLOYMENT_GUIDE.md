# Bike Workshop Management Portal - Hostinger VPS Deployment Guide

This guide covers complete end-to-end deployment of your **Bike Workshop Management Portal** on **Hostinger VPS** with a **Custom Domain**, **Nginx Reverse Proxy**, **PM2 Process Manager**, and **Let's Encrypt Free SSL (HTTPS)**.

---

## 1. Prerequisites
- **Hostinger VPS** (Ubuntu 22.04 or 24.04 LTS recommended)
- **Domain Name** pointed to your Hostinger VPS Public IP via DNS A Records:
  - `workshop.yourdomain.com` or `yourdomain.com` -> `YOUR_VPS_IP`
- **MongoDB Atlas Cluster** (Free or Dedicated tier)

---

## 2. Server Initial Setup & Dependencies

Connect to your Hostinger VPS via SSH:
```bash
ssh root@YOUR_VPS_IP
```

Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

Install Node.js (LTS v20+ or v22+):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx
```

Verify installations:
```bash
node -v
npm -v
nginx -v
```

Install PM2 globally to keep the Node backend running 24/7:
```bash
sudo npm install -g pm2
```

---

## 3. Clone or Upload Code to VPS

Navigate to the web root:
```bash
mkdir -p /var/www/workshop
cd /var/www/workshop
```

Upload your code from your machine using Git or SCP:
```bash
# Example via Git:
git clone <YOUR_GIT_REPO_URL> .
```

---

## 4. Backend Configuration & Setup

Navigate to the `backend` folder:
```bash
cd /var/www/workshop/backend
npm install --production
```

Create production `.env`:
```bash
nano .env
```

Add your production environment variables:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/bike_workshop?retryWrites=true&w=majority
JWT_SECRET=super_secure_production_secret_key_change_me_998811
JWT_EXPIRE=30d
CLIENT_URL=https://workshop.yourdomain.com
```
*(Save and exit with `Ctrl + O`, `Enter`, `Ctrl + X`)*

### Seed Initial Admin Data (Optional)
If you want to populate your live MongoDB Atlas with sample data and the admin user:
```bash
npm run seed
```

### Start Backend with PM2:
```bash
pm2 start src/server.js --name "bike-workshop-api"
pm2 save
pm2 startup
```
*(Follow the command PM2 prints to enable auto-restart on server reboot)*

Check backend status:
```bash
pm2 status
pm2 logs bike-workshop-api
```

---

## 5. Frontend Production Build

Navigate to the `frontend` folder:
```bash
cd /var/www/workshop/frontend
npm install
```

Create production `.env.production`:
```bash
nano .env.production
```
Add:
```env
VITE_API_URL=https://workshop.yourdomain.com/api
```

Build the static production assets:
```bash
npm run build
```
This generates the optimized production build inside `/var/www/workshop/frontend/dist`.

---

## 6. Nginx Web Server Configuration

Create an Nginx server block for your domain:
```bash
sudo nano /etc/nginx/sites-available/workshop
```

Paste the following configuration (replace `workshop.yourdomain.com` with your real domain):
```nginx
server {
    listen 80;
    server_name workshop.yourdomain.com;

    # Frontend Static Files
    root /var/www/workshop/frontend/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Handle React Router Browser History
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js Backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/workshop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Secure with Free SSL Certificate (HTTPS)

Install Certbot for Nginx:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain and configure the SSL certificate automatically:
```bash
sudo certbot --nginx -d workshop.yourdomain.com
```

Select the option to automatically redirect all HTTP traffic to HTTPS.
Certbot configures automatic renewal via systemd timer. You can test it:
```bash
sudo certbot renew --dry-run
```

---

## 8. Firewall & Security

Enable UFW firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 9. Verification & Maintenance

- Open `https://workshop.yourdomain.com` in your web browser.
- Login with the Admin credentials:
  - **Email:** `admin@bikeworkshop.com`
  - **Password:** `admin123` *(or your custom configured credentials)*
- Monitor logs:
  - API Logs: `pm2 logs bike-workshop-api`
  - Nginx Access: `sudo tail -f /var/log/nginx/access.log`
  - Nginx Errors: `sudo tail -f /var/log/nginx/error.log`
