# ==============================================================================
# Multi-stage Dockerfile for 3D Diagram Transformer SaaS
# Production-ready, Portable across OS/Architectures, Hardened & Non-root
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Alpine Image with Required Native Libraries
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Install Dependencies
# ------------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 3: Build Application and Compile Assets
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV JWT_SECRET="build-dummy-jwt-secret-min-32-chars-long"
ENV JWT_REFRESH_SECRET="build-dummy-jwt-refresh-secret-min-32-chars"
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV REDIS_URL="redis://localhost:6379"

# Generate Prisma Client for PostgreSQL
RUN npx prisma generate

# Compile seed script for standalone execution
RUN npx tsc prisma/seed.ts --target es2022 --module commonjs --moduleResolution node --outDir prisma || true

# Build Next.js in Standalone Mode
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Production Runner (Lightweight & Security-hardened)
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create unprivileged system user & group (Non-root security best practice)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Prisma schema, CLI binary & compiled seed for automatic DB migrations on startup
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

# Copy Next.js standalone server and static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy and prepare entrypoint script (ensure LF line endings for cross-platform support)
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && \
    chmod +x ./docker-entrypoint.sh && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
