# User Onboarding Application

A comprehensive user onboarding system with admin approval workflow, built with Node.js, React, SQL Server, Docker, and horizontal scaling capabilities.

## 🎯 Features

### User Features
- ✅ User registration with email and password
- ✅ User login with JWT authentication
- ✅ Status check to see approval status
- ✅ Secure password hashing with bcrypt

### Admin Features
- ✅ Admin login (default: username: `admin`, password: `Admin123!`)
- ✅ View pending user registrations
- ✅ Approve or reject user accounts
- ✅ JWT-based admin authentication

### Technical Features
- ✅ **Backend**: Node.js/Express REST API
- ✅ **Frontend**: React 19 with responsive UI
- ✅ **Database**: SQL Server with proper schema
- ✅ **Docker**: Multi-container setup with docker-compose
- ✅ **Horizontal Scaling**: 3 backend instances with nginx load balancer
- ✅ **Testing**: Comprehensive test coverage
  - 27 Backend unit tests
  - 22 Frontend unit tests
  - 25 Backend integration tests
  - 19 Frontend-backend integration tests
  - 43 E2E Playwright tests (95.3% pass rate)

## 🏗️ Architecture

### Basic Architecture (3 containers)
```
Frontend (React + nginx) → Backend (Node.js) → Database (SQL Server)
```

### Scaled Architecture (6 containers)
```
Frontend → Load Balancer (nginx) → Backend-1
                                  → Backend-2
                                  → Backend-3
                                  ↓
                              SQL Server
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- OR use GitHub Codespaces (Docker pre-installed)

### Option 1: Basic Setup (Single Backend)

```bash
# Clone the repository
git clone <your-repo-url>
cd user-onboarding-app

# Start services
docker compose up -d --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
```

### Option 2: Horizontal Scaling (3 Backends + Load Balancer)

```bash
# Start scaled services
docker compose -f docker-compose.scale.yml up -d --build

# Access the application
# Frontend: http://localhost:3000
# Load Balancer: http://localhost:8080
# Backend API: http://localhost:8080/api
```

## 📋 Testing

### Run All Tests Locally (Without Docker)

```bash
# Backend tests
cd backend
npm install
npm test              # Unit tests
npm run test:integration  # Integration tests

# Frontend tests
cd ../frontend
npm install
npm test              # Unit tests
npm run test:integration  # Integration tests

# E2E Playwright tests
cd ..
npm install
npx playwright install
npx playwright test
```

### View Test Reports

```bash
# Playwright HTML report
npx playwright show-report

# Jest coverage
cd backend && npm test -- --coverage
cd frontend && npm test -- --coverage
```

## 🌩️ Deploy to GitHub Codespaces

1. **Fork/Clone this repository to your GitHub account**

2. **Create a Codespace**:
   - Go to your GitHub repository
   - Click "Code" → "Codespaces" → "Create codespace on main"
   - Wait 2-3 minutes for environment setup

3. **Test in Codespace**:
```bash
# Test basic Docker setup
docker compose up -d --build

# Test horizontal scaling
docker compose -f docker-compose.scale.yml up -d --build

# Run Playwright tests
npx playwright install --with-deps
npx playwright test
```

## 📊 Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Backend Unit | 27 | ✅ 100% |
| Frontend Unit | 22 | ✅ 100% |
| Backend Integration | 25 | ✅ 100% |
| Frontend Integration | 19 | ✅ 100% |
| E2E Playwright | 43 | ✅ 95.3% (41/43) |
| **Total** | **136** | **99.3%** |

## 📁 Project Structure

```
.
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth middleware
│   │   └── models/       # Database models
│   ├── tests/            # Unit & integration tests
│   └── Dockerfile        # Backend container
├── frontend/             # React application
│   ├── src/
│   │   ├── pages/        # React components
│   │   └── mocks/        # MSW mocks for testing
│   ├── public/           # Static assets
│   └── Dockerfile        # Frontend container
├── db/                   # Database scripts
│   └── init.sql          # Schema initialization
├── e2e-playwright/       # E2E test suite
│   ├── 01-registration.spec.js
│   ├── 02-login.spec.js
│   ├── 03-admin-auth.spec.js
│   ├── 04-admin-user-management.spec.js
│   ├── 05-complete-flow.spec.js
│   └── 06-user-status.spec.js
├── docker-compose.yml         # Basic Docker setup
├── docker-compose.scale.yml   # Scaled setup with LB
├── nginx-load-balancer.conf   # Load balancer config
└── Documentation files (*.md)
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in project root:

```env
# Database
DB_SERVER=db
DB_PORT=1433
DB_DATABASE=UserOnboardingDB
DB_USER=sa
DB_PASSWORD=YourStrong@Password123

# Backend
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
```

### Default Admin Credentials

- **Username**: `admin`
- **Password**: `Admin123!`

⚠️ **Change these in production!**

## 📖 Documentation

- **[DOCKER_SETUP.md](DOCKER_SETUP.md)** - Complete Docker deployment guide
- **[HORIZONTAL_SCALING.md](HORIZONTAL_SCALING.md)** - Horizontal scaling architecture
- **[CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md)** - Cloud deployment options
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing strategies and guides
- **[PLAYWRIGHT_QUICK_REFERENCE.md](PLAYWRIGHT_QUICK_REFERENCE.md)** - E2E testing reference

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check container logs
docker compose logs -f

# Check specific service
docker compose logs backend

# Restart services
docker compose restart
```

### Database Connection Issues

```bash
# Check database health
docker compose ps

# Connect to database directly
docker exec -it user-onboarding-db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong@Password123' \
  -Q "SELECT name FROM sys.databases"
```

### Load Balancer Issues

```bash
# Check nginx logs
docker compose -f docker-compose.scale.yml logs load-balancer

# Test load balancer health
curl http://localhost:8080/lb-health

# Test backend distribution
for i in {1..10}; do curl http://localhost:8080/api/health; done
```

## 🎯 Load Testing

```bash
# Install Apache Bench
brew install httpd  # macOS

# Run load test
ab -n 1000 -c 10 http://localhost:8080/api/health

# Check request distribution
docker compose -f docker-compose.scale.yml logs load-balancer | grep "backend-"
```

## 🚢 Production Deployment

For production, consider:

1. **Security**:
   - Change default admin password
   - Use environment-specific JWT secrets
   - Enable HTTPS with SSL certificates
   - Implement rate limiting

2. **Scaling**:
   - Use Kubernetes for auto-scaling
   - Implement database read replicas
   - Add Redis for session management
   - Configure CDN for static assets

3. **Monitoring**:
   - Set up Prometheus + Grafana
   - Configure log aggregation (ELK stack)
   - Add health check monitoring
   - Set up alerts for failures

## 📄 License

MIT

## 👥 Contributors

Built as a comprehensive full-stack application demonstrating modern DevOps practices.

---

**Need help?** Check the documentation files or create an issue!
