#!/bin/bash

set -e

echo "🚀 EnvBox Setup Script"
echo "======================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    
    # Update .env with generated secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
        sed -i '' "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=${ENCRYPTION_KEY}|" .env
    else
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
        sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=${ENCRYPTION_KEY}|" .env
    fi
    
    echo "✅ .env file created with generated secrets"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start MongoDB: docker run -d -p 27017:27017 --name mongodb mongo:latest"
echo "2. Run development server: npm run dev"
echo ""
echo "Or use Docker Compose:"
echo "docker-compose up"
