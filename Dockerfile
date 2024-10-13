# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install --production

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port your app runs on
EXPOSE 3777

# Define the command to start your app
CMD ["npm", "start"]
