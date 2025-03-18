FROM node:20-alpine

# Install curl for health checks
RUN apk --no-cache add curl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the dashboard
RUN cd context-keeper/dashboard/public && npm install && npm run build

# Expose ports
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "run", "start"] 