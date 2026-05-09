FROM node:20-alpine

# Tools needed for healthchecks etc.
RUN apk add --no-cache wget

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy app source
COPY . .

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Uploads directory mounted by compose; ensure it exists at build-time too
RUN mkdir -p uploads/products uploads/receipts data

EXPOSE 5050

ENTRYPOINT ["./docker-entrypoint.sh"]
