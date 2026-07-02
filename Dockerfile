# --- ETAPE 1 : Le Builder ---
FROM node:alpine3.23 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma
RUN npm run prisma:generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build


FROM node:alpine3.23

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN apk upgrade --no-cache \
    && npm install -g npm@latest \
    && npm install --omit=dev \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx 


# Copy only production artifacts from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3001

# Run the compiled server (matches package.json start script)
CMD ["node", "dist/server.js"]