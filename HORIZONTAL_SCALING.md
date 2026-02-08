# Horizontal Scaling Architecture Guide

## Overview

This application implements **horizontal scaling** with multiple backend instances behind a load balancer, providing:

- ✅ **High Availability** - If one instance fails, others continue serving
- ✅ **Load Distribution** - Traffic spread across multiple instances
- ✅ **Fault Tolerance** - Automatic failover to healthy instances
- ✅ **Scalability** - Easy to add/remove instances
- ✅ **Performance** - Better resource utilization

## Architecture Diagram

```
                    User Browser
                          │
                          ▼
              ┌──────────────────────┐
              │    Frontend          │
              │  (React + nginx)     │
              │   Port 3000          │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Load Balancer      │
              │   (nginx)            │
              │   Port 8080          │
              └──────────┬───────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐     ┌────────┐     ┌────────┐
    │Backend │     │Backend │     │Backend │
    │   #1   │     │   #2   │     │   #3   │
    │ :5000  │     │ :5000  │     │ :5000  │
    └────┬───┘     └────┬───┘     └────┬───┘
         │              │              │
         └──────────────┼──────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │   SQL Server DB      │
              │   Port 1433          │
              └──────────────────────┘
```

## Components

### 1. Load Balancer (Nginx)
- **Purpose**: Distributes incoming traffic across backend instances
- **Algorithm**: Least connections (sends to instance with fewest active connections)
- **Features**:
  - Health checks every 30 seconds
  - Automatic failover to healthy instances
  - Connection pooling for performance
  - Request retry on failure (up to 3 times)

### 2. Backend Instances (3x)
- **Instance 1**: backend-1:5000
- **Instance 2**: backend-2:5000
- **Instance 3**: backend-3:5000

Each instance:
- Runs independently
- Connects to shared database
- Has its own health check
- Resource limited (0.5 CPU, 512MB RAM)

### 3. Shared Database
- Single SQL Server instance (can be clustered separately)
- All backend instances connect to same DB
- Handles connection pooling
- Resource allocated: 2 CPU, 2GB RAM

## Load Balancing Strategies

### Current: Least Connections
```nginx
upstream backend_pool {
    least_conn;  # Route to instance with fewest active connections
    server backend-1:5000;
    server backend-2:5000;
    server backend-3:5000;
}
```

**Best for**: Varying request processing times

### Alternative: Round Robin (Default)
```nginx
upstream backend_pool {
    # No directive = round robin
    server backend-1:5000;
    server backend-2:5000;
    server backend-3:5000;
}
```

**Best for**: Uniform request processing

### Alternative: IP Hash (Sticky Sessions)
```nginx
upstream backend_pool {
    ip_hash;  # Same client always goes to same backend
    server backend-1:5000;
    server backend-2:5000;
    server backend-3:5000;
}
```

**Best for**: Session-based applications (not needed with JWT)

### Alternative: Weighted
```nginx
upstream backend_pool {
    server backend-1:5000 weight=3;  # Gets 3x traffic
    server backend-2:5000 weight=2;  # Gets 2x traffic
    server backend-3:5000 weight=1;  # Gets 1x traffic
}
```

**Best for**: Instances with different capacities

## Session Management

### Stateless Architecture (Current Implementation)
- **JWT tokens** stored in client (browser localStorage)
- No server-side session storage needed
- Any backend instance can handle any request
- **Perfect for horizontal scaling** ✅

### Why It Works:
1. User logs in → receives JWT token
2. JWT contains all necessary user info (signed & encrypted)
3. Every request includes JWT in header
4. Any backend instance can verify JWT independently
5. No shared session store needed

## Health Checks

### Load Balancer Health Check
```bash
curl http://localhost:8080/lb-health
# Response: Load balancer is healthy
```

### Backend Instance Health Checks
```bash
# Via load balancer (checks all instances)
curl http://localhost:8080/health

# Direct to instance
curl http://localhost:8080/api/health
```

### Health Check Configuration
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "...health check code..."]
  interval: 30s      # Check every 30 seconds
  timeout: 10s       # Wait max 10 seconds
  retries: 3         # Try 3 times before marking unhealthy
  start_period: 40s  # Grace period during startup
```

## Scaling Operations

### Scale Up (Add More Instances)

1. **Edit `docker-compose.scale.yml`** - Add backend-4:
```yaml
backend-4:
  build:
    context: ./backend
  environment:
    - INSTANCE_ID=backend-4
    # ... other config ...
```

2. **Update `nginx-load-balancer.conf`** - Add to upstream:
```nginx
upstream backend_pool {
    least_conn;
    server backend-1:5000;
    server backend-2:5000;
    server backend-3:5000;
    server backend-4:5000;  # New instance
}
```

3. **Restart services**:
```bash
docker compose -f docker-compose.scale.yml up -d backend-4
docker compose -f docker-compose.scale.yml restart load-balancer
```

### Scale Down (Remove Instances)

1. **Gracefully stop instance**:
```bash
docker compose -f docker-compose.scale.yml stop backend-3
```

2. **Update nginx config** to remove backend-3

3. **Reload load balancer**:
```bash
docker compose -f docker-compose.scale.yml restart load-balancer
```

4. **Remove container**:
```bash
docker compose -f docker-compose.scale.yml rm backend-3
```

## Auto-Scaling Strategies

### Manual Scaling (Current)
Manually add/remove instances based on monitoring

### Docker Swarm Auto-Scaling
```yaml
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 10s
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
```

### Kubernetes Auto-Scaling (Production)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Monitoring & Observability

### Key Metrics to Monitor

1. **Load Balancer Metrics**:
   - Active connections per backend
   - Request distribution
   - Failed health checks
   - Response times

2. **Backend Metrics**:
   - CPU usage per instance
   - Memory usage per instance
   - Request rate
   - Error rate
   - Response time (p50, p95, p99)

3. **Database Metrics**:
   - Connection pool usage
   - Query performance
   - Lock contention
   - Replication lag (if using replicas)

### Monitoring Tools

**Option 1: Prometheus + Grafana**
```yaml
# Add to docker-compose.scale.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
```

**Option 2: ELK Stack (Elasticsearch, Logstash, Kibana)**
For log aggregation and analysis

**Option 3: Cloud Native Monitoring**
- AWS CloudWatch
- Azure Monitor
- Google Cloud Monitoring

## Performance Optimization

### Connection Pooling
```nginx
upstream backend_pool {
    least_conn;
    keepalive 32;  # Keep 32 connections alive
    server backend-1:5000;
    server backend-2:5000;
    server backend-3:5000;
}
```

### Caching Strategy
```nginx
# Cache static responses
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;

location /api/static-data {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_pass http://backend_pool;
}
```

### Database Connection Pooling
Each backend instance maintains its own connection pool:
```javascript
// In backend code
const pool = new sql.ConnectionPool({
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    pool: {
        max: 10,      // Max connections per instance
        min: 2,       // Min connections
        idleTimeoutMillis: 30000
    }
});
```

With 3 instances × 10 max connections = 30 total DB connections

## Troubleshooting

### Issue: Uneven Load Distribution

**Symptom**: One backend getting most traffic

**Check**:
```bash
# View nginx access logs
docker logs user-onboarding-load-balancer | grep "backend-"
```

**Solutions**:
1. Verify load balancing algorithm
2. Check if instances have different response times
3. Consider switching to `least_conn` if using round-robin

### Issue: Backend Instance Down

**Symptom**: Some requests failing

**Check**:
```bash
# Check backend health
docker ps | grep backend
docker logs user-onboarding-backend-1
```

**Solutions**:
1. Load balancer automatically routes around failed instance
2. Check backend logs for errors
3. Restart failed instance: `docker restart user-onboarding-backend-1`

### Issue: Database Connection Pool Exhausted

**Symptom**: All backends slow/timing out

**Check**:
```bash
# Check DB connections
docker exec user-onboarding-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'password' -Q "SELECT * FROM sys.dm_exec_sessions WHERE is_user_process = 1"
```

**Solutions**:
1. Increase max connections per backend instance
2. Reduce number of backend instances
3. Upgrade database resources
4. Implement connection pooling properly

## Deployment Workflow

### Development
```bash
# Start with single backend
docker compose up -d
```

### Staging/Testing
```bash
# Start with scaled backend
docker compose -f docker-compose.scale.yml up -d
```

### Production
1. Use Kubernetes or Docker Swarm
2. Implement auto-scaling policies
3. Set up monitoring and alerting
4. Configure CI/CD pipelines
5. Implement blue-green or canary deployments

## Quick Start Commands

### Start Scaled Environment
```bash
# Build and start all services (1 DB, 3 backends, 1 LB, 1 frontend)
docker compose -f docker-compose.scale.yml up -d --build

# View logs
docker compose -f docker-compose.scale.yml logs -f

# Check status
docker compose -f docker-compose.scale.yml ps
```

### Test Load Balancing
```bash
# Make multiple requests
for i in {1..10}; do
  curl http://localhost:8080/api/health
  echo ""
done

# Check which backend handled each request (in logs)
docker compose -f docker-compose.scale.yml logs load-balancer | grep "GET /api/health"
```

### Monitor Resource Usage
```bash
docker stats
```

### Stop Scaled Environment
```bash
docker compose -f docker-compose.scale.yml down
```

## Next Steps

- [ ] Set up Prometheus + Grafana for monitoring
- [ ] Implement distributed tracing (Jaeger/Zipkin)
- [ ] Add rate limiting and circuit breaker
- [ ] Configure SSL/TLS certificates
- [ ] Set up CI/CD pipeline for auto-deployment
- [ ] Implement canary or blue-green deployments
- [ ] Add database read replicas for scaling reads
- [ ] Configure backup and disaster recovery

## Resources

- [Nginx Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)
- [Docker Compose Scaling](https://docs.docker.com/compose/compose-file/deploy/)
- [Kubernetes Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [The Twelve-Factor App](https://12factor.net/)
