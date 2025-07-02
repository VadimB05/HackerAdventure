# --- Build Stage ---
FROM node:18-alpine AS builder
WORKDIR /app

# Build arguments
ARG JWT_SECRET
ARG NEXTAUTH_SECRET

# Set environment variables for build
ENV JWT_SECRET=${JWT_SECRET}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

# --- Production Stage ---
FROM node:18-alpine AS runner
WORKDIR /app

# Runtime environment variables
ENV NODE_ENV=development
ENV JWT_SECRET=${JWT_SECRET}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app ./
EXPOSE 3001
CMD ["pnpm", "start"] 