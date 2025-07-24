# ResolveIt Setup Instructions

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd resolveit-app
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install:all
```

### 3. Database Setup

#### Create PostgreSQL Database
```sql
CREATE DATABASE resolveit_db;
CREATE USER resolveit_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE resolveit_db TO resolveit_user;
```

#### Configure Environment Variables
```bash
# Backend environment
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://resolveit_user:your_password@localhost:5432/resolveit_db"
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=10485760
CORS_ORIGIN="http://localhost:3000"
```

```bash
# Frontend environment
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 4. Database Migration
```bash
cd backend
npm run generate
npm run migrate
```

### 5. Create Admin User (Optional)
You can create an admin user directly in the database or register through the app and manually update the role:

```sql
-- After registering a user, update their role to ADMIN
UPDATE users SET role = 'ADMIN', "isVerified" = true WHERE email = 'admin@example.com';
```

## Running the Application

### Development Mode
```bash
# Run both frontend and backend
npm run dev

# Or run separately:
npm run dev:backend  # Backend on http://localhost:5000
npm run dev:frontend # Frontend on http://localhost:3000
```

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Testing the API

### Using Postman
1. Import the collection from `docs/ResolveIt_Postman_Collection.json`
2. Set the `baseUrl` variable to `http://localhost:5000/api`
3. Register a user and login to get a token
4. The token will be automatically set for authenticated requests

### Manual Testing Flow
1. **Register a user** via POST `/api/auth/register`
2. **Login** via POST `/api/auth/login` to get JWT token
3. **Verify account** (admin needs to set `isVerified = true`)
4. **Register a case** via POST `/api/cases/register`
5. **View cases** via GET `/api/cases/my-cases`
6. **Admin functions** (create panels, manage cases)

## Project Structure

```
resolveit-app/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Auth, validation, upload middleware
│   │   ├── routes/         # API routes
│   │   ├── socket/         # Socket.IO handlers
│   │   └── server.ts       # Main server file
│   ├── prisma/             # Database schema and migrations
│   └── uploads/            # File uploads directory
├── frontend/               # Next.js frontend
│   ├── app/                # Next.js 13+ app directory
│   ├── components/         # React components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript types
└── docs/                   # Documentation
```

## Key Features Implemented

### Task 1: Registration Flow and Schema Design ✅
- ✅ User registration with validation
- ✅ Case registration with document upload
- ✅ Database schema with proper relationships
- ✅ Input validation and sanitization
- ✅ File upload security
- ✅ Case verification workflow

### Task 2: Case Lifecycle Management and Dashboard ✅
- ✅ Case status management
- ✅ Admin dashboard with statistics
- ✅ Real-time updates via WebSockets
- ✅ Panel creation and management
- ✅ Notification system
- ✅ Case filtering and search

### Security Features ✅
- ✅ JWT authentication
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ File upload security
- ✅ Role-based access control

## API Endpoints

See `docs/API_Documentation.md` for complete API documentation.

## Database Schema

The database includes the following main entities:
- **Users**: User accounts with roles and verification
- **Cases**: Dispute cases with status tracking
- **Documents**: File attachments for cases
- **Panels**: Mediation panels with expert members
- **Notifications**: System notifications
- **Case Updates**: Status change history

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Ensure database and user exist

2. **File Upload Issues**
   - Check UPLOAD_PATH directory exists
   - Verify file permissions
   - Check MAX_FILE_SIZE setting

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration
   - Verify Authorization header format

4. **Socket Connection Issues**
   - Check CORS_ORIGIN setting
   - Verify Socket.IO client configuration
   - Check firewall settings

### Logs
- Backend logs: Console output when running `npm run dev:backend`
- Frontend logs: Browser console and Next.js terminal output

## Production Deployment

### Environment Variables
Set the following for production:
```env
NODE_ENV=production
DATABASE_URL=<production_database_url>
JWT_SECRET=<strong_random_secret>
CORS_ORIGIN=<frontend_domain>
```

### Security Considerations
- Use HTTPS in production
- Set secure JWT secret
- Configure proper CORS origins
- Set up rate limiting
- Use environment variables for secrets
- Regular security updates

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check console logs for errors
4. Verify environment configuration