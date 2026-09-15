# Stage 1: Build (lint + build: nada se despliega con el gate en rojo)
FROM node:22-alpine AS builder
WORKDIR /app

# Lockfile en repo es pnpm (v9); la versión exacta la fija packageManager en package.json
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Build args (Railway los inyecta en el build). NEXT_PUBLIC_* queda en el bundle: nada secreto acá.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_TENANT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_TENANT_ID=$NEXT_PUBLIC_TENANT_ID \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm lint && pnpm build

# Stage 2: servidor Next (BFF) sin root
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=8080

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

USER app
EXPOSE 8080

# Variables de runtime: APP_ORIGIN (obligatoria para OAuth), SYNTROAUTH_API_URL (recomendada: red privada).
CMD ["node", "server.js"]
