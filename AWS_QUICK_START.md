# AWS Quick Start for firstbrowser.ai

## 🎯 Fastest AWS Deployment: Lightsail (15 minutes)

**Best for**: Launch & small-medium traffic
**Cost**: ~$35/month (all-inclusive)

### Prerequisites
- AWS Account
- Domain: firstbrowser.ai (you have this ✓)
- Local terminal access

---

## Step-by-Step Guide

### 1. Create Lightsail Instance (5 minutes)

1. **Go to AWS Lightsail**: https://lightsail.aws.amazon.com
2. **Click "Create instance"**
3. **Configure**:
   - Instance location: US East (N. Virginia) - or closest to your users
   - Platform: Linux/Unix
   - Blueprint: **Node.js** (not OS only)
   - Plan: **$20/month** (2 GB RAM, 60 GB SSD) - Recommended for Puppeteer
   - Instance name: `firstbrowser-ai`
4. **Click "Create instance"**

### 2. Create Lightsail Database (3 minutes)

1. **In Lightsail**, click "Databases" → "Create database"
2. **Configure**:
   - Location: Same as instance
   - Database engine: PostgreSQL
   - Plan: **$15/month** (1 GB RAM, 40 GB SSD)
   - Master username: `fbadmin`
   - Master password: Create strong password (save it!)
   - Database name: `firstbrowser`
   - Identify your database: `firstbrowser-db`
3. **Click "Create database"**

### 3. Configure Networking (2 minutes)

**Instance Firewall:**
1. Go to your instance → "Networking" tab
2. Firewall should already have:
   - SSH (22)
   - HTTP (80)
   - HTTPS (443)

**Database Connection:**
1. Go to database → "Connectivity & security"
2. Click "Enable public mode" (temporary - we'll connect from instance)
3. Note the endpoint: `firstbrowser-db.xxxxx.us-east-1.rds.amazonaws.com`

### 4. Get Static IP (1 minute)

1. In Lightsail → "Networking" → "Create static IP"
2. Attach to: `firstbrowser-ai` instance
3. Name: `firstbrowser-ip`
4. **Save this IP** - you'll use it for DNS

### 5. SSH into Instance (2 minutes)

**Option A: Browser SSH (easiest)**
1. Go to instance → Click "Connect using SSH"

**Option B: Local Terminal**
1. Download SSH key from Lightsail
2. ```bash
   chmod 400 LightsailDefaultKey-us-east-1.pem
   ssh -i LightsailDefaultKey-us-east-1.pem bitnami@<static-ip>
   ```

### 6. Setup Application (5 minutes)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Clone your repository (replace with your GitHub URL)
cd /opt/bitnami
sudo git clone https://github.com/yourusername/firstbrowser-aiv2.git app
sudo chown -R bitnami:bitnami app
cd app

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Create .env file
nano .env
```

**Add to .env**:
```env
NODE_ENV=production
DATABASE_URL=postgresql://fbadmin:<your-password>@firstbrowser-db.xxxxx.us-east-1.rds.amazonaws.com:5432/firstbrowser
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
LLM_PROVIDER=openai
PROMPTS_PER_TOPIC=20
PORT=3000
```

Save: Ctrl+X, Y, Enter

```bash
# Push database schema
npm run db:push

# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start npm --name "firstbrowser" -- start

# Save PM2 config
pm2 save

# Start PM2 on boot
pm2 startup
# Copy and run the command it outputs

# Configure Nginx
sudo nano /opt/bitnami/nginx/conf/server_certs/server.conf
```

**Replace contents with**:
```nginx
server {
    listen 80;
    server_name firstbrowser.ai www.firstbrowser.ai;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Restart Nginx
sudo /opt/bitnami/ctlscript.sh restart nginx

# Test application
curl http://localhost:3000
```

### 7. Configure Domain (2 minutes)

**At your domain registrar** (GoDaddy, Namecheap, etc.):

```
Type: A
Name: @
Value: <your-lightsail-static-ip>
TTL: 600

Type: A
Name: www
Value: <your-lightsail-static-ip>
TTL: 600
```

**Wait**: 5-60 minutes for DNS propagation

### 8. Setup SSL (3 minutes)

```bash
# SSH back into instance if disconnected
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d firstbrowser.ai -d www.firstbrowser.ai

# Follow prompts:
# - Email: your email
# - Agree to terms: Yes
# - Redirect HTTP to HTTPS: Yes (option 2)
```

**Done!** Your site is now live at https://firstbrowser.ai

---

## ✅ Verification Checklist

- [ ] Visit https://firstbrowser.ai (should load search page)
- [ ] Search for a company
- [ ] Click "Run Analysis Now"
- [ ] Wait 5-10 minutes
- [ ] Results appear
- [ ] SSL certificate shows (green padlock)
- [ ] Works on mobile

---

## 💰 Total Cost Breakdown

| Service | Cost |
|---------|------|
| Lightsail Instance (2GB) | $20/month |
| Lightsail Database (1GB) | $15/month |
| Static IP | Free |
| Data Transfer | Included (up to 3TB) |
| **Total AWS** | **$35/month** |
| OpenAI API (estimated) | $10-50/month |
| **Grand Total** | **$45-85/month** |

---

## 🔧 Maintenance

### View Logs
```bash
pm2 logs firstbrowser
```

### Restart Application
```bash
pm2 restart firstbrowser
```

### Update Application
```bash
cd /opt/bitnami/app
git pull
npm install
npm run build
pm2 restart firstbrowser
```

### Check Database Connection
```bash
psql "postgresql://fbadmin:<password>@firstbrowser-db.xxxxx.us-east-1.rds.amazonaws.com:5432/firstbrowser"
```

### Monitor Resources
In Lightsail dashboard:
- Click instance → "Metrics" tab
- View CPU, Network, etc.

---

## 🚨 Troubleshooting

### Issue: Site not loading
```bash
# Check if app is running
pm2 status

# Check app logs
pm2 logs firstbrowser

# Check Nginx
sudo /opt/bitnami/ctlscript.sh status nginx

# Restart everything
pm2 restart firstbrowser
sudo /opt/bitnami/ctlscript.sh restart nginx
```

### Issue: Database connection fails
```bash
# Test connection
psql "postgresql://fbadmin:<password>@<endpoint>:5432/firstbrowser"

# Check if database is in "Public mode"
# Go to Lightsail → Database → Connectivity
```

### Issue: Puppeteer crashes
```bash
# Install Chromium dependencies
sudo apt install -y \
  chromium-browser \
  chromium-codecs-ffmpeg-extra \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libxss1

# Restart app
pm2 restart firstbrowser
```

### Issue: Out of memory
Upgrade Lightsail instance:
1. Go to instance
2. Click "Manage" → "Change instance plan"
3. Select $40/month (4GB RAM)

---

## 📊 Monitoring & Scaling

### Setup Monitoring (Optional)

**CloudWatch Integration:**
1. Lightsail → Metrics → "Create alarm"
2. Metric: CPU utilization
3. Threshold: > 80% for 5 minutes
4. Notification: Your email

**UptimeRobot** (Free external monitoring):
1. Sign up: https://uptimerobot.com
2. Add monitor: https://firstbrowser.ai
3. Check interval: 5 minutes
4. Get alerted if site goes down

### When to Scale Up

**Signs you need more resources:**
- CPU consistently > 80%
- Memory usage > 80%
- Slow response times
- Frequent Puppeteer crashes

**Upgrade path:**
1. **$40/month** (4 GB RAM) - 2x current
2. **$80/month** (8 GB RAM) - 4x current
3. **Migrate to EC2/ECS** - For serious scale

---

## 🎯 Next Steps After Launch

1. **Monitor for 48 hours** - Watch logs, metrics
2. **Test thoroughly** - Different browsers, devices
3. **Setup backups** - Enable automatic database snapshots
4. **Add analytics** - Google Analytics, Plausible
5. **Optimize costs** - Monitor API usage
6. **Plan for scale** - When to upgrade/migrate

---

## 🆘 Need Help?

- **AWS Lightsail Docs**: https://lightsail.aws.amazon.com/docs
- **Check instance logs**: `pm2 logs`
- **Database logs**: Lightsail → Database → Logs
- **Nginx logs**: `/opt/bitnami/nginx/logs/error.log`

Good luck with your launch! 🚀

