# Frontend Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/tsconfig ./packages/tsconfig

# Copy frontend package
COPY apps/frontend ./apps/frontend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder

# Set build-time environment variable for the API URL
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /app/apps/frontend
RUN pnpm run build

# Ensure public directory exists (may not exist in some projects)
RUN mkdir -p public

# Production stage
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

WORKDIR /app

# Copy necessary files for production
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/tsconfig ./packages/tsconfig
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/next.config.js ./apps/frontend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

WORKDIR /app/apps/frontend

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["pnpm", "start"]

