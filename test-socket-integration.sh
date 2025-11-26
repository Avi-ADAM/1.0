#!/bin/bash

# Test Socket Integration Script
# This script tests the complete socket integration flow

echo "🧪 Testing Socket Integration for Lev Page"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Socket Server is running
echo "1️⃣  Checking Socket Server..."
SOCKET_RESPONSE=$(curl -s http://localhost:3001/health)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Socket Server is running${NC}"
    echo "   Response: $SOCKET_RESPONSE"
else
    echo -e "${RED}❌ Socket Server is NOT running${NC}"
    echo -e "${YELLOW}   Please start it with: cd socket-server && npm run dev${NC}"
    exit 1
fi

echo ""

# Check Socket Server stats
echo "2️⃣  Getting Socket Server stats..."
STATS=$(curl -s http://localhost:3001/stats)
echo "   $STATS"

echo ""

# Test broadcast endpoint
echo "3️⃣  Testing broadcast endpoint..."
BROADCAST_TEST=$(curl -s -X POST http://localhost:3001/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["test-user-1", "test-user-2"],
    "notification": {
      "actionKey": "test",
      "title": {"he": "בדיקה", "en": "Test"},
      "body": {"he": "זוהי בדיקה", "en": "This is a test"},
      "updateStrategy": {"type": "none"}
    }
  }')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Broadcast endpoint is working${NC}"
    echo "   Response: $BROADCAST_TEST"
else
    echo -e "${RED}❌ Broadcast endpoint failed${NC}"
    exit 1
fi

echo ""

# Check if main app is running
echo "4️⃣  Checking main application..."
APP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)

if [ "$APP_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Main application is running${NC}"
else
    echo -e "${YELLOW}⚠️  Main application might not be running (HTTP $APP_RESPONSE)${NC}"
    echo -e "${YELLOW}   Please start it with: npm run dev${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Open http://localhost:5173/lev in one tab"
echo "   2. Open http://localhost:5173/test-lev-socket in another tab"
echo "   3. Click 'דמה התראה' in the test page"
echo "   4. Check that notification appears in the lev page"
echo ""
echo "🔍 Debugging:"
echo "   - Socket Server logs: Check the terminal where socket-server is running"
echo "   - Browser console: Open DevTools (F12) in both tabs"
echo "   - Network tab: Check WebSocket connection status"
echo ""
