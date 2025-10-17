FROM node:18-alpine

WORKDIR /app

# Copy only package manifests first for better caching
COPY package*.json ./

# Install dev deps too (so Vite is present)
# Using npm v9+; --include=dev ensures devDependencies are installed
RUN npm install --include=dev

# Now copy the rest of the app
COPY . .

EXPOSE 5173
# Bind to 0.0.0.0; vite.config.js can also set host: true
ENV HOST=0.0.0.0
CMD ["npm", "run", "dev"]
