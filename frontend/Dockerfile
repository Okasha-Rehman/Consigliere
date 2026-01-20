# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

# Install nginx
RUN apk add --no-cache nginx

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy source for dev
COPY --from=build /app /app
WORKDIR /app

# Make start script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'if [ "$ENV" = "dev" ]; then' >> /start.sh && \
    echo '  npm run dev -- --host 0.0.0.0' >> /start.sh && \
    echo 'else' >> /start.sh && \
    echo '  envsubst "${API_BASE_URL}" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g "daemon off;"' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80 3000

CMD ["/start.sh"]


