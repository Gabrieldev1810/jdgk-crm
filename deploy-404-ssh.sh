#!/bin/bash

# Digital Edge Solutions 404 Page SSH Deployment Script
# Usage: ./deploy-404-ssh.sh username@your-server

if [ $# -eq 0 ]; then
    echo "Usage: $0 username@server-address"
    echo "Example: $0 root@your-server.com"
    exit 1
fi

SERVER=$1
TEMP_DIR="404-deployment-$(date +%Y%m%d-%H%M%S)"

echo "🚀 Starting 404 page deployment to $SERVER"

# Create temporary deployment directory
echo "📁 Preparing files..."
mkdir $TEMP_DIR
cp public/404.html $TEMP_DIR/
cp backend/src/common/filters/not-found-exception.filter.ts $TEMP_DIR/
cp backend/src/main.ts $TEMP_DIR/
cp frontend/nginx.conf $TEMP_DIR/

echo "📤 Uploading files to server..."
scp -r $TEMP_DIR/ $SERVER:/tmp/

echo "🔧 Configuring server..."
ssh $SERVER << 'EOF'
    echo "Finding Docker containers..."
    BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -i backend | head -1)
    FRONTEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -i frontend | head -1)
    
    if [ -z "$BACKEND_CONTAINER" ]; then
        echo "❌ Backend container not found"
        exit 1
    fi
    
    if [ -z "$FRONTEND_CONTAINER" ]; then
        echo "❌ Frontend container not found"
        exit 1
    fi
    
    echo "📦 Found containers:"
    echo "  Backend: $BACKEND_CONTAINER"
    echo "  Frontend: $FRONTEND_CONTAINER"
    
    # Get the temp directory name
    TEMP_DIR=$(ls /tmp/ | grep 404-deployment | head -1)
    
    echo "🔄 Copying files to containers..."
    
    # Copy to backend container
    docker cp /tmp/$TEMP_DIR/404.html $BACKEND_CONTAINER:/app/public/404.html
    docker exec $BACKEND_CONTAINER mkdir -p /app/src/common/filters
    docker cp /tmp/$TEMP_DIR/not-found-exception.filter.ts $BACKEND_CONTAINER:/app/src/common/filters/
    docker cp /tmp/$TEMP_DIR/main.ts $BACKEND_CONTAINER:/app/src/main.ts
    
    # Copy to frontend container
    docker cp /tmp/$TEMP_DIR/nginx.conf $FRONTEND_CONTAINER:/etc/nginx/conf.d/default.conf
    
    echo "🔄 Restarting containers..."
    docker restart $BACKEND_CONTAINER
    docker restart $FRONTEND_CONTAINER
    
    echo "🧹 Cleaning up..."
    rm -rf /tmp/$TEMP_DIR
    
    echo "✅ Deployment complete!"
    echo "🌐 Test your 404 pages:"
    echo "  Web: http://your-domain.com/nonexistent-page"
    echo "  API: http://your-domain.com/api/nonexistent-endpoint"
EOF

# Cleanup local temp directory
rm -rf $TEMP_DIR

echo "🎉 404 page deployment completed successfully!"
echo "💡 Your Digital Edge Solutions 404 page is now active!"