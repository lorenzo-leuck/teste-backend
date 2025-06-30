#!/bin/bash

# Stop all running containers
docker-compose down

# Remove all containers, networks, and volumes
docker-compose rm -f

# Start the containers again
docker-compose up -d

# Show the logs of the app container
docker logs -f teste-backend-app-1
