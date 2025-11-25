# AWS Deployment Guide for firstbrowser.ai

## 🎯 AWS Deployment Options

### Option 1: **AWS Elastic Beanstalk** (Easiest - Recommended)
- **Cost**: ~$25-40/month
- **Time**: 20 minutes
- **Best for**: Managed deployment, auto-scaling, minimal DevOps

### Option 2: **AWS ECS Fargate** (Docker-based)
- **Cost**: ~$30-50/month
- **Time**: 30 minutes
- **Best for**: Container orchestration, better control

### Option 3: **AWS EC2 + RDS** (Manual)
- **Cost**: ~$20-35/month
- **Time**: 45 minutes
- **Best for**: Full control, custom configuration

### Option 4: **AWS Lightsail** (Simplest)
- **Cost**: ~$15-25/month
- **Time**: 15 minutes
- **Best for**: Small-scale, predictable pricing

---

## 🚀 Option 1: AWS Elastic Beanstalk (Recommended)

### Why Elastic Beanstalk?
- ✅ Automatic load balancing
- ✅ Auto-scaling
- ✅ Easy deployment (`eb deploy`)
- ✅ Managed updates
- ✅ Built-in monitoring

### Prerequisites
```bash
# Install EB CLI
pip install awsebcli

# Or with Homebrew (macOS)
brew install awsebcli

# Verify installation
eb --version
```

### Step 1: Prepare Application

Create `Procfile` in project root:
```bash
cd /Users/armaansinghkooner/Downloads/firstbrowser-aiv2-master
```

```bash
# Create Procfile
cat > Procfile << 'EOF'
web: npm start
EOF
```

Create `.ebextensions/nodecommand.config`:
```bash
mkdir -p .ebextensions
cat > .ebextensions/nodecommand.config << 'EOF'
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
EOF
```

### Step 2: Initialize Elastic Beanstalk

```bash
# Initialize EB
eb init

# Follow prompts:
# - Select region (us-east-1 recommended)
# - Application name: firstbrowser-ai
# - Platform: Node.js
# - Platform version: Node.js 20
# - Setup SSH: Yes (optional)
```

### Step 3: Create RDS Database

```bash
# Create environment with RDS
eb create firstbrowser-production \
  --database \
  --database.engine postgres \
  --database.instance db.t3.micro \
  --database.username fbadmin \
  --database.password <strong-password> \
  --envvars NODE_ENV=production

# This creates:
# - Elastic Beanstalk environment
# - PostgreSQL RDS instance
# - Security groups
# - Load balancer
```

### Step 4: Set Environment Variables

```bash
eb setenv \
  OPENAI_API_KEY="your-openai-api-key-here" \
  ANTHROPIC_API_KEY="your-anthropic-api-key-here" \
  LLM_PROVIDER="openai" \
  PROMPTS_PER_TOPIC="20" \
  CLAUDE_MODEL="claude-3-5-sonnet-latest"

# DATABASE_URL is automatically set by EB when you use --database
```

### Step 5: Deploy Application

```bash
# Build the app
npm run build

# Deploy to EB
eb deploy

# Monitor deployment
eb status

# View logs if issues
eb logs
```

### Step 6: Push Database Schema

```bash
# Get database connection URL
eb printenv | grep RDS

# Push schema
DATABASE_URL="postgresql://fbadmin:<password>@<rds-endpoint>:5432/ebdb" npm run db:push
```

### Step 7: Configure Custom Domain

**In AWS Console:**
1. Go to Elastic Beanstalk → Environments → firstbrowser-production
2. Copy the environment URL (e.g., `firstbrowser-production.us-east-1.elasticbeanstalk.com`)

**At your domain registrar:**
```
Type: CNAME
Name: @
Value: firstbrowser-production.us-east-1.elasticbeanstalk.com
```

**In AWS Route 53** (optional but recommended for better control):
1. Create hosted zone for `firstbrowser.ai`
2. Create A record pointing to EB environment
3. Update nameservers at your domain registrar

### Step 8: Setup SSL Certificate

```bash
# Request SSL certificate via AWS Certificate Manager (ACM)
# In AWS Console:
# 1. Go to Certificate Manager
# 2. Request public certificate
# 3. Add domain: firstbrowser.ai, *.firstbrowser.ai
# 4. DNS validation (recommended)
# 5. Add CNAME records to your DNS

# Configure EB to use SSL
eb config

# Add this under aws:elbv2:listener:443:
#   Protocol: HTTPS
#   SSLCertificateArns: <your-certificate-arn>
```

### Ongoing Deployment

```bash
# After making changes
git add .
git commit -m "Updates"
eb deploy

# Scale up/down
eb scale 2  # Run 2 instances

# View environment info
eb status

# Open app in browser
eb open
```

---

## 🐳 Option 2: AWS ECS Fargate (Docker)

### Why ECS Fargate?
- ✅ Serverless containers
- ✅ No EC2 management
- ✅ Better isolation
- ✅ Easier scaling

### Prerequisites
```bash
# Install AWS CLI
brew install awscli  # macOS
# or: pip install awscli

# Configure AWS credentials
aws configure
```

### Step 1: Create ECR Repository

```bash
# Create ECR repository for Docker images
aws ecr create-repository --repository-name firstbrowser-ai

# Get login command
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Build and Push Docker Image

```bash
cd /Users/armaansinghkooner/Downloads/firstbrowser-aiv2-master

# Build Docker image
docker build -t firstbrowser-ai .

# Tag for ECR
docker tag firstbrowser-ai:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/firstbrowser-ai:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/firstbrowser-ai:latest
```

### Step 3: Create RDS Database

**In AWS Console:**
1. Go to RDS → Create database
2. Choose PostgreSQL
3. Template: Free tier (or Production for more resources)
4. DB instance: db.t3.micro (free tier) or db.t3.small
5. Master username: `fbadmin`
6. Master password: `<strong-password>`
7. DB name: `firstbrowser`
8. Storage: 20 GB
9. Public access: No
10. Create database

**Note the endpoint**: `firstbrowser-db.xxxxx.us-east-1.rds.amazonaws.com`

### Step 4: Create ECS Cluster

**In AWS Console:**
1. Go to ECS → Clusters → Create cluster
2. Cluster name: `firstbrowser-cluster`
3. Infrastructure: AWS Fargate (serverless)
4. Create

### Step 5: Create Task Definition

**In AWS Console:**
1. ECS → Task Definitions → Create new task definition
2. Task definition family: `firstbrowser-task`
3. Launch type: Fargate
4. Task role: Create new role (or use existing)
5. Task execution role: Create new role
6. Task memory: 1 GB
7. Task CPU: 0.5 vCPU

**Container definition:**
- Container name: `firstbrowser-app`
- Image URI: `<account-id>.dkr.ecr.us-east-1.amazonaws.com/firstbrowser-ai:latest`
- Port mappings: 3000 TCP
- Environment variables:
  ```
  NODE_ENV=production
  DATABASE_URL=postgresql://fbadmin:<password>@<rds-endpoint>:5432/firstbrowser
  OPENAI_API_KEY=sk-proj-...
  ANTHROPIC_API_KEY=sk-ant-...
  LLM_PROVIDER=openai
  PROMPTS_PER_TOPIC=20
  ```

### Step 6: Create Application Load Balancer

**In AWS Console:**
1. EC2 → Load Balancers → Create Load Balancer
2. Application Load Balancer
3. Name: `firstbrowser-alb`
4. Scheme: Internet-facing
5. VPC: Default (or your VPC)
6. Subnets: Select at least 2 availability zones
7. Security groups: Create new (allow HTTP 80, HTTPS 443)
8. Target group: Create new
   - Target type: IP
   - Protocol: HTTP
   - Port: 3000
   - Health check path: `/api/test`
9. Create

### Step 7: Create ECS Service

**In AWS Console:**
1. ECS → Clusters → firstbrowser-cluster → Create service
2. Launch type: Fargate
3. Task Definition: firstbrowser-task
4. Service name: `firstbrowser-service`
5. Number of tasks: 1 (or 2 for HA)
6. Load balancing: Application Load Balancer
7. Load balancer: Select firstbrowser-alb
8. Target group: Select created target group
9. Create service

### Step 8: Push Database Schema

```bash
# From your local machine
DATABASE_URL="postgresql://fbadmin:<password>@<rds-endpoint>:5432/firstbrowser" npm run db:push
```

### Step 9: Configure Domain

1. Get ALB DNS name from EC2 → Load Balancers
2. Create CNAME at your domain registrar:
   ```
   Type: CNAME
   Name: @
   Value: firstbrowser-alb-xxxxx.us-east-1.elb.amazonaws.com
   ```

### Step 10: Setup SSL (Optional)

1. AWS Certificate Manager → Request certificate
2. Domain: `firstbrowser.ai`, `*.firstbrowser.ai`
3. DNS validation
4. Add ALB listener for HTTPS:443 with certificate
5. Redirect HTTP to HTTPS

### Redeploy After Changes

```bash
# Build new image
docker build -t firstbrowser-ai .

# Tag and push
docker tag firstbrowser-ai:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/firstbrowser-ai:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/firstbrowser-ai:latest

# Update ECS service (forces new deployment)
aws ecs update-service --cluster firstbrowser-cluster --service firstbrowser-service --force-new-deployment
```

---

## 💻 Option 3: AWS EC2 + RDS (Manual)

### Why EC2?
- ✅ Full control
- ✅ Most cost-effective
- ✅ Custom configuration
- ❌ More maintenance

### Step 1: Launch EC2 Instance

**In AWS Console:**
1. EC2 → Launch Instance
2. Name: `firstbrowser-server`
3. AMI: Ubuntu Server 22.04 LTS
4. Instance type: t3.small (2GB RAM, $15/month) or t3.micro (free tier, 1GB RAM)
5. Key pair: Create new (download .pem file)
6. Network settings:
   - Allow SSH (22) from My IP
   - Allow HTTP (80) from Anywhere
   - Allow HTTPS (443) from Anywhere
7. Storage: 20 GB gp3
8. Launch instance

### Step 2: Create RDS Database

Same as ECS Fargate step 3 above.

**Important**: Ensure RDS security group allows connections from EC2 security group on port 5432.

### Step 3: Connect to EC2

```bash
# SSH into server
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<ec2-public-ip>
```

### Step 4: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# Install PostgreSQL client (for db:push)
sudo apt install -y postgresql-client
```

### Step 5: Clone and Setup Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/firstbrowser-aiv2.git
sudo chown -R ubuntu:ubuntu firstbrowser-aiv2
cd firstbrowser-aiv2

# Install dependencies
npm ci --only=production

# Build application
npm run build
```

### Step 6: Configure Environment

```bash
# Create .env file
nano .env
```

Add:
```env
NODE_ENV=production
DATABASE_URL=postgresql://fbadmin:<password>@<rds-endpoint>:5432/firstbrowser
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
LLM_PROVIDER=openai
PROMPTS_PER_TOPIC=20
CLAUDE_MODEL=claude-3-5-sonnet-latest
PORT=3000
```

Save: Ctrl+X, Y, Enter

### Step 7: Push Database Schema

```bash
npm run db:push
```

### Step 8: Start Application with PM2

```bash
# Start app
pm2 start npm --name "firstbrowser" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs (sudo ...)
```

### Step 9: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/firstbrowser.ai
```

Add:
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
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/firstbrowser.ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 10: Setup SSL with Let's Encrypt

```bash
sudo certbot --nginx -d firstbrowser.ai -d www.firstbrowser.ai

# Follow prompts
# Choose: Redirect HTTP to HTTPS (option 2)
```

### Step 11: Configure DNS

**At your domain registrar:**
```
Type: A
Name: @
Value: <ec2-public-ip>

Type: A
Name: www
Value: <ec2-public-ip>
```

**Or use Elastic IP** (recommended to prevent IP changes):
1. EC2 → Elastic IPs → Allocate Elastic IP
2. Associate with your EC2 instance
3. Use Elastic IP in DNS records

---

## ☁️ Option 4: AWS Lightsail (Simplest)

### Why Lightsail?
- ✅ Fixed pricing ($5, $10, $20/month)
- ✅ Includes everything (compute, storage, transfer)
- ✅ Simpler than EC2
- ✅ Great for small-medium apps

### Steps:

1. **Go to AWS Lightsail**: https://lightsail.aws.amazon.com
2. **Create Instance**:
   - Platform: Linux/Unix
   - Blueprint: Node.js
   - Plan: $10/month (1GB RAM) or $20/month (2GB RAM)
   - Name: firstbrowser-ai
3. **Create Database**:
   - Database: PostgreSQL
   - Plan: $15/month (1GB RAM, 40GB storage)
   - Master username: fbadmin
   - Database name: firstbrowser
4. **Connect via SSH** (in browser or terminal)
5. **Follow EC2 steps 5-11** (same process)
6. **Configure domain**: Use Lightsail's static IP in DNS

---

## 📊 AWS Cost Comparison

| Option | Monthly Cost | Complexity | Scalability |
|--------|--------------|------------|-------------|
| **Elastic Beanstalk** | $25-40 | Low | High |
| **ECS Fargate** | $30-50 | Medium | Very High |
| **EC2 + RDS** | $20-35 | High | Medium |
| **Lightsail** | $25-35 | Very Low | Low-Medium |

**Plus**: OpenAI/Anthropic API costs (~$10-50/month)

---

## 🎯 Recommendation

**For firstbrowser.ai, I recommend**:

1. **Starting with**: AWS Lightsail ($35/month total)
   - Simplest setup
   - Fixed pricing
   - Perfect for MVP/launch

2. **Scaling to**: AWS Elastic Beanstalk
   - When you need auto-scaling
   - More traffic (>10k visitors/month)
   - Better monitoring

3. **Long-term**: AWS ECS Fargate
   - Production-grade
   - Better isolation
   - Easier DevOps with Docker

---

## 🔒 Security Best Practices

1. **Use AWS Secrets Manager** for API keys (instead of environment variables)
2. **Enable VPC** for RDS (no public access)
3. **Use Security Groups** properly (least privilege)
4. **Enable CloudWatch** for monitoring and logging
5. **Use IAM roles** instead of access keys where possible
6. **Enable AWS WAF** for DDoS protection (optional but recommended)

---

## 🚦 Quick Decision Matrix

**Choose AWS Lightsail if:**
- First time deploying to AWS
- Budget-conscious (~$35/month)
- Want simplicity over features

**Choose Elastic Beanstalk if:**
- Want managed deployment
- Need auto-scaling
- Want AWS ecosystem benefits

**Choose ECS Fargate if:**
- Docker experience
- Need containerization
- Want microservices ready

**Choose EC2 if:**
- Need full control
- Have DevOps experience
- Want to minimize costs

---

## 📞 Next Steps

1. **Pick an option** (Lightsail recommended for launch)
2. **Follow the guide** step by step
3. **Test thoroughly** before pointing domain
4. **Monitor costs** in AWS Billing Dashboard
5. **Setup CloudWatch alarms** for unusual activity

Good luck with your AWS deployment! 🚀

