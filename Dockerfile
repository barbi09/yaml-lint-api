# ---- Base Image ----
    FROM node:22 AS base
    WORKDIR /app
    COPY package.json ./
    
    # ---- Dependencies ----
    FROM base AS dependencies
    RUN npm install
    
    # ---- Build Stage ----
    FROM dependencies AS build
    COPY . .
    RUN npm run build  # Compiles TypeScript to JavaScript
    
    # ---- Production Stage ----
    FROM node:22 AS production
    WORKDIR /app
    
    # Copy compiled files and dependencies
    COPY --from=build /app/dist ./dist
    COPY --from=dependencies /app/node_modules ./node_modules
    COPY package.json ./
    
    # Set Environment Variables
    ENV NODE_ENV=production
    ENV PORT=8080
    
    # Expose the application port
    EXPOSE 8080
    
    # Start the API (without nodemon in production)
    CMD ["node", "dist/server.js"]
    