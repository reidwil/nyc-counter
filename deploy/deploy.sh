#!/bin/bash

# QR Counter Deployment Script
# Run this to deploy/update your app

set -e

# Configuration
DOMAIN="yourdomain.com"  # Change this to your domain
APP_DIR="/home/qruser/qr-madness"
NGINX_CONFIG="/etc/nginx/sites-available/qr-counter"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying QR Counter...${NC}"

# Stop the app
echo -e "${YELLOW}⏹️  Stopping current app...${NC}"
sudo -u qruser pm2 stop qr-counter || echo "App not running"

# Update code (if using git)
echo -e "${YELLOW}📥 Updating code...${NC}"
if [ -d "$APP_DIR/.git" ]; then
    sudo -u qruser bash -c "cd $APP_DIR && git pull origin main"
else
    echo "Not a git repository - manual upload required"
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
sudo -u qruser bash -c "cd $APP_DIR && npm install --production"

# Setup nginx if not exists
if [ ! -f "$NGINX_CONFIG" ]; then
    echo -e "${YELLOW}⚙️  Setting up nginx...${NC}"
    sudo cp $APP_DIR/deploy/nginx.conf $NGINX_CONFIG
    sudo sed -i "s/yourdomain.com/$DOMAIN/g" $NGINX_CONFIG
    sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
fi

# Get SSL certificate if not exists
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${YELLOW}🔒 Getting SSL certificate...${NC}"
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

# Start the app with PM2
echo -e "${YELLOW}▶️  Starting app...${NC}"
sudo -u qruser bash -c "cd $APP_DIR && pm2 start server/app.js --name qr-counter"
sudo -u qruser pm2 save
sudo -u qruser pm2 startup | tail -1 | sudo bash || echo "PM2 startup already configured"

# Test the deployment
echo -e "${YELLOW}🧪 Testing deployment...${NC}"
sleep 5
if curl -f -s https://$DOMAIN/health > /dev/null; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Your QR Counter is live at: https://$DOMAIN${NC}"
    echo -e "${GREEN}📱 QR Code page: https://$DOMAIN/qr${NC}"
else
    echo -e "${RED}❌ Deployment test failed${NC}"
    echo "Check logs with: sudo -u qruser pm2 logs qr-counter"
fi 