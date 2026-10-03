# Stage 1: Base & Dependencies
FROM node:20-alpine AS development

WORKDIR /app

RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml* .npmrc* ./

RUN pnpm install --ignore-scripts

COPY . .

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "run", "dev"]

# Stage 2: Build
FROM node:20-alpine AS build

WORKDIR /app

RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml* .npmrc* ./

RUN pnpm install --ignore-scripts

COPY . .

RUN pnpm run build

# Stage 3: Production Runner
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml* .npmrc* ./

RUN pnpm install --prod --ignore-scripts

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

CMD ["pnpm", "run", "start"]
