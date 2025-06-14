#!/bin/bash

DOMAIN="api.jasonkeung.com"

# Update & install dependencies
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx ufw

# Allow HTTP and HTTPS through the firewall
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create NGINX config
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

# HTTPS server with WebSocket support
server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Everything else (REST API)
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Obtain SSL certificate
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m you@email.com

echo "NGINX with HTTPS + WebSocket is live at https://$DOMAIN"
