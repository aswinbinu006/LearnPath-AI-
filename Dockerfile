# ── Stage 1: Dependencies & Build ──────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Frontend & Backend
RUN npm run build
RUN npm run build:server

# ── Stage 2: Production Minimal Runtime ───────────────
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install OpenSSL and dumb-init for production signal handling
RUN apk add --no-cache openssl dumb-init

# Copy package descriptors and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies and generate Prisma Client
RUN npm ci --omit=dev && npx prisma generate

# Copy compiled frontend and backend bundles from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/server ./dist/server

# Security: Run as non-root unprivileged user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5000

# Docker Healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server/index.js"]
