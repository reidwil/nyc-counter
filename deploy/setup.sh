#!/bin/bash

# QR Counter VPS Setup Script
# Run this on your fresh Ubuntu/Debian VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 QR Counter VPS Setup Starting...${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx
echo -e "${YELLOW}📦 Installing nginx...${NC}"
sudo apt install -y nginx

# Install certbot for SSL
echo -e "${YELLOW}📦 Installing certbot for SSL certificates...${NC}"
sudo apt install -y certbot python3-certbot-nginx

# Install PM2 for process management
echo -e "${YELLOW}📦 Installing PM2...${NC}"
sudo npm install -g pm2

# Create user for the app
echo -e "${YELLOW}👤 Creating qruser...${NC}"
sudo useradd -m -s /bin/bash qruser || echo "User already exists"

# Setup firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo -e "${GREEN}✅ Base setup complete!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Upload your app files to /home/qruser/qr-madness"
echo "2. Run: sudo -u qruser bash -c 'cd /home/qruser/qr-madness && npm install'"
echo "3. Configure nginx with your domain"
echo "4. Get SSL certificate with certbot"
echo "5. Start the app with PM2"

echo -e "${GREEN}🎉 Ready for your QR Counter app!${NC}" 