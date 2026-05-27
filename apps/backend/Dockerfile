# =============================================================================
# Stage 1: deps — install production + dev dependencies
# =============================================================================
FROM node:25-alpine3.22 AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

# =============================================================================
# Stage 2: build — generate Prisma client, compile TypeScript
# =============================================================================
FROM deps AS build

COPY prisma ./prisma


RUN npm run db:generate

COPY tsconfig.json ./
COPY src ./src

# Build application
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev


# =============================================================================
# Stage 3: runtime — lean production image
# =============================================================================
FROM node:25-alpine3.22 AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/server.js"]




