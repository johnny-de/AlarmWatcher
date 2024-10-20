# Steps:
# 1. Start Docker Desktop
# 2. Open Visual Studio terminal
# 3. Run the command to build and push image with a version-specific tag (e.g. '1.9.0'):
#    ! Dont forget to adapt the tag !    
#    > docker buildx build --platform linux/amd64,linux/arm64 -t johnnyde/alarmwatcher:1.9.0 --push . 
# 4. Run the command to build and push image with the 'latest' tag:
#    > docker buildx build --platform linux/amd64,linux/arm64 -t johnnyde/alarmwatcher:latest --push . 

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
