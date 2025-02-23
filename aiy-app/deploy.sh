#!/bin/bash

set -e  # Stop script on first error

# ✅ Configurable variables
EC2_USER="ubuntu"
EC2_HOST="ec2-54-188-146-153.us-west-2.compute.amazonaws.com"
REMOTE_DIR="/home/ubuntu/aiy-app"
HEALTHCHECK_URL="http://$EC2_HOST:3000/api/health"

# ✅ Check if debug mode is enabled
DEBUG_MODE=false
DOCKER_COMPOSE_FILE="docker-compose.yml"

if [[ "$1" == "--debug" ]]; then
    DEBUG_MODE=true
    DOCKER_COMPOSE_FILE="docker-compose.debug.yml"
    echo "🟠 Debug mode enabled. Using $DOCKER_COMPOSE_FILE"
fi

# ✅ Package the application
echo "🟢 Packaging application..."
tar -czf aiy-app.tar.gz -C .. aiy-app

# ✅ Copy package to EC2 (Using Default SSH Key)
echo "🟢 Copying package to EC2..."
scp aiy-app.tar.gz $EC2_USER@$EC2_HOST:~

# ✅ SSH into EC2 and deploy
ssh $EC2_USER@$EC2_HOST << EOF
  set -e
  echo "🟢 Ensuring Docker & Docker Compose are installed..."
  sudo apt update
  sudo apt install -y docker.io docker-compose

  echo "🟢 Extracting package..."
  rm -rf aiy-app
  tar -xzf aiy-app.tar.gz
  cd aiy-app

  echo "🟢 Running Docker containers..."
  docker-compose -f $DOCKER_COMPOSE_FILE up -d --build

  echo "🟢 Waiting for service to respond..."
  for i in {1..30}; do
    STATUS=\$(curl -s -o /dev/null -w "%{http_code}" $HEALTHCHECK_URL || true)
    if [ "\$STATUS" -eq 200 ]; then
      echo "✅ Service is up!"
      exit 0
    fi
    echo "🔄 Waiting for service... (\$i/30)"
    sleep 5
  done

  echo "❌ Service did not respond in time."
  exit 1
EOF

echo "✅ Deployment successful!"