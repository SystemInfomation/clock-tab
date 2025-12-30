# Discord Bot Dockerfile for Google Cloud Run
# Uses Node.js 20 LTS (recommended for Cloud Run)

FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY . .

# Expose port for health checks (Cloud Run requirement)
# Cloud Run requires an HTTP endpoint - health-server.js provides this
EXPOSE 8080

# Health check (optional, Cloud Run has built-in health checks)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the bot
# Health server is started from index.js in production mode
CMD ["node", "src/index.js"]
