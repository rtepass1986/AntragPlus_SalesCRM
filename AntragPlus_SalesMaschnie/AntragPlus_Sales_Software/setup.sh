#!/bin/bash

# ===================================
# AntragPlus Sales Software - Setup Script
# ===================================

set -e  # Exit on error

echo "🚀 Setting up AntragPlus Sales Software..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}📁 Creating directory structure...${NC}"
mkdir -p src/lead/{prompts,templates,utils,sync,data,logs,reports}
mkdir -p src/sync
mkdir -p src/automation
mkdir -p src/shared/{db,api,utils}
mkdir -p data/{leads,reports,logs}
mkdir -p docs/{lead-enricher,sync}
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

echo -e "${BLUE}📋 Copying Lead Enricher files...${NC}"
if [ -d "../AntragPlus_LeadMaschine/lead-enricher/src" ]; then
    cp -r ../AntragPlus_LeadMaschine/lead-enricher/src/*.ts src/lead/ 2>/dev/null || true
    cp -r ../AntragPlus_LeadMaschine/lead-enricher/src/prompts/* src/lead/prompts/ 2>/dev/null || true
    cp -r ../AntragPlus_LeadMaschine/lead-enricher/src/templates/* src/lead/templates/ 2>/dev/null || true
    cp -r ../AntragPlus_LeadMaschine/lead-enricher/src/utils/* src/lead/utils/ 2>/dev/null || true
    cp -r ../AntragPlus_LeadMaschine/lead-enricher/src/sync/* src/lead/sync/ 2>/dev/null || true
    cp ../AntragPlus_LeadMaschine/lead-enricher/config.ts src/shared/config-lead.ts 2>/dev/null || true
    cp ../AntragPlus_LeadMaschine/lead-enricher/src/data/leads.csv data/leads/ 2>/dev/null || true
    cp ../AntragPlus_LeadMaschine/lead-enricher/*.md docs/lead-enricher/ 2>/dev/null || true
    echo -e "${GREEN}✅ Lead Enricher files copied${NC}"
else
    echo -e "${YELLOW}⚠️  Lead Enricher source not found, skipping...${NC}"
fi
echo ""

echo -e "${BLUE}🔄 Copying Pipedrive Sales files...${NC}"
if [ -d "../Pipedrive_Salse/src" ]; then
    cp ../Pipedrive_Salse/src/*.ts src/sync/ 2>/dev/null || true
    cp ../Pipedrive_Salse/*.md docs/sync/ 2>/dev/null || true
    cp ../Pipedrive_Salse/*.js ./ 2>/dev/null || true
    echo -e "${GREEN}✅ Pipedrive Sales files copied${NC}"
else
    echo -e "${YELLOW}⚠️  Pipedrive Sales source not found, skipping...${NC}"
fi
echo ""

echo -e "${BLUE}📦 Installing dependencies...${NC}"
if command -v npm &> /dev/null; then
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  npm not found, please install Node.js and run 'npm install' manually${NC}"
fi
echo ""

echo -e "${BLUE}⚙️  Setting up environment file...${NC}"
if [ ! -f ".env" ]; then
    if [ -f "../Pipedrive_Salse/.env" ]; then
        cp ../Pipedrive_Salse/.env .env
        echo -e "${GREEN}✅ .env file copied from Pipedrive_Salse${NC}"
    else
        cp env.example .env
        echo -e "${YELLOW}⚠️  Created .env from template - please update with your credentials${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

echo -e "${BLUE}🔨 Building TypeScript...${NC}"
if command -v npm &> /dev/null; then
    npm run build 2>/dev/null && echo -e "${GREEN}✅ Build successful${NC}" || echo -e "${YELLOW}⚠️  Build failed - check for missing dependencies${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping build - npm not found${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo ""
echo "1. Update your .env file with credentials:"
echo "   nano .env"
echo ""
echo "2. Test lead enrichment (dry run):"
echo "   npm run lead:enrich:dry"
echo ""
echo "3. Test sync:"
echo "   npm run sync:test"
echo ""
echo "4. Deploy to AWS:"
echo "   npm run deploy"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - README.md - Main documentation"
echo "   - SETUP_INSTRUCTIONS.md - Detailed setup guide"
echo "   - docs/ - Additional documentation"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

