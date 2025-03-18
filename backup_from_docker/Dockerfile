FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PROJECT_NAME=prodash-tools
ENV PORT=54420
ENV NODE_OPTIONS='--experimental-specifier-resolution=node --loader ts-node/esm'

# Install curl for healthcheck
RUN apk add --no-cache curl

# Add TypeScript configuration
COPY tsconfig.json ./
RUN echo '{ "compilerOptions": { "target": "ES2020", "module": "ESNext", "moduleResolution": "node", "esModuleInterop": true, "allowSyntheticDefaultImports": true, "strict": true, "skipLibCheck": true, "forceConsistentCasingInFileNames": true, "outDir": "dist", "rootDir": ".", "baseUrl": ".", "paths": { "@/*": ["./*"] } }, "include": ["**/*.ts"], "exclude": ["node_modules", "dist"] }' > tsconfig.json

EXPOSE 54420

CMD ["npm", "start"] 