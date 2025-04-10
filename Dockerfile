# Use official Node.js image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Install nodemon globally
RUN npm install -g nodemon

# Copy the app source code
COPY . .

# Expose app port
EXPOSE 3000

# Start with nodemon for live reload
CMD ["nodemon", "index.js"]
