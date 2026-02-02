# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (cache optimized)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build static files (output in /app/out)
RUN npm run build

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
