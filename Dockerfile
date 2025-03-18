FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Install curl for health checks
RUN apk add --no-cache curl

# Set up TypeScript configuration
COPY tsconfig.json ./

# Set environment variables for ES modules
ENV NODE_OPTIONS='--experimental-specifier-resolution=node --loader ts-node/esm'

# Expose the port
EXPOSE 54420

# Start the application
CMD ["npm", "start"] 