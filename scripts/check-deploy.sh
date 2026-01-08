#!/bin/bash
# Deployment Status Checker for Headwaters
# Usage: ./scripts/check-deploy.sh

set -e

echo "=== Deployment Status Check ==="
echo ""

# Local version
LOCAL_VERSION=$(cat VERSION 2>/dev/null || echo "unknown")
echo "Local version: $LOCAL_VERSION"

# Check latest git commit
LATEST_COMMIT=$(git log -1 --format="%h %s" 2>/dev/null || echo "unknown")
echo "Latest commit: $LATEST_COMMIT"

# Check if there are uncommitted changes
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -gt 0 ]; then
  echo "Uncommitted changes: $UNCOMMITTED files"
else
  echo "Working directory: clean"
fi

# Check if local is ahead of origin
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
if [ "$AHEAD" -gt 0 ]; then
  echo "Local ahead of origin: $AHEAD commits (need to push)"
else
  echo "Local synced with origin"
fi

echo ""
echo "--- Production Check ---"

# Fetch production debug endpoint
PROD_RESPONSE=$(curl -s --max-time 10 "https://thejar.vercel.app/api/debug" 2>/dev/null || echo '{"error":"failed to fetch"}')

# Check if we got a valid response
if echo "$PROD_RESPONSE" | grep -q "error"; then
  echo "Production: Unable to reach (may need to login)"
else
  ROCKS_COUNT=$(echo "$PROD_RESPONSE" | grep -o '"count":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "?")
  echo "Production rocks visible (via debug API): $ROCKS_COUNT"
fi

echo ""
echo "--- Quick Actions ---"
echo "  Push changes:  git push"
echo "  Hard refresh:  Cmd+Shift+R in browser"
echo "  Check logs:    vercel logs --follow"
echo ""
echo "=== Done ==="
