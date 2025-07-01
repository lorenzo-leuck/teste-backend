
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

# Edit the .env file to configure your environment variables

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
The application is containerized using Docker and orchestrated with Docker Compose. The setup includes:

- **NestJS Application**: The main application container running the API
- **PostgreSQL Database**: Relational database for storing URL data and user information
- **PgAdmin**: Web-based PostgreSQL administration tool

## Authentication

The application uses JWT (JSON Web Token) based authentication with Bearer tokens. Authentication is required for certain endpoints, while others can be accessed without authentication.

### Authentication Endpoints

- **POST /api/auth/signup**: Register a new user
  - Request body: `{ "username": "string", "email": "string", "password": "string" }`
  - Response: `{ "token": "string" }`

### Protected Routes

The following routes require authentication with a valid Bearer token:

- All URL management endpoints (GET, POST, PUT, DELETE /api/urls)
- User-specific endpoints

### Authentication Headers

For protected routes, include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Alternatively, you can use the custom header format for Swagger UI testing:

```
token: <your_jwt_token>
```

### Testing Authentication Flow

To test the complete authentication flow, run:

```bash
npm run test:e2e -- test/auth-flow.e2e-spec.ts
```

This test verifies:
1. Public endpoint access
2. Protected endpoint rejection without token
3. User registration
4. User signin
5. Protected endpoint access with valid token
  

## URL Shortening

The application provides URL shortening functionality with a 6-character limit for the shortened code. The system supports both authenticated and public URL shortening.

### Creating a Shortened URL (Authenticated)

**Endpoint:** `POST /api/urls`

**Authentication:** Required (JWT token)

To create a shortened URL as an authenticated user, include your JWT token in the request header:

```
token: <your_jwt_token>
```

**Request Body:**

```json
{
  "originalUrl": "https://www.example.com/very/long/path/to/resource"
}
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "shortCode": "Ab3x9Z",
  "originalUrl": "https://www.example.com/very/long/path/to/resource",
  "shortUrl": "http://localhost:3000/Ab3x9Z"
}
```

**Note:** When authenticated, each URL shortening operation increases the user's usage count. Users have a default limit of 10 shortened URLs, which can be adjusted in the user settings.

### Creating a Shortened URL (Public)

**Endpoint:** `POST /api/urls/public`

**Authentication:** None required

**Request Body:**

```json
{
  "originalUrl": "https://www.example.com/very/long/path/to/resource"
}
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "shortCode": "Ab3x9Z",
  "originalUrl": "https://www.example.com/very/long/path/to/resource",
  "shortUrl": "http://localhost:3000/Ab3x9Z"
}
```

### Retrieving All Shortened URLs

**Endpoint:** `GET /api/urls`

**Authentication:** None required

**Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "shortCode": "Ab3x9Z",
    "originalUrl": "https://www.example.com/very/long/path/to/resource",
    "shortUrl": "http://localhost:3000/Ab3x9Z",
    "clicks": 5,
    "createdAt": "2023-07-01T12:00:00.000Z",
    "user": {
      "id": "8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a",
      "email": "user@example.com"
    }
  }
]
```

### Retrieving User's Shortened URLs

**Endpoint:** `GET /api/urls/byUser`

**Authentication:** Required (JWT token)

**Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "shortCode": "Ab3x9Z",
    "originalUrl": "https://www.example.com/very/long/path/to/resource",
    "shortUrl": "http://localhost:3000/Ab3x9Z",
    "clicks": 5,
    "createdAt": "2023-07-01T12:00:00.000Z"
  }
]
```

### Updating a Shortened URL

**Endpoint:** `PUT /api/urls/:id`

**Authentication:** Required (JWT token)

**Path Parameters:**
- `id`: The ID of the URL to update

**Request Body:**

```json
{
  "originalUrl": "https://www.example.com/updated/path/to/resource"
}
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "shortCode": "Ab3x9Z",
  "originalUrl": "https://www.example.com/updated/path/to/resource",
  "shortUrl": "http://localhost:3000/Ab3x9Z",
  "clicks": 5,
  "updatedAt": "2023-07-01T14:30:00.000Z"
}
```

**Error Responses:**

- `403 Forbidden`: If the user tries to update a URL that doesn't belong to them
- `404 Not Found`: If the URL with the specified ID doesn't exist
    "shortCode": "Ab3x9Z",
    "originalUrl": "https://www.example.com/very/long/path/to/resource",
    "shortUrl": "http://localhost:3000/Ab3x9Z",
    "createdAt": "2025-06-30T23:30:00.000Z",
    "user": {
      "id": "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
      "email": "user@example.com"
    }
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "shortCode": "Xy7z9A",
    "originalUrl": "https://www.example.com/another/path",
    "shortUrl": "http://localhost:3000/Xy7z9A",
    "createdAt": "2025-06-30T23:25:00.000Z",
    "user": null
  }
]
```

**Note:** The response includes all URLs in the system, with user information for authenticated URLs and `null` for URLs created through the public endpoint.

### Retrieving User's Shortened URLs

**Endpoint:** `GET /api/urls/byUser`

**Authentication:** Required (JWT token)

To retrieve URLs for the authenticated user, include your JWT token in the request header:

```
token: <your_jwt_token>
```

**Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "shortCode": "Ab3x9Z",
    "originalUrl": "https://www.example.com/very/long/path/to/resource",
    "shortUrl": "http://localhost:3000/Ab3x9Z",
    "createdAt": "2025-06-30T23:30:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "shortCode": "Xy7z9A",
    "originalUrl": "https://www.example.com/another/path",
    "shortUrl": "http://localhost:3000/Xy7z9A",
    "createdAt": "2025-06-30T23:25:00.000Z"
  }
]
```

**Note:** This endpoint only returns URLs created by the authenticated user.

### URL Redirection

**Endpoint:** `GET /:shortCode`

**Authentication:** None required

**Description:** Redirects to the original URL associated with the provided short code.

For example, visiting `http://localhost:3000/Ab3x9Z` will redirect to the original URL associated with the short code `Ab3x9Z`.

**Response:**
- HTTP 302 Found: Redirects to the original URL
- HTTP 404 Not Found: If the short code doesn't exist or has been deleted

**Implementation Details:**
- The URL redirection is implemented at the root level, bypassing the global API prefix
- This allows shortened URLs to be accessed directly through the base domain
- The redirection controller handles all requests matching the pattern `/:shortCode`
- Each redirection increments the click count for the URL
- Click statistics are included in URL responses

## Observability

The application includes built-in observability features that can be enabled via environment variables:

- **Logging**: Configurable logging to console and/or files
- **Request Tracking**: Monitor HTTP requests, response times, and status codes
- **Performance Monitoring**: Track endpoint performance with sampling
- **Health Checks**: Access system status via the `/health` endpoint

To enable observability features, set the following in your `.env` file:

```
OBSERVABILITY_ENABLED=true
```

Additional configuration options:

```
LOG_LEVEL=info           # Options: error, warn, info, debug, verbose
LOG_TO_FILE=true         # Enable file-based logging
TRACK_REQUESTS=true      # Track HTTP requests
MONITOR_PERFORMANCE=true # Monitor endpoint performance
ENABLE_HEALTH_CHECKS=true # Enable /health endpoint
```


# Documentation

Complete API documentation is available through Swagger UI:

```
http://localhost:3000/api/docs
```

## Database Schema

The application uses a PostgreSQL relational database with the following schema:

### User Entity
- `id` (UUID): Primary key
- `username` (String): Unique username for authentication
- `email` (String): Unique email address for the user
- `password` (String): Hashed password for secure authentication
- `limit` (Number): Maximum number of URLs a user can create (default: 10)
- `usage` (Number): Current number of URLs created by the user (default: 0)
- `urls` (Relation): One-to-many relation with Url entity
- `createdAt` (Date): Creation timestamp
- `updatedAt` (Date): Last update timestamp

### Url Entity
- `id` (UUID): Primary key
- `shortCode` (String): Unique 6-character code for shortened URL
- `originalUrl` (String): Original URL to redirect to
- `isDeleted` (Boolean): Flag for logical deletion
- `user` (Relation): Many-to-one relation with User entity (nullable for anonymous URLs)
- `clicks` (Relation): One-to-many relation with Click entity
- `createdAt` (Date): Creation timestamp
- `updatedAt` (Date): Last update timestamp

### Click Entity
- `id` (UUID): Primary key
- `url` (Relation): Many-to-one relation with Url entity
- `ipAddress` (String): IP address of the visitor (nullable)
- `userAgent` (String): Browser/device information (nullable)
- `referer` (String): Referring URL (nullable)
- `createdAt` (Date): Click timestamp

## Folder Structure


## System Architecture


## Shortening Algorithm

# Considerations



# Release History
* 0.1 - Nest Setup
* 0.2 - Docker Compose Configuration

# License

<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1">
