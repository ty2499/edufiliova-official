FROM node:20-alpine AS builder

# Cache buster - change this to force rebuild
ARG BUILD_VERSION=20251218-v4
ENV BUILD_VERSION=${BUILD_VERSION}

# Node.js memory limit for builds (2GB should be sufficient)
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --include=dev

COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

COPY shared ./shared
COPY client ./client
COPY server ./server

# Build application with timeout and progress
RUN echo "🔨 Starting build process..." && \
    timeout 600 npm run build 2>&1 || { \
      EXIT_CODE=$?; \
      if [ $EXIT_CODE -eq 124 ]; then \
        echo "❌ Build timeout after 10 minutes"; \
      fi; \
      exit $EXIT_CODE; \
    } && \
    echo "✅ Build completed successfully"

# Prune development dependencies
RUN npm prune --production && echo "✅ Dependencies pruned" || (echo "❌ Prune failed" && exit 1)

FROM node:20-alpine AS runner

RUN apk add --no-cache \
    fontconfig \
    ttf-dejavu \
    ca-certificates \
    curl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copy public assets if they exist (using RUN to handle optional directory)
RUN mkdir -p ./public

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD sh -c 'curl -f http://localhost:${PORT}/healthz || exit 1'

CMD ["npm", "start"]
