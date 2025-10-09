#!/usr/bin/env pwsh

# Change to backend directory
Set-Location -Path "backend"

# Install dependencies if needed
Write-Host "Installing backend dependencies..."
npm install

# Generate Prisma client
Write-Host "Generating Prisma client..."
npx prisma generate

# Run migrations
Write-Host "Running database migrations..."
npx prisma migrate dev

# Start the development server
Write-Host "Starting backend server..."
npm run start:dev