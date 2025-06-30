
# Backend Test
URL shortening system


[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
<img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
<img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
<img src="https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" alt="Terraform" />
<img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
</p>


## Candidate: 
<a href="https://www.linkedin.com/in/lorenzo-leuck/">Lorenzo Leuck</a>



# Project setup

## Requirements

- [Docker](https://www.docker.com/get-started) (version 20.10.0 or higher with Docker Compose V2)
- [Node.js](https://nodejs.org/) (version 20.x)
- [npm](https://www.npmjs.com/) (version 9.x or higher)

## Run app

```bash
# Clone the repository
git clone https://github.com/lorenzo-leuck/teste-backend.git

# Navigate to project directory
cd teste-backend

# Configure environment variables
cp .env.example .env

# Start the Docker containers using npm script
npm run docker:up

# The application will be available at http://localhost:3000
# PostgreSQL will be available at localhost:5433
# PgAdmin will be available at http://localhost:5050 (login: admin@admin.com / password: admin)
```

## Run tests

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e
```

# Deployment


```bash

```

# Resources

## Authentication
## API Endpoints
## URLs


# Documentation

Complete API documentation is available through Swagger UI:

```
http://localhost:3000/api/docs
```

## Folder Structure


## System Architecture

The application is containerized using Docker and orchestrated with Docker Compose. The setup includes:

- **NestJS Application**: The main application container running the API
- **PostgreSQL Database**: Relational database for storing URL data and user information
- **PgAdmin**: Web-based PostgreSQL administration tool

## Shortening Algorithm

# Considerations



# Release History
* 0.1 - Nest Setup
* 0.2 - Docker Compose Configuration

# License

<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1">
