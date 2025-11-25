# 🚀 Quick Start: Deploy firstbrowser.ai in 10 Minutes

## The Fastest Way: Railway

### Step 1: Prepare Your Code (2 minutes)

```bash
# Navigate to your project
cd /Users/armaansinghkooner/Downloads/firstbrowser-aiv2-master

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit for firstbrowser.ai"

# Create a GitHub repository and push
# (Or use Railway's GitHub integration)
```

### Step 2: Deploy on Railway (5 minutes)

1. **Go to Railway**: https://railway.app
2. **Sign in** with GitHub
3. **New Project** → "Deploy from GitHub repo"
4. **Select your repository** (or create one)
5. **Add PostgreSQL**: Click "New" → "Database" → "PostgreSQL"
6. **Add Environment Variables**:
   - Click on your web service
   - Go to "Variables" tab
   - Click "Add Variable" for each:
   
   ```
   NODE_ENV=production
   OPENAI_API_KEY=your-openai-api-key-here
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   LLM_PROVIDER=openai
   PROMPTS_PER_TOPIC=20
   CLAUDE_MODEL=claude-3-5-sonnet-latest
   ```
   
   Note: `DATABASE_URL` is automatically set by Railway when you add PostgreSQL

7. **Deploy**: Railway automatically builds and deploys

### Step 3: Setup Database (2 minutes)

In Railway:
1. Click on PostgreSQL service
2. Click "Connect"
3. Copy the "Postgres Connection URL"

On your local machine:
```bash
# Set the database URL and push schema
DATABASE_URL="<paste-connection-url-here>" npm run db:push
```

### Step 4: Configure Domain (1 minute)

In Railway:
1. Go to your web service
2. Click "Settings" → "Domains"
3. Click "Custom Domain"
4. Enter: `firstbrowser.ai`
5. Railway will give you a CNAME target

### Step 5: Update DNS (done at your domain registrar)

Go to wherever you bought firstbrowser.ai (GoDaddy, Namecheap, etc.):

**For root domain (@):**
- **If using Cloudflare** (recommended):
  ```
  Type: CNAME
  Name: @
  Target: <yourapp>.railway.app
  Proxy: ON (orange cloud)
  ```

- **If NOT using Cloudflare**:
  ```
  Type: A
  Name: @
  Target: <get IP from Railway>
  ```

**For www subdomain:**
```
Type: CNAME
Name: www
Target: <yourapp>.railway.app
```

**Wait**: 5-60 minutes for DNS propagation

---

## Alternative: Render (Free Tier Available)

### Quick Steps:

1. **Go to Render**: https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Configure**:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Add environment variables (same as above)
4. **New PostgreSQL** → Create database
5. **Link database**: Copy Internal Database URL to `DATABASE_URL`
6. **Deploy**: Automatic
7. **Add domain**: Settings → Custom Domain → firstbrowser.ai

---

## Test Your Deployment

Once deployed:

1. Visit: `https://firstbrowser.ai`
2. You should see the clean search page
3. Search for a company (e.g., "Pender & Howe")
4. Click "Run Analysis Now"
5. Wait 5-10 minutes
6. View results!

---

## Troubleshooting

### Build fails?
- Check Node version is 20+
- Verify all dependencies are in package.json
- Check Railway logs for specific error

### Database connection fails?
- Verify DATABASE_URL is set
- Check PostgreSQL is running
- Ensure schema was pushed: `npm run db:push`

### Puppeteer crashes?
- Verify Dockerfile is being used (contains Chrome deps)
- Check memory limits (increase if needed)

### API keys not working?
- Double-check environment variables
- No extra spaces or quotes
- Verify keys are valid on OpenAI/Anthropic dashboards

---

## Cost Breakdown

**Railway**:
- PostgreSQL: $5/month (512MB)
- Web Service: $5-10/month (512MB RAM)
- **Total**: ~$10-15/month

**Plus AI API Costs**:
- OpenAI: ~$0.50-2 per analysis run
- Estimate: $10-50/month depending on usage

**Domain**: $10-15/year (you already have this!)

**Total Monthly Cost**: $20-65/month

---

## Production Checklist

- [ ] Site loads at firstbrowser.ai
- [ ] SSL certificate shows (https works)
- [ ] Search page loads properly
- [ ] Can run an analysis successfully
- [ ] Database persists data
- [ ] API keys work
- [ ] Competitor analysis shows data
- [ ] Mobile-responsive
- [ ] Add Google Analytics (optional)
- [ ] Setup uptime monitoring (UptimeRobot)

---

## Next: Scale & Optimize

Once running:

1. **Add Authentication**: User accounts, login system
2. **Caching**: Cache AI responses to reduce costs
3. **Rate Limiting**: Prevent abuse
4. **Scheduled Jobs**: Run analysis automatically
5. **Email Notifications**: Alert users when analysis completes
6. **Export Features**: PDF reports, CSV downloads
7. **Multi-Engine Support**: Add Gemini, Claude integration
8. **Real GEO Data**: Integrate Google Business Profile API

---

## Need Help?

Common resources:
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Database Issues: Check connection string format
- Domain Issues: Use DNS propagation checker (whatsmydns.net)

You're ready to launch! 🎉

