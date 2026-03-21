# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Lockfile en repo es pnpm (v9); sin package-lock.json
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build args (injected by Railway during build)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build static files (output in /app/out)
RUN pnpm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy static assets from builder stage
COPY --from=builder /app/out .

# Copy custom nginx config template (envsubst will run on startup)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Set default PORT for local testing
ENV PORT=80

# Expose port (Documentation only, Nginx listens on $PORT)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
