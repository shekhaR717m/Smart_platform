FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV PORT=8000

WORKDIR /app

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

USER nodejs

EXPOSE 8000

CMD ["node", "src/server.js"]
