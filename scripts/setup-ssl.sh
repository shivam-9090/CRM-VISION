#!/bin/bash

# ============================================================
# SSL Certificate Setup Script for Let's Encrypt
# ============================================================
# 
# This script sets up SSL certificates using Let's Encrypt
# for the CRM-VISION application.
#
# Usage:
#   ./setup-ssl.sh your-domain.com admin@your-domain.com
#
# Prerequisites:
#   - Docker and docker-compose installed
#   - Domain DNS configured to point to server
#   - Ports 80 and 443 accessible
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ "$#" -ne 2 ]; then
    echo -e "${RED}Usage: $0 <domain> <email>${NC}"
    echo "Example: $0 crm.example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}SSL Certificate Setup${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "Domain: ${YELLOW}${DOMAIN}${NC}"
echo -e "Email: ${YELLOW}${EMAIL}${NC}"
echo ""

# Validate domain format
if [[ ! $DOMAIN =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
    echo -e "${RED}Error: Invalid domain format${NC}"
    exit 1
fi

# Validate email format
if [[ ! $EMAIL =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${RED}Error: Invalid email format${NC}"
    exit 1
fi

# Check if running as root (required for certbot)
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Warning: This script requires root privileges${NC}"
    echo -e "${YELLOW}Re-running with sudo...${NC}"
    sudo "$0" "$@"
    exit $?
fi

# Create directories
echo -e "${GREEN}Creating directories...${NC}"
mkdir -p /etc/letsencrypt
mkdir -p /var/www/certbot
mkdir -p /var/log/letsencrypt

# Check if certificates already exist
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo -e "${YELLOW}Certificates already exist for $DOMAIN${NC}"
    read -p "Do you want to renew them? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Skipping certificate generation${NC}"
        exit 0
    fi
fi

# Test nginx configuration
echo -e "${GREEN}Testing nginx configuration...${NC}"
docker-compose -f docker-compose.prod.yml config > /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Invalid docker-compose configuration${NC}"
    exit 1
fi

# Start nginx temporarily for ACME challenge
echo -e "${GREEN}Starting nginx for ACME challenge...${NC}"
docker-compose -f docker-compose.prod.yml up -d nginx

# Wait for nginx to be ready
echo -e "${YELLOW}Waiting for nginx to start...${NC}"
sleep 5

# Request certificate
echo -e "${GREEN}Requesting SSL certificate from Let's Encrypt...${NC}"
docker run --rm \
    -v /etc/letsencrypt:/etc/letsencrypt \
    -v /var/www/certbot:/var/www/certbot \
    -v /var/log/letsencrypt:/var/log/letsencrypt \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate obtained successfully!${NC}"
else
    echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Ensure DNS is configured correctly:"
    echo "   dig $DOMAIN +short"
    echo "2. Check port 80 is accessible:"
    echo "   curl http://$DOMAIN/.well-known/acme-challenge/test"
    echo "3. Review logs:"
    echo "   cat /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi

# Update nginx configuration with actual domain
echo -e "${GREEN}Updating nginx configuration...${NC}"
sed -i "s/your-domain.com/$DOMAIN/g" infra/nginx/nginx.conf

# Reload nginx with new certificates
echo -e "${GREEN}Reloading nginx...${NC}"
docker-compose -f docker-compose.prod.yml restart nginx

# Verify SSL certificate
echo -e "${GREEN}Verifying SSL certificate...${NC}"
sleep 3
curl -sI https://$DOMAIN | grep "HTTP" || echo -e "${YELLOW}Warning: Could not verify HTTPS${NC}"

# Setup auto-renewal cron job
echo -e "${GREEN}Setting up auto-renewal cron job...${NC}"
CRON_CMD="0 3 */7 * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot certbot/certbot renew --quiet && docker-compose -f $(pwd)/docker-compose.prod.yml restart nginx"

(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | crontab -

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✅ SSL Setup Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "Domain: ${GREEN}https://${DOMAIN}${NC}"
echo -e "Certificate: ${GREEN}/etc/letsencrypt/live/${DOMAIN}/fullchain.pem${NC}"
echo -e "Private Key: ${GREEN}/etc/letsencrypt/live/${DOMAIN}/privkey.pem${NC}"
echo -e "Auto-renewal: ${GREEN}Every 7 days at 3 AM${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test your site: https://$DOMAIN"
echo "2. Check SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "3. Monitor certificate expiry: certbot certificates"
echo ""
