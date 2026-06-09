FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/

RUN pnpm fetch --frozen-lockfile

FROM deps AS builder
COPY . .
RUN pnpm install --offline --frozen-lockfile
RUN pnpm --filter=api build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/

RUN pnpm fetch --prod --frozen-lockfile
RUN pnpm install --offline --prod --frozen-lockfile

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 5000
CMD ["node", "apps/api/dist/src/main.js"]
