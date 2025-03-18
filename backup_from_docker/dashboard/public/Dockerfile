FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables
ENV VITE_PROJECT_NAME=prodash-tools
ENV VITE_BACKEND_PORT=54420

EXPOSE 53420

# Start Vite with host flag to allow external access
CMD ["npm", "run", "dev", "--", "--host", "--port", "53420"] 