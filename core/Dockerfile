# Stage 1: Base & Dependencies
FROM node:20-alpine AS development

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* .npmrc* ./

RUN pnpm install --ignore-scripts

COPY . .

EXPOSE 5001

CMD ["pnpm", "run", "start:dev"]

# Stage 2: Build
FROM node:20-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* .npmrc* ./

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm run build

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* .npmrc* ./

RUN pnpm install --prod --frozen-lockfile --ignore-scripts

COPY --from=build /app/dist ./dist

EXPOSE 5001

CMD ["node", "dist/main"]
