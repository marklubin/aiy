#!/bin/bash

set -e  # Stop script on first error

# Define source and destination directories
AIY_CHAT="../aiy-chat"
AIY_FUNCTIONS="../aiy-functions"
AIY_APP="./aiy-app"

# Ensure the destination directories exist
mkdir -p "$AIY_APP/frontend" "$AIY_APP/backend"

echo "🟢 Copying frontend files from aiy-chat..."
rsync -av --exclude="node_modules" --exclude="package.json" --exclude="package-lock.json" \
    "$AIY_CHAT/" "$AIY_APP/frontend/"

echo "🟢 Copying backend files from aiy-functions..."
rsync -av --exclude="node_modules" --exclude="package.json" --exclude="package-lock.json" \
    --exclude="firebase.json" "$AIY_FUNCTIONS/" "$AIY_APP/backend/"

echo "🟢 Moving shared files..."
cp "$AIY_CHAT/package.json" "$AIY_APP/package.json"
cp "$AIY_FUNCTIONS/docker-compose.yml" "$AIY_APP/docker-compose.yml"

echo "✅ Merge completed successfully."

