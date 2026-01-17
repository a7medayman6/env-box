# EnvBox API Documentation

## Authentication

All API endpoints (except `/api/auth/login` and `/api/auth/signup`) require authentication via Bearer token in the Authorization header.

```
Authorization: Bearer <token>
```

### POST /api/auth/signup

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

### POST /api/auth/login

Login to an existing account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

## Projects

### GET /api/projects

List all projects the user has access to.

**Response:**
```json
{
  "projects": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "My Project",
      "ownerId": "507f191e810c19729de860ea",
      "memberIds": [],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/projects

Create a new project.

**Request:**
```json
{
  "name": "My New Project"
}
```

**Response:**
```json
{
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My New Project",
    "ownerId": "507f191e810c19729de860ea",
    "memberIds": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/projects/:id

Get a specific project.

**Response:**
```json
{
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Project",
    "ownerId": "507f191e810c19729de860ea",
    "memberIds": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### DELETE /api/projects/:id

Delete a project and all its variables.

**Response:**
```json
{
  "success": true
}
```

## Environment Variables

### GET /api/projects/:id/variables?environment=:env

Get all variables for a specific environment.

**Query Parameters:**
- `environment` (required): `development`, `staging`, or `production`

**Response:**
```json
{
  "variables": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "projectId": "507f191e810c19729de860ea",
      "environment": "development",
      "key": "API_KEY",
      "value": "********",
      "description": "API key for external service",
      "updatedBy": "507f191e810c19729de860ea",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/projects/:id/variables

Create a new variable.

**Request:**
```json
{
  "environment": "development",
  "key": "API_KEY",
  "value": "secret-value",
  "description": "API key for external service"
}
```

**Response:**
```json
{
  "variable": {
    "_id": "507f1f77bcf86cd799439011",
    "projectId": "507f191e810c19729de860ea",
    "environment": "development",
    "key": "API_KEY",
    "value": "********",
    "description": "API key for external service",
    "updatedBy": "507f191e810c19729de860ea",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PUT /api/projects/:id/variables/:variableId

Update a variable.

**Request:**
```json
{
  "value": "new-secret-value",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "variable": {
    "_id": "507f1f77bcf86cd799439011",
    "key": "API_KEY",
    "value": "********",
    "description": "Updated description",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### DELETE /api/projects/:id/variables/:variableId

Delete a variable.

**Response:**
```json
{
  "success": true
}
```

## Export

### GET /api/projects/:id/export?environment=:env&format=:format

Export variables in different formats.

**Query Parameters:**
- `environment` (required): `development`, `staging`, or `production`
- `format` (optional): `env` (default) or `json`

**Response (format=env):**
```
# API key for external service
API_KEY=secret-value

DATABASE_URL=mongodb://localhost:27017/mydb
```

**Response (format=json):**
```json
{
  "API_KEY": "secret-value",
  "DATABASE_URL": "mongodb://localhost:27017/mydb"
}
```

## Audit Log

### GET /api/projects/:id/audit?environment=:env

Get audit log for a project.

**Query Parameters:**
- `environment` (optional): Filter by environment

**Response:**
```json
{
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "projectId": "507f191e810c19729de860ea",
      "environment": "development",
      "variableKey": "API_KEY",
      "action": "update",
      "userId": "507f191e810c19729de860ea",
      "userEmail": "user@example.com",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error
