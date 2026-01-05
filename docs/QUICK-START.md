# 🚀 Quick Start Guide - Dial-Craft CRM

## Single Command Startup ✨

### Development Mode (Both Frontend & Backend)
```bash
npm run dev
```

This single command will:
- ✅ Start NestJS backend on `http://localhost:3000`
- ✅ Start React frontend on `http://localhost:8081`
- ✅ Show color-coded logs (Blue=Backend, Green=Frontend)
- ✅ Auto-reload on file changes

---

## First Time Setup

```bash
# 1. Install all dependencies
npm run install:all

# 2. Generate Prisma client
npm run db:generate

# 3. Run database migrations
npm run db:migrate

# 4. (Optional) Seed database
npm run db:seed

# 5. Start development
npm run dev
```

---

## Other Useful Commands

### Development
```bash
npm run dev              # Start both frontend & backend
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only
```

### Production Build
```bash
npm run build            # Build both projects
npm run start            # Start production build
```

### Database
```bash
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio GUI
npm run db:generate      # Generate Prisma client
```

### Code Quality
```bash
npm run lint             # Lint both projects
npm run clean            # Clean all artifacts
```

---

## 🌐 Access URLs

- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Prisma Studio**: http://localhost:5555 (when running db:studio)

---

## 🔧 Troubleshooting

### "Port already in use"
- Frontend auto-assigns next available port (8082, 8083, etc.)
- Backend uses port 3000 (change in backend/.env if needed)

### "Cannot find module"
```bash
npm run clean
npm run install:all
npm run db:generate
```

### Database issues
```bash
npm run db:migrate
npm run db:seed
```

### ESM/CommonJS issues
- Backend uses CommonJS (NestJS default)
- Frontend uses ESM (Vite default)
- They run in separate processes, so no conflicts

---

## 💡 Tips

1. **Watch logs in real-time**: Both services show colored output
2. **Stop services**: `Ctrl+C` stops both at once
3. **Development workflow**: Just run `npm run dev` and code!
4. **Docker**: Use `docker-compose up` for containerized deployment

---

## 📝 Environment Variables

Make sure you have:
- `backend/.env` configured (copy from `.env.example`)
- Database connection string set
- JWT secrets configured

---

**Happy Coding! 🎉**
