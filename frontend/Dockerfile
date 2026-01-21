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
RUN apk add --no-cache nginx gettext

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy source for dev
COPY --from=build /app /app
WORKDIR /app

# Make start script

RUN cat > /start.sh << 'SCRIPT'
#!/bin/sh
if [ "$ENV" = "dev" ]; then
  npm run dev -- --host 0.0.0.0
else
  echo "Starting production mode"
  echo "API_BASE_URL: $API_BASE_URL"
  envsubst '${API_BASE_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
  cat /etc/nginx/nginx.conf | head -20
  exec nginx -g "daemon off;"
fi
SCRIPT
RUN chmod +x /start.sh

EXPOSE 80 3000

CMD ["/start.sh"]


