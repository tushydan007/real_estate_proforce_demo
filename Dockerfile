# syntax=docker/dockerfile:1

# Build stage
ARG NODE_VERSION=22.18.0
FROM node:${NODE_VERSION}-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Set environment variables for development
ENV NODE_ENV=development

# Install build dependencies and tools
RUN apk add --no-cache python3 make g++ \
    && npm install -g npm@latest

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source code
COPY . .

# Development stage
FROM node:${NODE_VERSION}-alpine

# Set working directory
WORKDIR /usr/src/app

# Set environment variables for development
ENV NODE_ENV=development \
    PORT=5173 \
    HOST=0.0.0.0 \
    VITE_CACHE_DIR=/usr/src/app/.vite-cache

# Install runtime dependencies
RUN apk add --no-cache curl

# Create non-root user and group
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodeuser -u 1001 -G nodejs \
    && mkdir -p /usr/src/app/.vite-cache \
    && chown -R nodeuser:nodejs /usr/src/app /usr/src/app/.vite-cache

# Run as non-root user for security
USER nodeuser

# Copy built artifacts from builder stage
COPY --from=builder --chown=nodeuser:nodejs /usr/src/app ./

# Ensure node_modules and vite cache are writable
RUN mkdir -p node_modules/.vite && chown -R nodeuser:nodejs node_modules/.vite

# Expose port for React dev server
EXPOSE 5173

# Add healthcheck for container monitoring
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:5173/ || exit 1

# Start the React development server
CMD ["npm", "run", "dev", "--", "--host"]