FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --frozen-lockfile

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN npm install --omit=dev && npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]




