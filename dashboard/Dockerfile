# Next.js Dashboard Dockerfile for Google Cloud Run
# Multi-stage build for optimal image size

# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variable
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# Stage 3: Runner (production)
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN useradd -m -u 1000 nextjs && mkdir -p /app/.next && chown -R nextjs:nextjs /app

# Copy necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public

USER nextjs

# Expose port (Cloud Run sets PORT env var, defaults to 8080)
EXPOSE 8080

# Health check endpoint is handled by Next.js server.js
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the Next.js server (server.js binds to 0.0.0.0:PORT)
CMD ["node", "server.js"]

