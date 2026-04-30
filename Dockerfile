FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json tsconfig.build.json nest-cli.json drizzle.config.ts ./
COPY src ./src
COPY drizzle ./drizzle

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm install

COPY --from=build /app/dist ./dist
COPY drizzle.config.ts ./
COPY drizzle ./drizzle
COPY docker-entrypoint.sh ./

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]