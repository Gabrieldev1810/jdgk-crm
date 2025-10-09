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

### Option 1: Use the Startup Script (Recommended)
```powershell
# Run this PowerShell script to start everything
.\start-crm.ps1
```

### Option 2: Manual Start
```bash
# Terminal 1: Start Backend
cd backend
npm run start:dev

# Terminal 2: Start Frontend (Main CRM)
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

## 🐛 Troubleshooting

### Port Issues
If ports are occupied, the system will automatically try alternative ports.

### RBAC Issues  
The RBAC system uses the main API client - no direct fetch calls.

### Authentication
Login with your assigned credentials. The system supports JWT tokens with refresh capabilities.