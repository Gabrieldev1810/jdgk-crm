# Dial```
dial-craft/
├── frontend/             # 📱 MAIN CRM UI (Complete React + TypeScript + Shadcn)
├── backend/              # 🔧 NestJS Backend API  
└── start-crm.ps1        # 🚀 Startup script
```RM

A comprehensive Call Center Management System with RBAC (Role-Based Access Control).

## 🏗️ Project Structure

```
dial-craft/
├── frontend/             # 📱 Main CRM UI (React + TypeScript + Shadcn)
├── backend/              # 🔧 NestJS Backend API  
├── src/                  # � Additional RBAC components
├── public/              # � Static assets
└── start-crm.ps1       # 🚀 Startup script
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL database

### Initial Setup
```bash
# Install all dependencies (first time only)
npm run install:all

# Or install root dependencies and run workspaces
npm install
```

### Development Mode (Recommended)
```bash
# Start both backend and frontend with one command
npm run dev
```

This will run:
- **Backend API** on `http://localhost:3000`
- **Frontend UI** on `http://localhost:8081` (or next available port)

### Alternative: Manual Start
```bash
# Terminal 1: Start Backend
cd backend
npm run start:dev

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

## 🌐 Application URLs

- **Main CRM UI**: http://localhost:8081/
- **Backend API**: http://localhost:3000/
- **API Documentation**: http://localhost:3000/api/docs

## ✅ Key Features

- **Dashboard**: Real-time metrics and analytics
- **Account Management**: Create, edit, and manage customer accounts
- **Call Management**: Track calls, recordings, and dispositions  
- **User Management**: Manage agents, supervisors, and administrators
- **Role Management**: RBAC system with granular permissions
- **Bulk Upload**: CSV import for accounts and data
- **Audit Logs**: Complete activity tracking
- **Reports**: Comprehensive reporting system

## 🔐 RBAC Permissions

The system includes 13 permissions across 6 categories:
- **Account Management**: create, view, update accounts
- **Call Management**: create, view call records  
- **User Management**: view, manage users
- **System**: admin access
- **Dispositions**: manage call outcomes
- **Upload Data**: bulk import capabilities
- **Reports and Audit Logs**: analytics access

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for development
- TailwindCSS + Shadcn/UI
- React Router for navigation

### Backend  
- NestJS (Node.js framework)
- Prisma ORM
- PostgreSQL database
- JWT authentication

## 📝 Important Notes

- **Single UI**: This project uses ONE main CRM interface (not multiple frontends)
- **Port Configuration**: Frontend auto-assigns ports (8081, 8082, etc.)
- **API Integration**: All services use the centralized API client
- **RBAC**: Comprehensive role and permission system implemented

## 📦 Available Commands

### Root Level Commands
- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build both projects for production
- `npm run start` - Start both projects in production mode
- `npm run install:all` - Install all dependencies
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio
- `npm run lint` - Lint both projects
- `npm run clean` - Clean all build artifacts and node_modules

### Backend Only
- `npm run dev:backend` - Start backend only
- `npm run build:backend` - Build backend only

### Frontend Only
- `npm run dev:frontend` - Start frontend only
- `npm run build:frontend` - Build frontend only

## 🐛 Troubleshooting

### Port Issues
If ports are occupied, the system will automatically try alternative ports.

### RBAC Issues  
The RBAC system uses the main API client - no direct fetch calls.

### Authentication
Login with your assigned credentials. The system supports JWT tokens with refresh capabilities.

### First Time Setup
If you encounter issues, try:
```bash
npm run clean
npm run install:all
npm run db:generate
npm run dev
```