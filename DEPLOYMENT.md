# 🚀 QR Counter - Self-Hosting Guide

Deploy your QR Counter on your own domain with complete control!

## 📋 Prerequisites

- **Domain name** (from Namecheap, GoDaddy, Cloudflare, etc.)
- **VPS** (DigitalOcean, Linode, Vultr, AWS EC2)
- **SSH access** to your server
- **Basic Linux knowledge**

## 🎯 Deployment Options

### Option 1: Fresh VPS Setup (Recommended)
### Option 2: Existing Server
### Option 3: Cloud Provider with Custom Domain

---

## 🔥 Option 1: Fresh VPS Setup

### Step 1: Get a VPS
**Recommended providers:**
- **DigitalOcean**: $4-6/month ([Get $200 credit](https://digitalocean.com))
- **Linode**: $5/month 
- **Vultr**: $2.50/month
- **AWS EC2**: Free tier available

**Minimum specs:** 1GB RAM, 1 CPU, 25GB storage

### Step 2: Point Your Domain
In your domain registrar (Namecheap, etc.):
```
A Record: @ → your-vps-ip-address
A Record: www → your-vps-ip-address
```

### Step 3: Initial Server Setup
```bash
# SSH into your server
ssh root@your-vps-ip

# Run the setup script
curl -sSL https://raw.githubusercontent.com/yourusername/qr-madness/main/deploy/setup.sh | bash
```

### Step 4: Upload Your App
```bash
# Option A: Using git (recommended)
sudo -u qruser git clone https://github.com/yourusername/qr-madness.git /home/qruser/qr-madness

# Option B: Upload via SCP
scp -r qr-madness/ qruser@your-vps-ip:/home/qruser/
```

### Step 5: Deploy
```bash
# Edit the deployment script with your domain
sudo nano /home/qruser/qr-madness/deploy/deploy.sh
# Change "nyc-qr-counter.com" to your actual domain

# Run deployment
cd /home/qruser/qr-madness
sudo ./deploy/deploy.sh
```

### Step 6: Set Environment Variable (Optional)
```bash
# For custom domain override
echo "CUSTOM_DOMAIN=nyc-qr-counter.com" | sudo tee -a /etc/environment
sudo systemctl restart nginx
```

---

## ⚡ Option 2: Existing Server

If you already have a server:

```bash
# Install requirements
sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# Upload your app
git clone https://github.com/yourusername/qr-madness.git
cd qr-madness
npm install --production

# Configure nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/nyc-qr-counter
sudo sed -i 's/nyc-qr-counter.com/YOUR_DOMAIN/g' /etc/nginx/sites-available/nyc-qr-counter
sudo ln -s /etc/nginx/sites-available/nyc-qr-counter /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d nyc-qr-counter.com -d www.nyc-qr-counter.com

# Start the app
NODE_ENV=production CUSTOM_DOMAIN=nyc-qr-counter.com pm2 start server/app.js --name nyc-qr-counter
pm2 save
pm2 startup
```

---

## 🌐 Option 3: Cloud + Custom Domain

### Railway with Custom Domain
```bash
# Deploy to Railway
railway login
railway link
railway up

# Add custom domain in Railway dashboard
# Point your domain's CNAME to railway.app
```

### Vercel with Custom Domain
```bash
# Deploy to Vercel
vercel --prod

# Add domain in Vercel dashboard
# Configure DNS as instructed
```

---

## 🔧 Production Configuration

### Environment Variables
```bash
# Set these on your server
export NODE_ENV=production
export CUSTOM_DOMAIN=nyc-qr-counter.com
export PORT=3000
```

### Monitoring with PM2
```bash
# Check status
pm2 status

# View logs
pm2 logs nyc-qr-counter

# Restart app
pm2 restart nyc-qr-counter

# Auto-restart on server reboot
pm2 startup
pm2 save
```

### Nginx Configuration
The included nginx config provides:
- ✅ **SSL/HTTPS** with Let's Encrypt
- ✅ **HTTP to HTTPS redirect**
- ✅ **Security headers**
- ✅ **Gzip compression**
- ✅ **Reverse proxy** to Node.js

### SSL Certificate Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Auto-renewal is set up by default
```

---

## 🚨 Troubleshooting

### App Won't Start
```bash
# Check logs
pm2 logs nyc-qr-counter

# Check if port is in use
sudo netstat -tulpn | grep :3000

# Restart nginx
sudo systemctl restart nginx
```

### Domain Not Working
```bash
# Check DNS propagation
nslookup nyc-qr-counter.com

# Verify nginx config
sudo nginx -t

# Check SSL certificate
sudo certbot certificates
```

### Counter Not Persisting
```bash
# Check file permissions
ls -la /home/qruser/qr-madness/server/data/

# Fix permissions if needed
sudo chown -R qruser:qruser /home/qruser/qr-madness/server/data/
```

---

## 📊 Monitoring & Maintenance

### Health Check
```bash
curl https://nyc-qr-counter.com/health
```

### Backup Counter Data
```bash
# Create backup
sudo cp /home/qruser/qr-madness/server/data/counter.json /home/qruser/backup-$(date +%Y%m%d).json

# Automated backup (add to crontab)
0 2 * * * cp /home/qruser/qr-madness/server/data/counter.json /home/qruser/backup-$(date +\%Y\%m\%d).json
```

### Updates
```bash
# Pull latest code
cd /home/qruser/qr-madness
git pull origin main

# Restart app
pm2 restart nyc-qr-counter
```

---

## 🎉 Success!

Your QR Counter should now be live at:
- **QR Code Page**: `https://nyc-qr-counter.com/qr`
- **Counter Page**: `https://nyc-qr-counter.com`
- **API**: `https://nyc-qr-counter.com/api/counter`

## 🔥 Next Steps

1. **Share your QR codes** globally
2. **Monitor usage** with PM2 logs
3. **Add analytics** (Google Analytics, etc.)
4. **Scale up** if needed
5. **Add features** (location tracking, multiple counters)

---

## 💡 Pro Tips

- **Use Cloudflare** for additional DDoS protection and caching
- **Set up monitoring** with Uptime Robot or similar
- **Regular backups** of your counter data
- **Consider a CDN** for global performance
- **Monitor server resources** with htop/btop

**Your QR Counter is now production-ready! 🚀** 