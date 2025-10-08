# Dial-Craft CRM - Quick Start Guide

**Get up and running in 10 minutes!**

---

## 📋 Prerequisites

Ensure you have the following installed:

- ✅ **Node.js** 18+ ([Download](https://nodejs.org/))
- ✅ **npm** or **yarn** (comes with Node.js)
- ✅ **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- ✅ **Git** ([Download](https://git-scm.com/downloads))
- ⚡ **Docker** (Optional, for containerized setup)

---

## 🚀 Quick Start (Local Development)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Gabrieldev1810/jdgk-crm.git
cd jdgk-crm
```

### Step 2: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/dialcraft"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run db:seed

# Start backend server
npm run start:dev
```

**Backend will run on**: http://localhost:3000  
**API Documentation**: http://localhost:3000/docs

### Step 3: Setup Frontend

```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.development.example .env.development

# Edit .env.development with backend URL
# VITE_API_URL=http://localhost:3000

# Start frontend server
npm run dev
```

**Frontend will run on**: http://localhost:8080 or http://localhost:5173

### Step 4: Access the Application

1. Open browser: http://localhost:8080
2. **Login** with default credentials (if seeded):
   - Email: `admin@dialcraft.com`
   - Password: `Admin@123` (check seed file for actual credentials)

---

## 🐳 Quick Start (Docker)

### Using Docker Compose

```bash
# From project root
docker-compose up -d

# Wait for services to start (30-60 seconds)

# Run migrations (first time only)
docker-compose exec backend npx prisma migrate deploy

# Seed database (optional)
docker-compose exec backend npm run db:seed
```

**Access**:
- Frontend: http://localhost:8080
- Backend: http://localhost:3000
- API Docs: http://localhost:3000/docs

**Stop containers**:
```bash
docker-compose down
```

---

## 🔑 Default Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@dialcraft.com | (check seed file) |
| Manager | manager@dialcraft.com | (check seed file) |
| Agent | agent@dialcraft.com | (check seed file) |

**⚠️ Security Note**: Change default passwords in production!

---

## 📂 Project Structure

```
jdgk-crm/
├── backend/              # NestJS backend application
│   ├── src/             # Source code
│   │   ├── auth/        # Authentication module
│   │   ├── users/       # User management
│   │   ├── accounts/    # Account management
│   │   ├── calls/       # Call logging
│   │   └── bulk-upload/ # CSV/Excel upload
│   ├── prisma/          # Database schema & migrations
│   ├── .env             # Environment variables
│   └── package.json     # Dependencies
│
├── frontend/            # React frontend application
│   ├── src/            # Source code
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   ├── services/   # API services
│   │   └── types/      # TypeScript types
│   ├── .env.development # Environment variables
│   └── package.json    # Dependencies
│
├── docker-compose.yaml  # Docker orchestration
├── prd.md              # Product requirements
├── plan.md             # Development plan
└── Task.md             # Detailed tasks
```

---

## 🛠️ Common Development Commands

### Backend

```bash
# Development server with hot reload
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dialcraft"
DIRECT_URL="postgresql://user:password@localhost:5432/dialcraft"

# JWT Authentication
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development

# Security
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

### Frontend Environment Variables

Create `frontend/.env.development`:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000

# App Configuration
VITE_APP_NAME="Dial-Craft CRM"
VITE_APP_VERSION="1.0.0"
```

---

## 🧪 Testing Your Setup

### 1. Check Backend Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-08T...",
  "database": "connected"
}
```

### 2. Test Authentication

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dialcraft.com","password":"your-password"}'
```

### 3. Access Frontend

Open http://localhost:8080 and verify:
- ✅ Login page loads
- ✅ Can login with credentials
- ✅ Dashboard displays
- ✅ Navigation works

---

## 🐛 Troubleshooting

### Backend won't start

**Problem**: `Error: Cannot find module 'xyz'`  
**Solution**: 
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Problem**: `Database connection failed`  
**Solution**: 
- Check PostgreSQL is running: `psql -U postgres -c "SELECT 1"`
- Verify DATABASE_URL in .env
- Check database exists: `createdb dialcraft`

**Problem**: `Prisma client not generated`  
**Solution**: 
```bash
cd backend
npx prisma generate
```

### Frontend won't start

**Problem**: `Module not found`  
**Solution**: 
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Problem**: `Port already in use`  
**Solution**: Change port in vite.config.ts or kill existing process

**Problem**: `CORS errors`  
**Solution**: Verify VITE_API_URL in .env.development matches backend URL

### Database Issues

**Problem**: `Migrations not applied`  
**Solution**: 
```bash
cd backend
npx prisma migrate reset  # Warning: Deletes all data!
npx prisma migrate dev
```

**Problem**: `Prisma Studio won't open`  
**Solution**: 
```bash
cd backend
npx prisma studio --port 5555
```

### Docker Issues

**Problem**: Containers won't start  
**Solution**: 
```bash
docker-compose down
docker-compose up --build
```

**Problem**: Database not accessible  
**Solution**: Wait 30 seconds for PostgreSQL to initialize on first run

---

## 📚 Next Steps

Once your setup is running:

1. **Explore the API** - Visit http://localhost:3000/docs
2. **Read Documentation** - Check `/prd.md` and `/plan.md`
3. **Review Tasks** - See `/Task.md` for development roadmap
4. **Check Frontend** - Explore all pages and features
5. **Test Features** - Create accounts, make calls, upload CSV

---

## 🎯 Quick Feature Tour

### 1. User Management
- Navigate to **User Management** page
- Create/edit/delete users
- Assign roles (Agent, Manager, Admin)

### 2. Account Management
- Go to **Accounts** page
- Create customer accounts
- Assign to agents
- Track status and priority

### 3. Call Logging
- Visit **Call Center** page
- Log calls with dispositions
- Track call duration and outcomes
- View call history

### 4. Bulk Upload
- Navigate to **Upload Data** page
- Download CSV template
- Upload customer accounts in bulk
- Track upload progress

### 5. Dashboards
- **Agent Dashboard** - Agent-specific metrics
- **Manager Dashboard** - Team performance
- **Admin Dashboard** - System overview

---

## 🔐 Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Update JWT secrets in .env
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure firewall rules
- [ ] Set up backup strategy
- [ ] Enable audit logging
- [ ] Review user permissions

---

## 💡 Tips & Best Practices

### Development
- Use Git branches for features
- Test before committing
- Keep dependencies updated
- Write meaningful commit messages
- Document complex logic

### Database
- Always backup before migrations
- Use Prisma Studio for data inspection
- Index frequently queried fields
- Monitor query performance

### Frontend
- Use React DevTools for debugging
- Check Network tab for API issues
- Test in different browsers
- Optimize images and assets

### Deployment
- Test in staging first
- Use environment-specific configs
- Monitor logs and errors
- Set up automated backups
- Plan for rollbacks

---

## 📞 Getting Help

### Documentation
- **PRD**: `/prd.md` - Product requirements
- **Plan**: `/plan.md` - Development plan
- **Tasks**: `/Task.md` - Task breakdown
- **Analysis**: `/PROJECT-ANALYSIS.md` - Project analysis

### Resources
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)

### Support
- Check existing issues
- Create GitHub issue
- Review documentation
- Search Stack Overflow

---

## ✅ Setup Verification Checklist

Before starting development, verify:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running
- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] Database migrations applied
- [ ] Can access API docs
- [ ] Can login to frontend
- [ ] All pages load correctly
- [ ] Can create/view/edit accounts
- [ ] Can upload CSV file
- [ ] Environment variables configured

---

**Congratulations!** 🎉 You're now ready to start developing with Dial-Craft CRM!

For detailed development information, see:
- `PROJECT-ANALYSIS.md` - Comprehensive project analysis
- `TECHNOLOGY-STACK.md` - Technology details
- `EXECUTION-PLAN.md` - Development timeline
