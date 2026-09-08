#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  🌙 Midnight Sanctuary v2 — One-command setup
#  Run:  chmod +x SETUP.sh && ./SETUP.sh
# ─────────────────────────────────────────────────────────────

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}"
echo "  🌙 Midnight Sanctuary v2 Setup"
echo "  ================================"
echo -e "${NC}"

# ── Node version check ─────────────────────────────────────────
NODE_VER=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VER" ] || [ "$NODE_VER" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ required. Install from https://nodejs.org${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# ── Server setup ───────────────────────────────────────────────
echo -e "\n${YELLOW}📦 Installing server dependencies...${NC}"
cd server && npm install && cd ..
echo -e "${GREEN}✅ Server dependencies installed${NC}"

# ── Client setup ───────────────────────────────────────────────
echo -e "\n${YELLOW}📦 Installing client dependencies...${NC}"
cd client && npm install && cd ..
echo -e "${GREEN}✅ Client dependencies installed${NC}"

# ── .env setup ────────────────────────────────────────────────
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo -e "\n${YELLOW}⚠️  Created server/.env from .env.example"
  echo -e "   Edit server/.env and add your MONGO_URI and other keys!${NC}"
else
  echo -e "${GREEN}✅ server/.env already exists${NC}"
fi

# ── Done ──────────────────────────────────────────────────────
echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo ""
echo "  To run in development:"
echo ""
echo -e "  ${BLUE}Terminal 1 (Server):${NC}"
echo "    cd server && npm run dev"
echo ""
echo -e "  ${BLUE}Terminal 2 (Client):${NC}"
echo "    cd client && npm run dev"
echo ""
echo "  Then open: http://localhost:5173"
echo ""
echo -e "${YELLOW}  Remember to set MONGO_URI in server/.env before starting!${NC}"
echo ""
