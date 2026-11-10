FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --no-frozen-lockfile --shamefully-hoist
COPY . .
RUN pnpm build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 DATA_DIR=/data MIGRATIONS_DIR=/app/drizzle
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY --from=builder /app ./
EXPOSE 3000
CMD ["sh","-c","pnpm run db:migrate && pnpm run start"]
