FROM node:22-slim AS base
WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run codegen

EXPOSE 42069

CMD ["npm", "start"]
