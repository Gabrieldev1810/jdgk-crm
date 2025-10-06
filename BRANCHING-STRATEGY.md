# Git Branching Strategy - Dial-Craft CRM

## Current Branch Structure

### 🚀 Production Branch: `main`
- **Status**: Deployed on Coolify
- **Purpose**: Stable, production-ready code
- **Protection**: Should only receive tested code via pull requests
- **Deployment**: Automatically deploys to production environment

### 🔧 Development Branch: `development`
- **Status**: Active development ✅ (Current branch)
- **Purpose**: Integration branch for new features and updates  
- **Testing**: All new features should be tested here before merging to main
- **Workflow**: Safe environment for breaking changes and experiments

## Branching Workflow

### For New Features:
```bash
# From development branch
git checkout development
git pull origin development
git checkout -b feature/feature-name
# ... make changes ...
git add .
git commit -m "feat: add new feature"
git push origin feature/feature-name
# Create PR: feature/feature-name → development
```

### For Bug Fixes:
```bash
# From development branch  
git checkout development
git pull origin development
git checkout -b fix/bug-description
# ... fix the bug ...
git add .
git commit -m "fix: resolve bug description"
git push origin fix/bug-description
# Create PR: fix/bug-description → development
```

### For Production Releases:
```bash
# After testing in development
git checkout main
git pull origin main
git merge development
git push origin main
# This will trigger production deployment
```

## Branch Protection Rules (Recommended)

### Main Branch Protection:
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Restrict pushes to main branch
- ✅ Require branches to be up to date

### Development Branch:
- ✅ Allow direct pushes for rapid development
- ✅ Regular integration point for features
- ✅ Testing ground before production

## Current Deployment Status

### Production Environment (main branch):
- **Platform**: Coolify
- **Backend**: NestJS API on port 3001
- **Frontend**: React app on port 3000
- **Database**: SQLite with Prisma
- **Health Checks**: Configured and working
- **SSL**: Auto-generated via Coolify

### Development Environment (development branch):
- **Status**: Ready for new features
- **Testing**: Safe to experiment
- **Breaking Changes**: Allowed and expected
- **Integration**: Staging point before production

## Recommended Workflow Steps

### 1. Daily Development:
```bash
# Start your work session
git checkout development
git pull origin development

# Create feature branch if needed
git checkout -b feature/your-feature-name
```

### 2. Making Changes:
```bash
# After making changes
git add .
git commit -m "descriptive commit message"
git push origin current-branch-name
```

### 3. Integration Testing:
```bash
# Merge feature to development for testing
git checkout development
git merge feature/your-feature-name
git push origin development
```

### 4. Production Release:
```bash
# Only after thorough testing
git checkout main
git merge development
git push origin main
# Production deployment happens automatically
```

## Emergency Hotfix Process

### For Critical Production Issues:
```bash
# Create hotfix directly from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# ... fix the issue ...
git add .
git commit -m "hotfix: resolve critical production issue"
git push origin hotfix/critical-issue

# Merge to main immediately
git checkout main
git merge hotfix/critical-issue
git push origin main

# Also merge to development to keep in sync
git checkout development
git merge hotfix/critical-issue
git push origin development
```

## Benefits of This Strategy

✅ **Production Stability**: Main branch always deployable  
✅ **Safe Development**: Development branch for experimentation  
✅ **Easy Rollback**: Can revert development without affecting production  
✅ **Continuous Integration**: Regular merging prevents conflicts  
✅ **Team Collaboration**: Clear workflow for multiple developers  

## Next Steps

1. **Continue Development**: You're now on the `development` branch
2. **Create Features**: Use feature branches for specific updates
3. **Test Thoroughly**: Use development branch for integration testing
4. **Deploy When Ready**: Merge to main only after testing
5. **Monitor Production**: Keep main branch stable and monitored

Your production deployment on Coolify will remain stable while you develop new features safely on the development branch! 🚀