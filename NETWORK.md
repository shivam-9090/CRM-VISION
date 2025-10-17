# Network Configuration Guide

## Cross-Platform Access Setup

### Finding Your IP Address

**Windows:**
```cmd
ipconfig | findstr IPv4
```

**Linux/Mac:**
```bash
hostname -I
# or
ifconfig | grep inet
```

**Alternative (any OS):**
```bash
node -e "console.log(require('os').networkInterfaces())"
```

### Frontend Configuration

1. **Edit** `frontend/.env.local`:
```env
# Replace localhost with your actual IP
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001/api
```

2. **Common IP Ranges:**
   - Home networks: `192.168.x.x`
   - Corporate networks: `10.x.x.x` or `172.16-31.x.x`

### Backend Configuration

The backend is already configured to accept connections from any IP:
- Listens on `0.0.0.0:3001` (all interfaces)
- CORS configured for local networks
- No additional changes needed

### Firewall Configuration

**Windows Firewall:**
```cmd
# Allow port 3000 (frontend)
netsh advfirewall firewall add rule name="CRM Frontend" dir=in action=allow protocol=TCP localport=3000

# Allow port 3001 (backend)
netsh advfirewall firewall add rule name="CRM Backend" dir=in action=allow protocol=TCP localport=3001
```

**Linux (ufw):**
```bash
sudo ufw allow 3000
sudo ufw allow 3001
```

**macOS:**
- System Preferences → Security & Privacy → Firewall → Options
- Add ports 3000 and 3001

### Testing Connection

1. **From host machine:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **From other device:**
   ```bash
   curl http://YOUR_IP:3001/api/health
   ```

### Troubleshooting

**Connection Refused:**
- Check if services are running: `netstat -an | findstr :3001`
- Verify firewall settings
- Ensure IP address is correct

**CORS Errors:**
- Backend CORS is pre-configured for local networks
- If issues persist, check `backend/src/main.ts`

**Docker Network Issues:**
```bash
# Check Docker networks
docker network ls

# Inspect CRM network
docker network inspect crm_01_crm-network
```