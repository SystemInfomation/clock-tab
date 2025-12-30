# Discord Bot Dockerfile for Google Cloud Run
# Optimized exclusively for Google Cloud Run deployment
# Uses Node.js 20 LTS (recommended for Cloud Run)

FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (production only)
RUN npm install --omit=dev && npm cache clean --force

# Copy application source
COPY . .

# Expose port 8080 (Cloud Run requirement)
# Cloud Run automatically sets PORT environment variable
EXPOSE 8080

# Health check (optional, Cloud Run has built-in health checks)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the bot
# Health server starts immediately on PORT (required by Cloud Run)
CMD ["node", "src/index.js"]
