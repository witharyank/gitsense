# Stage 1: Install dependencies
FROM node:22-alpine AS deps
# Install libc6-compat for node native dependencies if required
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root workspace configurations and lockfile
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies using npm ci (strict, reproducible install)
RUN npm ci

# Stage 2: Rebuild the source code
FROM node:22-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Copy dependency tree from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run production Next.js build for the workspace
RUN npm run build --workspace=apps/web

# Stage 3: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root system group and user for execution security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public static assets from build
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set permissions for the Next.js prerender/caching system
RUN mkdir -p apps/web/.next && \
    chown -R nextjs:nodejs apps/web/.next

# Copy the standalone web build and static assets
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Run container under non-root user privilege
USER nextjs

EXPOSE 3000

# Next.js standalone server entry point
CMD ["node", "apps/web/server.js"]