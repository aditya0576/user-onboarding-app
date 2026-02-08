# Docker Deployment Guide

This guide explains how to deploy the User Onboarding Application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Azure SQL Database (already configured)

## Quick Start

### 1. Environment Configuration

Copy the environment template and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` and set your Azure SQL Database credentials:
```
DB_SERVER=your-server.database.windows.net
DB_DATABASE=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
JWT_SECRET=your-super-secret-jwt-key
```

### 2. Build and Run

Build and start all services:

```bash
docker-compose up --build
```

Or run in detached mode:

```bash
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Checks**:
  - Frontend: http://localhost:3000/health
  - Backend: http://localhost:5000/health

## Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### Check Service Status
```bash
docker-compose ps
```

### Execute Commands in Container
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh
```

## Architecture

### Services

1. **Backend** (`backend`)
   - Node.js Express API
   - Port: 5000
   - Multi-stage build with Alpine Linux
   - Non-root user for security
   - Health check enabled

2. **Frontend** (`frontend`)
   - React application served by nginx
   - Port: 3000
   - Multi-stage build: Node.js build + nginx serve
   - Non-root user for security
   - Health check enabled

3. **Database** (`db`)
   - Placeholder service for Azure SQL
   - Actual database is hosted on Azure

### Network

- All services connected via `user-onboarding-network` bridge network
- Internal service communication uses service names

## Production Considerations

### Security

1. **Non-root Users**: Both containers run as non-root users
2. **Environment Variables**: Sensitive data in `.env` file (excluded from Git)
3. **Health Checks**: Automatic container health monitoring
4. **Security Headers**: nginx configured with security headers

### Optimization

1. **Multi-stage Builds**: Smaller production images
2. **Alpine Linux**: Minimal base images
3. **Layer Caching**: Optimized Dockerfile layer order
4. **Gzip Compression**: Enabled in nginx for frontend
5. **Static Asset Caching**: 1-year cache for static files

### Monitoring

Health checks configured for both services:
- Backend: HTTP check on `/health` endpoint every 30s
- Frontend: HTTP check on `/health` endpoint every 30s

View health status:
```bash
docker-compose ps
```

## Troubleshooting

### Service Won't Start

Check logs:
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Database Connection Issues

1. Verify Azure SQL firewall rules allow Docker host IP
2. Check `.env` file has correct database credentials
3. Test connection from backend container:
```bash
docker-compose exec backend sh
node -e "require('./src/config/database').poolPromise.then(() => console.log('Connected'))"
```

### Port Already in Use

Stop conflicting services or change ports in `docker-compose.yml`:
```yaml
ports:
  - "5001:5000"  # Map to different host port
```

### Rebuild Clean

Remove all containers, images, and volumes:
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

## CI/CD Integration

### Build Images
```bash
docker build -t user-onboarding-backend:latest ./backend
docker build -t user-onboarding-frontend:latest ./frontend
```

### Tag for Registry
```bash
docker tag user-onboarding-backend:latest your-registry/backend:v1.0.0
docker tag user-onboarding-frontend:latest your-registry/frontend:v1.0.0
```

### Push to Registry
```bash
docker push your-registry/backend:v1.0.0
docker push your-registry/frontend:v1.0.0
```

## Development vs Production

### Development Mode

Uses `docker-compose.yml` with:
- Live code reloading (mount volumes)
- Development environment variables
- Exposed ports for debugging

### Production Mode

Uses `docker-compose.prod.yml` with:
- No volume mounts
- Production environment variables
- Optimized builds
- Resource limits

Run production:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Next Steps

- Set up container orchestration (Kubernetes)
- Implement horizontal scaling
- Add reverse proxy (nginx/Traefik)
- Configure SSL/TLS certificates
- Set up centralized logging
- Add monitoring (Prometheus/Grafana)
