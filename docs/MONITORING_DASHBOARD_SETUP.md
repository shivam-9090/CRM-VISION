# 📊 Monitoring Dashboard Setup Guide

Complete guide to setting up production monitoring and observability for CRM-VISION.

---

## 📋 Overview

This guide covers setting up a comprehensive monitoring solution for production environments. Choose the option that best fits your needs and budget.

**Current Status**: ✅ Health endpoints + Sentry error tracking implemented  
**This Guide**: Adds visualization dashboards and advanced metrics

---

## 🎯 Monitoring Solution Comparison

| Solution | Type | Cost | Complexity | Best For |
|----------|------|------|------------|----------|
| **Render Metrics** | Built-in | Free | Low | Quick start, basic metrics |
| **Grafana + Prometheus** | Self-hosted | Free | Medium | Full control, open-source |
| **DataDog** | SaaS | $15+/host | Low | Enterprise, all-in-one |
| **New Relic** | SaaS | $99+/month | Low | APM focus, detailed traces |
| **Sentry Performance** | SaaS | $26+/month | Low | Already using Sentry |

---

## Option 1: Render Built-in Metrics (Quickest)

**Cost**: Free  
**Setup Time**: 5 minutes  
**Best For**: Getting started, basic monitoring

### Features
- CPU/Memory usage
- Request count and latency
- Error rate
- Deployment history

### Setup Steps

1. **Enable Metrics**:
   - Already enabled by default on Render
   - Go to: `https://dashboard.render.com/web/[service-id]/metrics`

2. **View Metrics**:
   - CPU Usage
   - Memory Usage
   - Request Count
   - Response Time (P50, P95, P99)

3. **Set Up Alerts** (Render Pro plan):
   - Dashboard → Service → Alerts
   - Configure thresholds:
     - CPU > 80%
     - Memory > 90%
     - Error rate > 1%

**Limitations**:
- ❌ No custom metrics
- ❌ Limited retention (7 days free, 30 days pro)
- ❌ Basic visualization
- ❌ No correlation across services

**Recommendation**: Good starting point, upgrade to full solution after launch.

---

## Option 2: Grafana + Prometheus (Recommended)

**Cost**: Free (self-hosted) or $49/month (Grafana Cloud)  
**Setup Time**: 2-4 hours  
**Best For**: Full control, customization, open-source

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Monitoring Stack                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐      ┌──────────────┐           │
│  │   Backend    │─────▶│  Prometheus  │           │
│  │   App        │      │  (Metrics)   │           │
│  └──────────────┘      └──────┬───────┘           │
│                               │                     │
│  ┌──────────────┐             │                     │
│  │  PostgreSQL  │─────────────┤                     │
│  └──────────────┘             │                     │
│                               │                     │
│  ┌──────────────┐             │                     │
│  │    Redis     │─────────────┤                     │
│  └──────────────┘             │                     │
│                               │                     │
│                               ▼                     │
│                      ┌──────────────┐               │
│                      │   Grafana    │               │
│                      │ (Dashboard)  │               │
│                      └──────────────┘               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Step 1: Install Prometheus Exporter in Backend

```bash
cd backend
npm install prom-client
```

**Create metrics service** (`backend/src/common/metrics.service.ts`):

```typescript
import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register: promClient.Registry;
  
  // Metrics
  public readonly httpRequestDuration: promClient.Histogram;
  public readonly httpRequestTotal: promClient.Counter;
  public readonly dbQueryDuration: promClient.Histogram;
  public readonly activeConnections: promClient.Gauge;
  
  constructor() {
    this.register = new promClient.Registry();
    
    // Default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({ register: this.register });
    
    // Custom metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });
    
    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });
    
    this.dbQueryDuration = new promClient.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['query_type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
    });
    
    this.activeConnections = new promClient.Gauge({
      name: 'db_active_connections',
      help: 'Number of active database connections',
    });
    
    // Register metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.dbQueryDuration);
    this.register.registerMetric(this.activeConnections);
  }
  
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
```

**Create metrics controller** (`backend/src/common/metrics.controller.ts`):

```typescript
import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}
  
  @Get()
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
```

### Step 2: Create Prometheus Configuration

**File**: `infra/prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'crm-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Step 3: Add to Docker Compose

**File**: `docker-compose.monitoring.yml`

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: crm-prometheus
    volumes:
      - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    ports:
      - "9090:9090"
    networks:
      - crm-network
    restart: unless-stopped
  
  grafana:
    image: grafana/grafana:latest
    container_name: crm-grafana
    ports:
      - "3003:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=CHANGE_THIS_PASSWORD
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./infra/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./infra/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - crm-network
    restart: unless-stopped
  
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: crm-postgres-exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://postgres:password@postgres:5432/crm?sslmode=disable"
    ports:
      - "9187:9187"
    networks:
      - crm-network
    restart: unless-stopped
  
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: crm-redis-exporter
    environment:
      REDIS_ADDR: "redis:6379"
    ports:
      - "9121:9121"
    networks:
      - crm-network
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:

networks:
  crm-network:
    external: true
```

### Step 4: Start Monitoring Stack

```bash
# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify Prometheus
open http://localhost:9090

# Verify Grafana
open http://localhost:3003
# Login: admin / CHANGE_THIS_PASSWORD
```

### Step 5: Import Grafana Dashboards

1. **Login to Grafana**: http://localhost:3003

2. **Add Prometheus Data Source**:
   - Configuration → Data Sources → Add data source
   - Select "Prometheus"
   - URL: `http://prometheus:9090`
   - Save & Test

3. **Import Pre-built Dashboards**:
   - Dashboards → Import
   - Use dashboard IDs:
     - **1860**: Node Exporter (system metrics)
     - **3662**: Prometheus 2.0 Overview
     - **9628**: PostgreSQL Database
     - **763**: Redis Dashboard

4. **Custom CRM Dashboard**:
   - Create new dashboard
   - Add panels for:
     - Request rate (requests/second)
     - Response time (P50, P95, P99)
     - Error rate
     - Active users
     - Database connections
     - Cache hit ratio

**Pre-built Dashboard**: See `infra/grafana/dashboards/crm-overview.json`

### Step 6: Configure Alerting

**File**: `infra/grafana/alerting/rules.yml`

```yaml
groups:
  - name: crm_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"
      
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time"
          description: "P95 response time is {{ $value }}s"
      
      - alert: HighCPU
        expr: rate(process_cpu_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
      
      - alert: DatabaseConnectionsHigh
        expr: db_active_connections > 15
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
```

---

## Option 3: DataDog (Enterprise)

**Cost**: $15/host/month (Infrastructure) + $31/host/month (APM)  
**Setup Time**: 30 minutes  
**Best For**: Enterprise, all-in-one solution

### Features
- ✅ Full-stack observability
- ✅ APM (Application Performance Monitoring)
- ✅ Log aggregation
- ✅ Real user monitoring (RUM)
- ✅ Synthetic monitoring
- ✅ 400+ integrations

### Setup Steps

1. **Sign up**: https://www.datadoghq.com

2. **Install DataDog Agent**:

```dockerfile
# Add to backend/Dockerfile.prod
RUN wget -O /tmp/datadog-agent.deb https://s3.amazonaws.com/dd-agent/datadog-agent_7_amd64.deb
RUN dpkg -i /tmp/datadog-agent.deb
```

3. **Configure Environment Variables**:

```env
DD_API_KEY=your_datadog_api_key
DD_SITE=datadoghq.com
DD_SERVICE=crm-backend
DD_ENV=production
DD_VERSION=1.0.0
DD_LOGS_ENABLED=true
DD_APM_ENABLED=true
```

4. **Install APM Library**:

```bash
npm install dd-trace
```

**File**: `backend/src/main.ts` (add at top):

```typescript
import tracer from 'dd-trace';
tracer.init({
  logInjection: true,
});
```

5. **View Dashboards**:
   - APM → Services → crm-backend
   - Infrastructure → Host Map
   - Logs → Log Explorer

---

## Option 4: New Relic (APM Focus)

**Cost**: $99/month (Standard) or $349/month (Pro)  
**Setup Time**: 30 minutes  
**Best For**: Deep application insights, distributed tracing

### Setup

1. **Sign up**: https://newrelic.com

2. **Install Agent**:

```bash
npm install newrelic
```

3. **Configure** (`newrelic.js`):

```javascript
exports.config = {
  app_name: ['CRM Backend'],
  license_key: 'YOUR_LICENSE_KEY',
  logging: {
    level: 'info'
  },
  distributed_tracing: {
    enabled: true
  }
}
```

4. **Import in** `main.ts`:

```typescript
require('newrelic');
```

---

## 🎯 Recommended Approach

### Phase 1: Launch (Current)
✅ **Use existing infrastructure**:
- Health check endpoint (`/health`)
- Sentry error tracking
- Render built-in metrics

**Cost**: $0 additional  
**Effort**: 0 hours (already implemented)

### Phase 2: Week 1-2 Post-Launch
🔄 **Add basic monitoring**:
- Set up Grafana + Prometheus (Option 2)
- Import pre-built dashboards
- Configure basic alerts

**Cost**: $0 (self-hosted)  
**Effort**: 4 hours

### Phase 3: Month 2-3 (Growth)
📈 **Upgrade to enterprise solution**:
- Evaluate DataDog or New Relic
- Add APM for deep insights
- Set up synthetic monitoring

**Cost**: $500-1000/month  
**Effort**: 2 hours (migration)

---

## ✅ Monitoring Checklist

**Current (Implemented)**:
- [x] Health check endpoint
- [x] Sentry error tracking
- [x] Query performance tracking
- [x] Slow query alerting

**Phase 2 (Recommended)**:
- [ ] Prometheus metrics endpoint
- [ ] Grafana dashboards
- [ ] Alert rules configured
- [ ] Slack/Email notifications

**Phase 3 (Optional)**:
- [ ] APM tracing
- [ ] Log aggregation
- [ ] Real user monitoring
- [ ] Synthetic monitoring

---

## 📚 Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/)
- [DataDog Getting Started](https://docs.datadoghq.com/getting_started/)
- [New Relic Docs](https://docs.newrelic.com/)
- [Sentry Performance](https://docs.sentry.io/product/performance/)

---

**Status**: Optional - can be added post-launch  
**Priority**: LOW (health checks + Sentry sufficient for launch)  
**Recommendation**: Launch with existing monitoring, add Grafana within 2 weeks
