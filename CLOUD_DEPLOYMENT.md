# Cloud Deployment Guide

## Overview

This guide covers deploying your User Onboarding application to cloud environments for testing the Docker and horizontal scaling setup **without local Docker installation**.

## 🎯 Recommended Options

### Option 1: GitHub Codespaces (Easiest) ⭐
- **Pros**: Docker pre-installed, VS Code in browser, free 60 hours/month
- **Cons**: Requires GitHub account
- **Best for**: Quick testing and development

### Option 2: Azure Container Instances
- **Pros**: Easy deployment, pay-per-second, no cluster management
- **Cons**: Requires Azure account, not free (but cheap for testing)
- **Best for**: Quick cloud testing with production-like environment

### Option 3: Railway.app (Free Tier)
- **Pros**: Free tier, easy deployment, PostgreSQL included
- **Cons**: Need to migrate from SQL Server to PostgreSQL
- **Best for**: Free production deployment

---

## 🚀 Option 1: GitHub Codespaces (Recommended for Testing)

### Prerequisites
- GitHub account (free)
- Your code pushed to a GitHub repository

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
cd /Users/aditya.kittur/Test/AI_Training/User_onboarding_Assignment
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.docker

# Test results
test-results/
playwright-report/
coverage/

# Build outputs
backend/dist/
frontend/build/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Docker volumes (if running locally)
sqlserver-data/
EOF

# Add all files
git add .

# Commit
git commit -m "Initial commit: User Onboarding Application with Docker and Horizontal Scaling"

# Create GitHub repo (via web interface or GitHub CLI)
# Then push
git remote add origin https://github.com/YOUR_USERNAME/user-onboarding-app.git
git branch -M main
git push -u origin main
```

### Step 2: Create Codespace

1. Go to your GitHub repository
2. Click the green **"Code"** button
3. Select **"Codespaces"** tab
4. Click **"Create codespace on main"**

⏳ Wait 2-3 minutes for environment to initialize

### Step 3: Verify Docker in Codespace

```bash
# Check Docker is installed
docker --version
docker compose version

# Should see: Docker version 20.x.x and Docker Compose version v2.x.x
```

### Step 4: Test Basic Docker Setup

```bash
# Test with basic docker-compose.yml (3 services)
docker compose up -d --build

# Wait for services to start (2-3 minutes)
# Watch logs
docker compose logs -f

# Check service health
docker compose ps

# Test the application
curl http://localhost:3000  # Frontend
curl http://localhost:5000/health  # Backend

# Stop services
docker compose down
```

### Step 5: Test Horizontal Scaling

```bash
# Use the scaled configuration
docker compose -f docker-compose.scale.yml up -d --build

# Wait for all services (5-7 minutes for first build)
# 1 DB + 3 Backends + 1 Load Balancer + 1 Frontend = 6 containers

# Check all containers
docker compose -f docker-compose.scale.yml ps

# Test load balancer
curl http://localhost:8080/lb-health

# Test backend through load balancer
for i in {1..10}; do
  curl http://localhost:8080/api/health
  echo ""
done

# Check which backend handled requests
docker compose -f docker-compose.scale.yml logs load-balancer | grep "GET /api/health"

# Monitor resource usage
docker stats

# Access frontend (Codespaces will provide a forwarded URL)
# Look for "Ports" tab in VS Code, find port 3000
```

### Step 6: Run Playwright Tests in Codespace

```bash
# Install Playwright browsers
npx playwright install --with-deps

# Start backend and frontend (not in Docker for E2E tests)
cd backend
npm install
npm start &

cd ../frontend
npm install
REACT_APP_API_BASE_URL=http://localhost:5000/api npm start &

# Wait for services to start
sleep 10

# Run Playwright tests
cd ..
npx playwright test --workers=1

# View HTML report
npx playwright show-report
```

### Step 7: Cleanup

```bash
# Stop all containers
docker compose -f docker-compose.scale.yml down

# Remove volumes (optional)
docker compose -f docker-compose.scale.yml down -v

# Stop Codespace (from GitHub web interface or it auto-stops after 30 min idle)
```

### Codespaces Port Forwarding

Codespaces automatically forwards ports. Access your app:
- Frontend: `https://YOUR-CODESPACE-NAME-3000.preview.app.github.dev`
- Backend API: `https://YOUR-CODESPACE-NAME-5000.preview.app.github.dev`
- Load Balancer: `https://YOUR-CODESPACE-NAME-8080.preview.app.github.dev`

---

## 🌩️ Option 2: Azure Container Instances

### Prerequisites
- Azure account (free $200 credit for new accounts)
- Azure CLI installed: `brew install azure-cli`

### Step 1: Login to Azure

```bash
az login
# Opens browser for authentication

# Set subscription (if you have multiple)
az account list --output table
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### Step 2: Create Resource Group

```bash
az group create \
  --name user-onboarding-rg \
  --location eastus
```

### Step 3: Create Azure Container Registry (ACR)

```bash
# Create registry
az acr create \
  --resource-group user-onboarding-rg \
  --name useronboardingacr \
  --sku Basic

# Login to ACR
az acr login --name useronboardingacr
```

### Step 4: Build and Push Images

```bash
cd /Users/aditya.kittur/Test/AI_Training/User_onboarding_Assignment

# Tag and push backend
docker build -t useronboardingacr.azurecr.io/backend:latest ./backend
docker push useronboardingacr.azurecr.io/backend:latest

# Tag and push frontend
docker build -t useronboardingacr.azurecr.io/frontend:latest ./frontend
docker push useronboardingacr.azurecr.io/frontend:latest
```

### Step 5: Deploy with Azure Container Instances

```bash
# Create Azure SQL Database (or use existing)
az sql server create \
  --resource-group user-onboarding-rg \
  --name user-onboarding-sql \
  --admin-user sqladmin \
  --admin-password "YourStrong@Password123"

az sql db create \
  --resource-group user-onboarding-rg \
  --server user-onboarding-sql \
  --name UserOnboardingDB \
  --service-objective Basic

# Enable firewall for Azure services
az sql server firewall-rule create \
  --resource-group user-onboarding-rg \
  --server user-onboarding-sql \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Deploy backend container
az container create \
  --resource-group user-onboarding-rg \
  --name backend-1 \
  --image useronboardingacr.azurecr.io/backend:latest \
  --cpu 1 \
  --memory 1 \
  --registry-login-server useronboardingacr.azurecr.io \
  --registry-username $(az acr credential show --name useronboardingacr --query username -o tsv) \
  --registry-password $(az acr credential show --name useronboardingacr --query passwords[0].value -o tsv) \
  --environment-variables \
    NODE_ENV=production \
    DB_SERVER=user-onboarding-sql.database.windows.net \
    DB_DATABASE=UserOnboardingDB \
    DB_USER=sqladmin \
    DB_PASSWORD="YourStrong@Password123" \
  --ports 5000 \
  --ip-address Public

# Get backend IP
az container show \
  --resource-group user-onboarding-rg \
  --name backend-1 \
  --query ipAddress.ip \
  --output tsv
```

### Step 6: Test Deployment

```bash
# Get public IP
BACKEND_IP=$(az container show --resource-group user-onboarding-rg --name backend-1 --query ipAddress.ip --output tsv)

# Test health endpoint
curl http://$BACKEND_IP:5000/health
```

### Step 7: Cleanup

```bash
# Delete resource group (deletes everything)
az group delete --name user-onboarding-rg --yes --no-wait
```

### Cost Estimate
- **ACR Basic**: ~$5/month
- **Azure SQL Basic**: ~$5/month
- **Container Instances**: ~$0.013/hour per 1 CPU, 1GB RAM
- **Total for testing (few hours)**: < $1

---

## 🚂 Option 3: Railway.app (Free Tier)

### Prerequisites
- GitHub account
- Railway account (free): https://railway.app

### Step 1: Prepare for Railway

Railway uses PostgreSQL, not SQL Server. Quick migration:

```bash
# Install PostgreSQL Node.js driver
cd backend
npm install pg
```

Update `backend/db.js` to support PostgreSQL:

```javascript
// Add PostgreSQL support
const isPG = process.env.DB_TYPE === 'postgresql';

if (isPG) {
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_SERVER,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });
  module.exports = { pool, isPG };
} else {
  // Existing SQL Server code
  // ...
}
```

### Step 2: Create railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 3: Deploy to Railway

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Add **PostgreSQL** service
6. Add environment variables:
   - `NODE_ENV=production`
   - `DB_TYPE=postgresql`
   - `DB_SERVER=${{Postgres.PGHOST}}`
   - `DB_DATABASE=${{Postgres.PGDATABASE}}`
   - `DB_USER=${{Postgres.PGUSER}}`
   - `DB_PASSWORD=${{Postgres.PGPASSWORD}}`
7. Deploy!

### Cost
- **Free tier**: 500 hours/month, 512MB RAM, 1GB storage
- **Upgrade**: $5/month for more resources

---

## 🔄 Testing Checklist

Once deployed to any cloud environment:

### Basic Functionality
- [ ] Frontend loads successfully
- [ ] Backend health check responds
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works
- [ ] User approval flow works
- [ ] Status check works

### Horizontal Scaling (Codespaces only)
- [ ] All 3 backend instances start
- [ ] Load balancer health check responds
- [ ] Traffic distributes across backends
- [ ] One backend can be stopped without errors
- [ ] Frontend connects through load balancer

### Performance Testing
```bash
# Install Apache Bench (if not installed)
brew install httpd  # macOS

# Load test
ab -n 1000 -c 10 http://LOAD_BALANCER_URL/api/health

# Check distribution in logs
docker compose -f docker-compose.scale.yml logs load-balancer | grep "backend-" | sort | uniq -c
```

### Monitoring
```bash
# Resource usage
docker stats

# Container logs
docker compose -f docker-compose.scale.yml logs -f

# Specific service
docker compose -f docker-compose.scale.yml logs -f backend-1
```

---

## 📊 Comparison Matrix

| Feature | Codespaces | Azure ACI | Railway |
|---------|-----------|-----------|---------|
| **Free Tier** | ✅ 60 hrs/mo | ❌ Pay-per-use | ✅ 500 hrs/mo |
| **Docker Support** | ✅ Built-in | ✅ Native | ❌ Limited |
| **SQL Server** | ✅ Via Docker | ✅ Azure SQL | ❌ PostgreSQL only |
| **Horizontal Scaling Test** | ✅ Full support | ⚠️ Manual setup | ❌ Not supported |
| **Setup Time** | 5 minutes | 20 minutes | 15 minutes |
| **Best For** | Testing Docker & Scaling | Production-like | Simple deployment |

## 🎯 Recommendation

**For testing your horizontal scaling setup: Use GitHub Codespaces**

Why?
1. ✅ Docker pre-installed
2. ✅ Can run docker-compose.scale.yml exactly as designed
3. ✅ SQL Server in Docker (no migration needed)
4. ✅ Test all 3 backend instances + load balancer
5. ✅ Free 60 hours/month
6. ✅ VS Code environment (familiar)
7. ✅ Easy port forwarding

---

## 🚀 Quick Start: Codespaces

```bash
# 1. Push to GitHub (if not done)
git push origin main

# 2. Create Codespace from GitHub UI

# 3. Once in Codespace, run:
docker compose -f docker-compose.scale.yml up -d --build

# 4. Wait 5-7 minutes, then test:
curl http://localhost:8080/lb-health
curl http://localhost:3000

# 5. View logs:
docker compose -f docker-compose.scale.yml logs -f

# 6. Test load balancing:
for i in {1..20}; do curl http://localhost:8080/api/health; done
```

---

## 🆘 Troubleshooting

### Codespaces: Port Not Found
- Check "Ports" tab in VS Code
- Ports auto-forward when detected
- Click globe icon to open in browser

### Codespaces: Out of Storage
```bash
# Clean up Docker
docker system prune -a --volumes -f
```

### Azure: Can't Push to ACR
```bash
# Re-login
az acr login --name useronboardingacr
```

### Railway: PostgreSQL Connection Failed
- Check environment variables are set correctly
- Ensure `${{Postgres.XXX}}` syntax is used
- Check database migrations ran

---

## 📝 Next Steps

1. **Choose your platform** (Codespaces recommended)
2. **Follow the deployment steps**
3. **Test basic functionality**
4. **Test horizontal scaling** (Codespaces)
5. **Run performance tests**
6. **Document results**

Good luck with your cloud deployment! 🚀
