FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM base AS dev

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]

FROM base AS build

COPY . .

# Bake a sentinel so VITE_API_URL can be swapped in at container start.
ENV VITE_API_URL=__VITE_API_URL__
RUN npm run build

FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker-entrypoint.d/40-inject-api-url.sh /docker-entrypoint.d/40-inject-api-url.sh
RUN chmod +x /docker-entrypoint.d/40-inject-api-url.sh

EXPOSE 80
