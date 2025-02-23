# Build frontend
FROM node:20 AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/frontend ./packages/frontend

# Build frontend
RUN npm run -w @aiy/frontend build

# Backend setup
FROM node:20
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install production dependencies
RUN npm install --production

# Copy backend source
COPY packages/backend ./packages/backend

EXPOSE 3000

CMD ["npm", "run", "-w", "@aiy/backend", "dev"]