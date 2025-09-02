# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application's source code from the host to the image's filesystem
COPY . .

# The command to start the Vite dev server
# The --host flag is necessary to expose the server to other containers
CMD ["npm", "run", "dev", "--", "--host"]
