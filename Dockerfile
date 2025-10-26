# Use Node 20 to match modern Expo requirements
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all frontend code
COPY . .

# Expo web typically runs on 8081
EXPOSE 8081

# Start Expo for mobile development
CMD ["npx", "expo", "start", "--tunnel"] 