#!/bin/bash

# Create .env file with your credentials
cat > .env << 'EOF'
# Pipedrive Configuration
PIPEDRIVE_API_TOKEN=01df8bc1a848e4b3f55d6e2a79f9a62557a66510

# Asana Configuration
ASANA_CLIENT_ID=1211767256476624
ASANA_CLIENT_SECRET=cd476c0d2493fa6a4a78980b98648cfe
ASANA_ACCESS_TOKEN=2/119578449411707/1211767717009213:0bebfc748959ea831799a526ff15a9eb
ASANA_WORKSPACE_ID=308803216953534
# Database Configuration (PostgreSQL is now running!)
DATABASE_URL=postgresql://roberttepass@localhost:5432/pipedrive_sync

# Webhook Security
WEBHOOK_SECRET=pipedrive_asana_sync_secret_2024

# Environment
STAGE=dev
NODE_ENV=development
EOF

echo "✅ .env file created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Get your Asana Personal Access Token from: https://app.asana.com/0/my-apps"
echo "2. Get your Asana Workspace ID by running:"
echo "   curl https://app.asana.com/api/1.0/workspaces -H \"Authorization: Bearer YOUR_TOKEN\""
echo "3. Edit .env and replace:"
echo "   - ASANA_ACCESS_TOKEN"
echo "   - ASANA_WORKSPACE_ID"
echo ""
echo "✅ Database is ready: postgresql://roberttepass@localhost:5432/pipedrive_sync"
echo "✅ Pipedrive API token is configured"

