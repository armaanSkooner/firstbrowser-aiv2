# Deployment Guide for firstbrowser.ai

## 🚀 Quick Start Options

Choose your preferred hosting platform:

### Option 1: **Railway** (Recommended - Easiest)
### Option 2: **Render**
### Option 3: **DigitalOcean App Platform**
### Option 4: **AWS/Heroku/Custom VPS**

---

## 🎯 Option 1: Railway (Recommended)

**Cost**: ~$20-30/month
**Setup Time**: 10 minutes
**Best for**: Fast deployment, managed PostgreSQL

### Steps:

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your repository

3. **Add PostgreSQL Database**
   - In your project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will create a database and set `DATABASE_URL`

4. **Configure Environment Variables**
   - Go to your service → "Variables"
   - Add these variables:
     ```
     NODE_ENV=production
     OPENAI_API_KEY=your-openai-api-key-here
     ANTHROPIC_API_KEY=your-anthropic-api-key-here
     LLM_PROVIDER=openai
     PROMPTS_PER_TOPIC=20
     ANALYSIS_FREQUENCY=daily
     ```
   - `DATABASE_URL` is automatically set by Railway

5. **Push Database Schema**
   - In Railway, go to PostgreSQL database → "Connect"
   - Copy connection string
   - Run locally: `DATABASE_URL="<connection-string>" npm run db:push`

6. **Deploy**
   - Railway automatically deploys on git push
   - Get your app URL: `yourapp.railway.app`

7. **Configure Custom Domain**
   - In Railway project → "Settings" → "Domains"
   - Click "Generate Domain" (free railway subdomain)
   - For custom domain (firstbrowser.ai):
     - Click "Custom Domain"
     - Enter `firstbrowser.ai`
     - Add DNS records in your domain registrar:
       ```
       Type: CNAME
       Name: @
       Value: yourapp.railway.app
       ```
     - Wait for DNS propagation (5-60 minutes)

---

## 🎯 Option 2: Render

**Cost**: Free tier available, ~$7/month for web service
**Setup Time**: 15 minutes
**Best for**: Cost-effective, simple deployment

### Steps:

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Dashboard → "New" → "PostgreSQL"
   - Name: `firstbrowser-db`
   - Region: Choose closest to your users
   - Plan: Starter ($7/month) or Free (expires in 90 days)
   - Click "Create Database"

3. **Create Web Service**
   - Dashboard → "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: firstbrowser-ai
     - **Region**: Same as database
     - **Branch**: main
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Starter ($7/month) or Free

4. **Add Environment Variables**
   - In Web Service → "Environment"
   - Add all variables from step 4 of Railway guide
   - For `DATABASE_URL`: 
     - Go to PostgreSQL service
     - Copy "Internal Database URL"
     - Paste in web service environment variables

5. **Deploy**
   - Click "Create Web Service"
   - Render builds and deploys automatically

6. **Push Database Schema**
   ```bash
   DATABASE_URL="<internal-db-url>" npm run db:push
   ```

7. **Configure Custom Domain**
   - In Web Service → "Settings" → "Custom Domain"
   - Add `firstbrowser.ai`
   - Update DNS at your registrar:
     ```
     Type: CNAME
     Name: @
     Value: yourapp.onrender.com
     ```

---

## 🎯 Option 3: DigitalOcean App Platform

**Cost**: $12-24/month
**Setup Time**: 15 minutes
**Best for**: Reliability, more control

### Steps:

1. **Create DigitalOcean Account**
   - Go to https://digitalocean.com
   - Sign up (get $200 credit with promo codes)

2. **Create App**
   - Apps → "Create App"
   - Connect GitHub repository
   - Select repository and branch

3. **Configure Build**
   - Detected as Node.js app automatically
   - Build Command: `npm run build`
   - Run Command: `npm start`

4. **Add PostgreSQL Database**
   - In app creation flow, add "Database"
   - Select PostgreSQL
   - Choose plan ($7/month for Dev Database)

5. **Set Environment Variables**
   - Add all environment variables from Railway guide
   - `DATABASE_URL` is automatically provided

6. **Deploy**
   - Review and create app
   - DigitalOcean builds and deploys

7. **Run Database Migration**
   - Go to app console or use `doctl` CLI
   - Run: `npm run db:push`

8. **Add Custom Domain**
   - Settings → Domains
   - Add `firstbrowser.ai`
   - Update DNS:
     ```
     Type: CNAME
     Name: @
     Value: <your-app>.ondigitalocean.app
     ```

---

## 🎯 Option 4: Manual Deployment (VPS)

**Cost**: $5-20/month (DigitalOcean Droplet, AWS EC2, etc.)
**Setup Time**: 30-60 minutes
**Best for**: Full control, custom configuration

### Steps:

1. **Create a VPS**
   - DigitalOcean: Create Droplet (Ubuntu 22.04, $12/month)
   - AWS: Launch EC2 instance (t3.small)
   - Linode/Vultr: Similar process

2. **SSH into Server**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   apt update && apt upgrade -y
   
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs
   
   # Install PostgreSQL
   apt install -y postgresql postgresql-contrib
   
   # Install PM2 (process manager)
   npm install -g pm2
   
   # Install Nginx (reverse proxy)
   apt install -y nginx certbot python3-certbot-nginx
   ```

4. **Setup PostgreSQL**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE firstbrowser;
   CREATE USER fbuser WITH PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE firstbrowser TO fbuser;
   \q
   ```

5. **Clone and Build App**
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/firstbrowser-aiv2.git
   cd firstbrowser-aiv2
   npm install
   npm run build
   ```

6. **Create .env File**
   ```bash
   nano .env
   ```
   Add all environment variables, then save (Ctrl+X, Y, Enter)

7. **Push Database Schema**
   ```bash
   npm run db:push
   ```

8. **Start with PM2**
   ```bash
   pm2 start npm --name "firstbrowser" -- start
   pm2 save
   pm2 startup
   ```

9. **Configure Nginx**
   ```bash
   nano /etc/nginx/sites-available/firstbrowser.ai
   ```
   
   Add this configuration:
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
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Enable site:
   ```bash
   ln -s /etc/nginx/sites-available/firstbrowser.ai /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

10. **Setup SSL with Let's Encrypt**
    ```bash
    certbot --nginx -d firstbrowser.ai -d www.firstbrowser.ai
    ```

11. **Configure DNS**
    - At your domain registrar (e.g., Namecheap, GoDaddy):
    ```
    Type: A
    Name: @
    Value: your-server-ip
    
    Type: A
    Name: www
    Value: your-server-ip
    ```

---

## 🔧 Post-Deployment Checklist

- [ ] Test the application at https://firstbrowser.ai
- [ ] Run a sample analysis to verify AI APIs work
- [ ] Check database connectivity
- [ ] Verify Puppeteer/scraping works
- [ ] Test all pages (search, results, competitors, etc.)
- [ ] Setup monitoring (UptimeRobot, Sentry)
- [ ] Configure backup for PostgreSQL
- [ ] Setup error logging
- [ ] Test on mobile devices
- [ ] Check SSL certificate validity

---

## 🐛 Common Issues & Solutions

### Issue: Puppeteer crashes
**Solution**: Ensure Dockerfile includes Chrome dependencies, or use Railway/Render's Puppeteer buildpack

### Issue: Database connection fails
**Solution**: Check `DATABASE_URL` format, ensure PostgreSQL is running, verify firewall rules

### Issue: Build fails
**Solution**: Clear node_modules, ensure all dependencies in package.json, check Node version (20+)

### Issue: API keys not working
**Solution**: Verify environment variables are set correctly, no extra spaces, keys are valid

### Issue: Domain not resolving
**Solution**: Wait for DNS propagation (up to 48 hours), verify DNS records, check CNAME vs A records

---

## 📊 Monitoring & Maintenance

### Recommended Tools:
- **UptimeRobot**: Monitor uptime (free)
- **Sentry**: Error tracking
- **LogTail**: Log aggregation
- **Datadog/New Relic**: Performance monitoring

### Regular Maintenance:
- Update dependencies monthly: `npm update`
- Backup database weekly
- Monitor API usage/costs (OpenAI, Anthropic)
- Review logs for errors
- Scale resources as needed

---

## 💰 Cost Estimates

| Platform | Starter | Production |
|----------|---------|------------|
| Railway | $20/mo | $50-100/mo |
| Render | $14/mo | $30-60/mo |
| DigitalOcean | $19/mo | $40-80/mo |
| VPS (Manual) | $12/mo | $25-50/mo |

**Plus**: OpenAI API costs ($0.002-0.03 per analysis run)

---

## 🚦 Next Steps

1. **Choose a platform** (Railway recommended for speed)
2. **Follow the guide** for your chosen platform
3. **Test thoroughly** before announcing
4. **Setup analytics** (Google Analytics, Plausible)
5. **Add authentication** if needed (user accounts)
6. **Monitor costs** (especially AI API usage)

---

## 📞 Need Help?

If you run into issues:
1. Check platform documentation (Railway, Render, DO)
2. Review application logs
3. Test locally first with production build: `npm run build && npm start`
4. Verify all environment variables are set

Good luck with your launch! 🚀

