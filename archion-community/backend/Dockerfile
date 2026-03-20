FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source code
COPY . .

# Expose port (Assuming standard 5000 or similar, but we bind to 5000 and pass it to express if it looks for PORT)
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
