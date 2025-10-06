# 🚀 Coolify Deployment Guide for Dial-Craft CRM

Based on your Coolify configuration screenshot, here's the complete deployment setup:

## 📋 Coolify Configuration

### General Settings (As shown in your screenshot)
- **Name**: `gabrieldev181/dial-craft-main-work006408w2ccjg4c4ssao`
- **Description**: `crm staging`
- **Build Pack**: Docker Compose
- **Domain**: Set your domain in the Domains section
- **Ports Exposed**: 3000 (this will be automatically mapped by Coolify)

### 🌐 Network Configuration
- **Ports Exposed**: 3000 ✅ (Already configured in your screenshot)
- **Direction**: Allow www & non-www ✅
- **Port Mappings**: 3000:3000 ✅

## 🔧 Environment Variables to Add in Coolify

Go to **Environment Variables** tab and add these:

### Required Environment Variables
```bash
NODE_ENV=production
JWT_SECRET=dial-craft-super-secret-jwt-key-minimum-32-characters-production-2024
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
DATABASE_URL=file:./dev.db
FRONTEND_URL=https://your-domain.com
```

### Optional Environment Variables
```bash
PORT=3000
```

## 📁 Build Configuration

### Docker Settings (From your screenshot)
- **Base Directory**: `/` ✅
- **Publish Directory**: `/` ✅
- **Install Command**: (Leave empty - handled by Dockerfile)
- **Build Command**: (Leave empty - handled by Dockerfile) 
- **Start Command**: (Leave empty - handled by Dockerfile)

## 🔄 Deployment Process

### Step 1: Repository Setup
1. Your repository is already connected ✅
2. Make sure the main branch has all the Docker files we just created

### Step 2: Environment Variables
1. Click on **Environment Variables** in Coolify
2. Add all the variables listed above
3. **IMPORTANT**: Change the `JWT_SECRET` to a secure random string

### Step 3: Domain Configuration  
1. Go to **Domains** section
2. Add your domain (e.g., `crm-staging.yourdomain.com`)
3. Coolify will automatically handle SSL certificates

### Step 4: Deploy
1. Click **Deploy** button
2. Monitor the build logs
3. The deployment should take 3-5 minutes

## 🏗️ Service Architecture

```
Internet → Coolify Proxy → Nginx (Frontend) → NestJS API (Backend)
                                                      ↓
                                              SQLite Database (Volume)
```

## 🔍 Health Checks & Monitoring

### Health Endpoints
- **Backend Health**: `https://your-domain.com/api/health`
- **Frontend Health**: `https://your-domain.com/health`
- **API Documentation**: `https://your-domain.com/api/docs`

### Monitoring in Coolify
1. Check **Logs** tab for real-time application logs
2. Monitor **Deployments** for build status
3. Use **Terminal** for direct container access if needed

## 🗄️ Database Persistence

Your SQLite database will be persisted using Docker volumes:
- Volume: `backend_data:/app/prisma`
- This ensures data survives container restarts

## 🔐 Security Features

✅ **Implemented Security**:
- Helmet.js for security headers
- CORS properly configured
- JWT authentication
- Non-root user in containers
- Environment variable protection

## 🚨 Troubleshooting

### Common Issues:

1. **Build Fails**: 
   - Check logs in Coolify Deployments tab
   - Ensure all environment variables are set

2. **502 Bad Gateway**:
   - Backend might not be ready yet
   - Check health endpoint: `/api/health`

3. **CORS Errors**:
   - Update `FRONTEND_URL` environment variable with your domain

4. **Database Issues**:
   - SQLite file will be created automatically
   - Check volume mounts in logs

### Debug Commands (Use Coolify Terminal):
```bash
# Check backend status
wget -qO- http://localhost:3000/api/health

# Check database
ls -la /app/prisma/

# Check environment variables
env | grep NODE_ENV
```

## 🎯 Post-Deployment Checklist

- [ ] Frontend loads at your domain
- [ ] Backend API responds at `/api/health`
- [ ] Can login with demo credentials
- [ ] Account management works
- [ ] Call history modal functions
- [ ] Dark/light theme switching works

## 📞 Demo Credentials

After deployment, you can login with:
- **Admin**: `admin@bank.com` / `demo123`
- **Manager**: `manager@bank.com` / `demo123`  
- **Agent**: `agent@bank.com` / `demo123`

## 🔄 Future Upgrades

Once deployed, you can easily:
1. Switch to PostgreSQL database
2. Add Redis for sessions
3. Enable horizontal scaling
4. Add monitoring and alerting

Your Coolify setup looks perfect! Just add the environment variables and deploy! 🚀