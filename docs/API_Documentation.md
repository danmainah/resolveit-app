# ResolveIt API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - name (string, required): Full name
  - email (string, required): Email address
  - phone (string, required): Phone number
  - password (string, required): Password (min 8 chars, must contain uppercase, lowercase, number)
  - age (number, required): Age (18-120)
  - gender (string, required): MALE, FEMALE, or OTHER
  - address[street] (string, required): Street address
  - address[city] (string, required): City
  - address[zipCode] (string, required): Zip code
  - photo (file, optional): Profile photo

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "age": 30,
    "gender": "MALE",
    "photo": "filename.jpg",
    "role": "USER",
    "isVerified": false,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "zipCode": "10001"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token"
}
```

#### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { /* user object */ },
  "token": "jwt_token"
}
```

#### GET /auth/verify
Verify JWT token and get user info.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": { /* user object */ }
}
```

### Cases

#### POST /cases/register
Register a new case (requires verified account).

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Headers: Authorization: Bearer <token>
- Body:
  - caseType (string, required): FAMILY, BUSINESS, CRIMINAL, PROPERTY, OTHER
  - issueDescription (string, required): Detailed description (50-2000 chars)
  - oppositeParty[name] (string, required): Opposite party name
  - oppositeParty[email] (string, optional): Opposite party email
  - oppositeParty[phone] (string, optional): Opposite party phone
  - oppositeParty[address] (string, optional): Opposite party address
  - isCourtPending (boolean, required): Whether case is pending in court
  - caseNumber (string, conditional): Required if isCourtPending is true
  - firNumber (string, optional): FIR number
  - courtPoliceStation (string, conditional): Required if isCourtPending is true
  - documents (files, optional): Supporting documents (max 10 files, 10MB each)

**Response:**
```json
{
  "message": "Case registered successfully",
  "case": {
    "id": "uuid",
    "caseType": "FAMILY",
    "issueDescription": "Description...",
    "status": "PENDING",
    "isCourtPending": false,
    "plaintiff": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "oppositePartyDetails": {
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "documents": [
      {
        "id": "uuid",
        "filename": "evidence.pdf",
        "fileType": "PDF",
        "fileSize": 1024000
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /cases/my-cases
Get user's cases with pagination and filtering.

**Query Parameters:**
- status (string, optional): Filter by case status
- type (string, optional): Filter by case type
- page (number, optional): Page number (default: 1)
- limit (number, optional): Items per page (default: 10)

**Response:**
```json
{
  "cases": [
    { /* case object */ }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### GET /cases/:id
Get detailed case information.

**Response:**
```json
{
  "case": {
    "id": "uuid",
    "caseType": "FAMILY",
    "status": "PENDING",
    "issueDescription": "Description...",
    "plaintiff": { /* user object */ },
    "defendant": { /* user object or null */ },
    "oppositePartyDetails": { /* opposite party object */ },
    "documents": [ /* document objects */ ],
    "panel": {
      "id": "uuid",
      "members": [
        {
          "user": {
            "name": "Dr. Smith",
            "role": "LAWYER"
          },
          "role": "LAWYER"
        }
      ]
    },
    "caseUpdates": [ /* case update objects */ ]
  }
}
```

#### PATCH /cases/:id/status
Update case status (admin/panel members only).

**Request:**
```json
{
  "status": "ACCEPTED",
  "description": "Case has been accepted for mediation"
}
```

**Response:**
```json
{
  "message": "Case status updated successfully",
  "case": { /* updated case object */ }
}
```

### Admin Endpoints

#### GET /admin/dashboard/stats
Get dashboard statistics (admin only).

**Response:**
```json
{
  "stats": {
    "totalCases": 100,
    "pendingCases": 25,
    "inProgressCases": 50,
    "resolvedCases": 20,
    "unresolvedCases": 5,
    "totalUsers": 200,
    "resolutionRate": "80.0"
  },
  "caseTypeDistribution": [
    {
      "type": "FAMILY",
      "count": 40
    }
  ],
  "monthlyTrends": [
    {
      "month": "2024-01",
      "total": 10,
      "resolved": 8,
      "pending": 2
    }
  ],
  "recentCases": [ /* recent case objects */ ]
}
```

#### GET /admin/cases
Get all cases with filtering and pagination (admin only).

**Query Parameters:**
- status (string, optional): Filter by status
- type (string, optional): Filter by case type
- search (string, optional): Search in plaintiff name, description, opposite party
- page (number, optional): Page number
- limit (number, optional): Items per page
- sortBy (string, optional): Sort field (default: createdAt)
- sortOrder (string, optional): asc or desc (default: desc)

**Response:**
```json
{
  "cases": [ /* case objects */ ],
  "pagination": { /* pagination object */ }
}
```

#### POST /admin/cases/:id/panel
Create mediation panel for a case (admin only).

**Request:**
```json
{
  "memberIds": [
    {
      "userId": "uuid",
      "role": "LAWYER"
    },
    {
      "userId": "uuid",
      "role": "RELIGIOUS_SCHOLAR"
    },
    {
      "userId": "uuid",
      "role": "SOCIAL_EXPERT"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Panel created successfully",
  "panel": {
    "id": "uuid",
    "members": [ /* panel member objects */ ]
  }
}
```

#### GET /admin/panel-members
Get available panel members (admin only).

**Query Parameters:**
- role (string, optional): Filter by role

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "name": "Dr. Smith",
      "email": "smith@example.com",
      "role": "LAWYER",
      "_count": {
        "panelMemberships": 5
      }
    }
  ]
}
```

#### PATCH /admin/users/:id/verify
Update user verification status (admin only).

**Request:**
```json
{
  "isVerified": true
}
```

**Response:**
```json
{
  "message": "User verified successfully",
  "user": { /* user object */ }
}
```

### User Endpoints

#### GET /users/profile
Get current user profile.

**Response:**
```json
{
  "user": {
    /* user object with address and counts */
  }
}
```

#### GET /users/notifications
Get user notifications.

**Query Parameters:**
- page (number, optional): Page number
- limit (number, optional): Items per page
- unreadOnly (boolean, optional): Show only unread notifications

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "CASE_UPDATE",
      "title": "Case Status Updated",
      "message": "Your case status has been updated",
      "isRead": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "case": {
        "id": "uuid",
        "caseType": "FAMILY",
        "status": "ACCEPTED"
      }
    }
  ],
  "pagination": { /* pagination object */ },
  "unreadCount": 5
}
```

#### PATCH /users/notifications/:id/read
Mark notification as read.

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

#### PATCH /users/notifications/read-all
Mark all notifications as read.

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "message": "Permission denied"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

## WebSocket Events

The application uses Socket.IO for real-time updates.

### Connection
Connect with JWT token:
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### Client to Server
- `joinCase(caseId)`: Join case room for updates
- `leaveCase(caseId)`: Leave case room
- `joinMediationSession(caseId)`: Join mediation session
- `leaveMediationSession(caseId)`: Leave mediation session
- `mediationMessage(data)`: Send message in mediation
- `typing(data)`: Send typing indicator

#### Server to Client
- `caseUpdate(data)`: Case status or details updated
- `newMediationMessage(data)`: New message in mediation
- `userJoinedSession(data)`: User joined mediation session
- `userLeftSession(data)`: User left mediation session
- `userTyping(data)`: User typing indicator

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## File Upload Limits

- Maximum file size: 10MB per file
- Maximum files per request: 10
- Allowed file types: Images (JPEG, PNG, GIF), Videos (MP4, AVI, MOV), Audio (MP3, WAV, M4A), PDF