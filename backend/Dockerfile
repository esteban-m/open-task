# Identique à l'image backend qui tournait ce matin (node:20-bookworm + openssl)
FROM node:20-bookworm-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS production

RUN apt-get update && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY prisma ./prisma

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
