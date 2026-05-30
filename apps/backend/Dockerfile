# =============================================================================
# Stage 1: deps — install production + dev dependencies
# =============================================================================
FROM node:lts-alpine3.22 AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

# =============================================================================
# Stage 2: production deps — install only runtime dependencies
# =============================================================================
FROM node:lts-alpine3.22 AS prod-deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# =============================================================================
# Stage 3: build — generate Prisma client, compile TypeScript
# =============================================================================
FROM deps AS build

COPY prisma ./prisma
COPY prisma.config.ts ./

ENV DATABASE_URL=postgresql://admin:postgres@localhost:5432/lumiere?schema=public

RUN npm run db:generate

COPY tsconfig.json ./
COPY src ./src

# Build application
RUN npm run build


# =============================================================================
# Stage 4: runtime — production image
# =============================================================================
FROM node:lts-alpine3.22 AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm install --no-save --no-package-lock prisma@7.8.0 \
  && npm cache clean --force

EXPOSE 4000

CMD ["node", "dist/server.js"]
