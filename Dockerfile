# YarınLab üretim imajı: web derlemesi + Fastify API tek süreçte (HTTPS ters vekil arkasında çalıştırın).
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm -w @yarinlab/server exec prisma generate && npm run build -w @yarinlab/web

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production PORT=3001 COOKIE_SECURE=true
COPY --from=build /app /app
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "npm -w @yarinlab/server exec prisma migrate deploy && npm -w @yarinlab/server run start"]
