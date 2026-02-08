# Docker Setup Guide - User Onboarding Application

## Architecture Overview

This application uses **3 Docker containers**:

```
┌─────────────────────────────────────────────────────┐
│              Docker Compose Stack                   │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Frontend    │  │   Backend    │  │ Database │ │
│  │  Container   │─▶│  Container   │─▶│Container │ │
│  │  (nginx:80)  │  │ (Node.js:5000)│ │(SQL 2022)│ │
│  │  React App   │  │  Express API  │  │  Port    │ │
│  │              │  │               │  │  1433    │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│       ↑                                             │
│       │                                             │
│   Port 3000                                         │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

- **Docker Desktop** (or Docker Engine + Docker Compose)
- **8GB RAM** minimum (SQL Server requires memory)
- **10GB free disk space**

### Install Docker Desktop

**macOS:**
```bash
brew install --cask docker
# Or download from: https://www.docker.com/products/docker-desktop
```

**Windows:**
Download from: https://www.docker.com/products/docker-desktop

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Quick Start

### 1. Create Environment File

```bash
# Copy the example environment file
cp .env.docker .env

# Edit .env with your preferred values (optional)
# Default password: YourStrong@Password123
```

### 2. Build and Start All Services

```bash
# Build images and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Wait for Services to Start

The database takes ~30-60 seconds to initialize. Watch the logs:

```bash
docker-compose logs -f database
```

Look for: `"Database schema created successfully!"`

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Database:** localhost:1433

**Default Credentials:**
- Admin username: `admin`
- Admin password: `Admin123!`

## Docker Commands

### Starting/Stopping

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v

# Restart a specific service
docker-compose restart backend
```

### Building

```bash
# Rebuild all images
docker-compose build

# Rebuild a specific service
docker-compose build frontend

# Force rebuild without cache
docker-compose build --no-cache
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Last 100 lines
docker-compose logs --tail=100
```

### Health Checks

```bash
# Check status of all services
docker-compose ps

# Inspect a specific container
docker inspect user-onboarding-backend

# Check health status
docker inspect --format='{{.State.Health.Status}}' user-onboarding-backend
```

### Database Access

```bash
# Connect to SQL Server container
docker exec -it user-onboarding-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'YourStrong@Password123'

# Run a query
docker exec user-onboarding-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'YourStrong@Password123' -Q "SELECT * FROM UserOnboardingDB.dbo.users"

# Backup database
docker exec user-onboarding-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'YourStrong@Password123' -Q "BACKUP DATABASE UserOnboardingDB TO DISK = '/var/opt/mssql/backup/UserOnboardingDB.bak'"
```

### Shell Access

```bash
# Access backend container
docker exec -it user-onboarding-backend sh

# Access frontend container
docker exec -it user-onboarding-frontend sh

# Access database container
docker exec -it user-onboarding-db bash
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs [service-name]

# Check if ports are already in use
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :1433  # Database
```

### Database Connection Issues

```bash
# Verify database is healthy
docker-compose ps database

# Check database logs
docker-compose logs database

# Restart database
docker-compose restart database

# Wait for health check to pass (30-60 seconds)
```

### Frontend Can't Reach Backend

```bash
# Verify backend is running
curl http://localhost:5000/health

# Check network connectivity
docker exec user-onboarding-frontend ping backend

# Inspect nginx configuration
docker exec user-onboarding-frontend cat /etc/nginx/conf.d/default.conf
```

### Out of Disk Space

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything (careful!)
docker system prune -a --volumes
```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove images
docker rmi user-onboarding-backend user-onboarding-frontend

# Rebuild and restart
docker-compose up -d --build
```

## Production Considerations

### Security

1. **Change default passwords** in `.env`:
   - `DB_PASSWORD`
   - `JWT_SECRET`

2. **Use secrets management**:
   ```yaml
   secrets:
     db_password:
       file: ./secrets/db_password.txt
   ```

3. **Don't commit `.env`** to version control

### Performance

1. **Resource limits**:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 512M
   ```

2. **Database optimization**:
   - Adjust `MSSQL_MEMORY_LIMIT_MB`
   - Configure proper backup strategy
   - Set up regular maintenance jobs

### Monitoring

```bash
# Resource usage
docker stats

# Health status
docker-compose ps
watch -n 5 docker-compose ps
```

## Development vs Production

### Development Setup (Current)
- Source code mounted as volumes
- Hot reload enabled
- Debug logging
- No HTTPS

### Production Setup (Recommended)
- Built images only (no volumes)
- Optimized builds
- HTTPS with certificates
- Load balancer (for scaling)
- Proper secrets management
- Monitoring and alerting

## Next Steps

- ✅ Application is running in Docker
- [ ] Set up horizontal scaling (load balancer)
- [ ] Configure CI/CD pipeline
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Implement logging aggregation
- [ ] Configure backup strategy

## Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SQL Server on Docker](https://hub.docker.com/_/microsoft-mssql-server)
- [nginx Documentation](https://nginx.org/en/docs/)
