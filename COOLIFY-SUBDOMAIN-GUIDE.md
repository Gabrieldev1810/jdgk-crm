# Coolify Subdomain Configuration Guide

## Custom Domain Setup for Dial-Craft CRM

### 1. DNS Configuration (Required)

#### If you own a domain:
```dns
Type: A Record
Name: dial-craft-crm (or your preferred name)
Target: [Your Coolify Server IP Address]
TTL: 300

Result: dial-craft-crm.yourdomain.com
```

#### Alternative CNAME setup:
```dns
Type: CNAME
Name: dial-craft-crm
Target: your-coolify-server.domain.com
TTL: 300
```

### 2. Coolify Dashboard Configuration

1. **Navigate to**: Your Project → Settings → Domains
2. **Add Domain**: `dial-craft-crm.yourdomain.com`
3. **Enable Features**:
   - ✅ Auto-generate SSL Certificate (Let's Encrypt)
   - ✅ Force HTTPS Redirect
   - ✅ WWW Redirect (optional)

### 3. Environment Variables for Production

Update these in Coolify's environment settings:

```env
# Production Domain Settings
FRONTEND_URL=https://dial-craft-crm.yourdomain.com
BACKEND_URL=https://dial-craft-crm.yourdomain.com/api

# SSL and Security
NODE_ENV=production
FORCE_HTTPS=true

# CORS Origins (add your domain)
ALLOWED_ORIGINS=https://dial-craft-crm.yourdomain.com,https://yourdomain.com

# JWT Settings for Production
JWT_SECRET=your-super-secure-production-jwt-secret-key-minimum-32-characters
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

### 4. Example Domain Configurations

#### Professional Setup:
- `crm.yourbusiness.com`
- `dialcraft.yourbusiness.com`
- `callcenter.yourbusiness.com`

#### Staging Setup:
- `crm-staging.yourbusiness.com`
- `dialcraft-dev.yourbusiness.com`
- `test-crm.yourbusiness.com`

### 5. Free Subdomain Options (For Testing)

If you don't have a custom domain:

#### Option A: No-IP (Free)
1. Sign up at no-ip.com
2. Create hostname: `yourapp.ddns.net`
3. Use their DNS service

#### Option B: DuckDNS (Free)
1. Visit duckdns.org
2. Create: `yourapp.duckdns.org`
3. Update DNS automatically

#### Option C: Coolify Default
If your Coolify instance supports it:
- Format: `your-app.coolify-instance.domain.com`
- Check with your Coolify admin

### 6. SSL Certificate Setup

Coolify automatically handles SSL via Let's Encrypt:

1. **Automatic**: When you add a custom domain
2. **Verification**: DNS must be properly configured first
3. **Renewal**: Handled automatically by Coolify

### 7. Testing Your Subdomain

Once configured, test these endpoints:

```bash
# Health Check
curl https://your-subdomain.domain.com/api/health

# Frontend
curl https://your-subdomain.domain.com/

# API Documentation
curl https://your-subdomain.domain.com/api/docs
```

### 8. Common Issues & Solutions

#### DNS Propagation
- Wait 5-15 minutes for DNS changes
- Use `nslookup your-subdomain.domain.com` to verify

#### SSL Certificate Issues
- Ensure DNS is working first
- Check Coolify logs for certificate generation
- Verify domain ownership

#### CORS Errors
- Update `ALLOWED_ORIGINS` environment variable
- Include both www and non-www versions

### 9. Production Checklist

- [ ] Domain purchased and DNS configured
- [ ] A/CNAME record pointing to Coolify server
- [ ] Custom domain added in Coolify
- [ ] SSL certificate generated successfully
- [ ] Environment variables updated
- [ ] CORS origins configured
- [ ] Health checks passing
- [ ] Frontend loads correctly
- [ ] API endpoints accessible

### Example: Complete Setup

If your domain is `mybusiness.com`:

1. **DNS Record**: `dial-craft.mybusiness.com` → `your-coolify-ip`
2. **Coolify Domain**: `dial-craft.mybusiness.com`
3. **Frontend URL**: `https://dial-craft.mybusiness.com`
4. **API Base**: `https://dial-craft.mybusiness.com/api`
5. **Health Check**: `https://dial-craft.mybusiness.com/api/health`

This setup provides a professional subdomain for your Dial-Craft CRM deployment.