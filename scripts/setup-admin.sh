#!/bin/bash
# Setup script to make a user an org admin
# Usage: ./scripts/setup-admin.sh your@email.com

set -e

# Load environment variables
if [ -f .env.local ]; then
  source .env.local
else
  echo "Error: .env.local not found"
  exit 1
fi

EMAIL=$1

if [ -z "$EMAIL" ]; then
  echo "Usage: ./scripts/setup-admin.sh your@email.com"
  echo ""
  echo "First, go to http://localhost:3000/login and create an account."
  echo "Then run this script with your email to become an org admin."
  exit 1
fi

BASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo "Looking up user: $EMAIL"

# Get user ID from profiles table
USER_ID=$(curl -s "$BASE_URL/rest/v1/profiles?email=eq.$EMAIL&select=id" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -z "$USER_ID" ]; then
  echo ""
  echo "User not found. Make sure you:"
  echo "1. Go to http://localhost:3000/login"
  echo "2. Create an account with email: $EMAIL"
  echo "3. Then run this script again"
  exit 1
fi

echo "Found user: $USER_ID"

# Get the org ID (there should be one org already)
ORG_ID=$(curl -s "$BASE_URL/rest/v1/orgs?select=id&limit=1" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -z "$ORG_ID" ]; then
  echo "No org found. Creating one..."
  ORG_ID=$(curl -s "$BASE_URL/rest/v1/orgs" \
    -X POST \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d '{"name": "Headwaters", "slug": "headwaters"}' | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
  echo "Created org: $ORG_ID"
fi

echo "Org ID: $ORG_ID"

# Get team ID (there should be one team already)
TEAM_ID=$(curl -s "$BASE_URL/rest/v1/teams?org_id=eq.$ORG_ID&select=id&limit=1" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -z "$TEAM_ID" ]; then
  echo "No team found. Creating one..."
  TEAM_ID=$(curl -s "$BASE_URL/rest/v1/teams" \
    -X POST \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{\"org_id\": \"$ORG_ID\", \"name\": \"Default Team\", \"description\": \"Your first team\"}" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
  echo "Created team: $TEAM_ID"
fi

echo "Team ID: $TEAM_ID"

# Add user as org admin
echo "Adding user as org admin..."
curl -s "$BASE_URL/rest/v1/org_admins" \
  -X POST \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d "{\"org_id\": \"$ORG_ID\", \"user_id\": \"$USER_ID\"}" > /dev/null

# Add user as team manager
echo "Adding user as team manager..."
curl -s "$BASE_URL/rest/v1/team_memberships" \
  -X POST \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d "{\"team_id\": \"$TEAM_ID\", \"user_id\": \"$USER_ID\", \"role\": \"manager\"}" > /dev/null

echo ""
echo "Done! $EMAIL is now:"
echo "  - Org Admin for Headwaters"
echo "  - Team Manager for the default team"
echo ""
echo "Refresh your browser at http://localhost:3000"
