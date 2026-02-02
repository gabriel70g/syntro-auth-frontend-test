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

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Railway fills PORT env var, but Nginx default file listens 80 unless changed. 
# Railway maps external port to container 80 automatically mostly, but let's be safe)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
