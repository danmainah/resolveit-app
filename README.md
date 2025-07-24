# ResolveIt - Dispute Resolution Platform

A comprehensive platform for resolving disputes through mediation with expert panels. ResolveIt provides a structured lifecycle for dispute resolution, from case registration to final resolution through expert mediation.

## 🌟 Features

### Core Functionality
- **User Registration & Authentication** - Secure account creation with JWT authentication
- **Case Registration & Management** - Comprehensive dispute registration with document upload
- **Case Lifecycle Tracking** - Automated status updates through the mediation process
- **Expert Panel Creation** - Automated assignment of lawyers, religious scholars, and social experts
- **Real-time Updates** - Live notifications and status updates via WebSockets
- **Admin Dashboard** - Comprehensive analytics and case management
- **Document Management** - Secure file upload and storage for evidence
- **Notification System** - Real-time notifications for all stakeholders

### Case Lifecycle
1. **Registration** - Users register disputes with detailed information
2. **Review** - Cases are queued for administrative review
3. **Verification** - System checks for court/police pending status
4. **Panel Creation** - Expert panels are assigned (lawyer, religious scholar, social expert)
5. **Mediation** - Virtual mediation sessions with live chat
6. **Resolution** - Cases are resolved or marked as unresolved

## 🛠 Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18 with TypeScript
- Tailwind CSS for styling
- React Hook Form with Yup validation
- React Query for state management
- Socket.io Client for real-time features
- Recharts for data visualization

**Backend:**
- Node.js with Express.js
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- JWT Authentication
- Socket.io for real-time communication
- Multer for file uploads
- Express Validator for input validation
- Rate limiting and security middleware

**Database:**
- PostgreSQL with Prisma ORM
- Comprehensive schema with relationships
- Automated migrations
- Data integrity constraints

## 📁 Project Structure

```
resolveit-app/
├── frontend/                    # Next.js frontend application
│   ├── app/                    # Next.js 13+ app directory
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── admin/             # Admin dashboard
│   │   ├── cases/             # Case management pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable React components
│   │   ├── layout/           # Layout components
│   │   └── providers/        # Context providers
│   ├── contexts/             # React contexts (Auth, Socket)
│   ├── lib/                  # Utility functions and API client
│   ├── types/                # TypeScript type definitions
│   └── hooks/                # Custom React hooks
├── backend/                   # Node.js backend application
│   ├── src/
│   │   ├── config/           # Database and app configuration
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API route handlers
│   │   ├── socket/           # Socket.io event handlers
│   │   └── server.ts         # Main server file
│   ├── prisma/               # Database schema and migrations
│   │   └── schema.prisma     # Prisma schema definition
│   └── uploads/              # File upload directory
├── docs/                     # Documentation
│   ├── API_Documentation.md  # Complete API documentation
│   └── ResolveIt_Postman_Collection.json
└── SETUP.md                  # Detailed setup instructions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd resolveit-app

# Install all dependencies
npm run install:all

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Configure your database URL in backend/.env
# Run database migrations
cd backend
npm run generate
npm run migrate

# Start development servers
cd ..
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: See `docs/API_Documentation.md`

For detailed setup instructions, see [SETUP.md](SETUP.md).

## 📋 Task Implementation Status

### ✅ Task 1: Registration Flow and Schema Design
- **User Registration**: Complete form with validation, photo upload, address management
- **Case Registration**: Comprehensive case details, opposite party info, document upload
- **Database Schema**: Robust schema with proper relationships and constraints
- **Validation**: Client-side and server-side validation with security measures
- **File Upload**: Secure document upload with type and size validation
- **Case Verification**: Automated checks for court/police pending status

### ✅ Task 2: Case Lifecycle Management and Dashboard
- **Case Lifecycle**: Automated status progression through mediation process
- **Admin Dashboard**: Real-time statistics, charts, and case management
- **Panel Management**: Expert panel creation with required roles
- **Real-time Updates**: WebSocket integration for live notifications
- **Filtering & Search**: Advanced case filtering and search capabilities
- **Notification System**: Comprehensive notification management

## 🔒 Security Features

- **Authentication**: JWT-based authentication with secure token management
- **Authorization**: Role-based access control (User, Admin, Panel Members)
- **Input Validation**: Comprehensive validation using Yup and Express Validator
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: CSRF tokens and same-origin policy
- **Rate Limiting**: API rate limiting to prevent abuse
- **File Upload Security**: File type validation, size limits, secure storage
- **Password Security**: Bcrypt hashing with salt rounds
- **Environment Security**: Secure environment variable management

## 📊 Database Schema

### Core Entities
- **Users**: Account management with roles and verification
- **Cases**: Dispute cases with comprehensive tracking
- **Addresses**: User address information
- **OppositeParty**: Details of the opposing party in disputes
- **Documents**: File attachments with metadata
- **Panels**: Mediation panels with expert members
- **PanelMembers**: Panel membership with roles
- **CaseUpdates**: Historical status changes
- **Notifications**: System-wide notification management

### Key Relationships
- Users can have multiple cases (as plaintiff or defendant)
- Cases have one panel with multiple expert members
- Cases track status changes through CaseUpdates
- Users receive notifications for case activities

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Cases
- `POST /api/cases/register` - Register new case
- `GET /api/cases/my-cases` - Get user's cases
- `GET /api/cases/:id` - Get case details
- `PATCH /api/cases/:id/status` - Update case status

### Admin
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/cases` - All cases with filtering
- `POST /api/admin/cases/:id/panel` - Create mediation panel
- `GET /api/admin/panel-members` - Available panel members
- `PATCH /api/admin/users/:id/verify` - Verify user account

### Users
- `GET /api/users/profile` - User profile
- `GET /api/users/notifications` - User notifications
- `PATCH /api/users/notifications/:id/read` - Mark notification read

For complete API documentation, see [docs/API_Documentation.md](docs/API_Documentation.md).

## 🧪 Testing

### Postman Collection
Import the Postman collection from `docs/ResolveIt_Postman_Collection.json` to test all API endpoints.

### Manual Testing Flow
1. Register a new user account
2. Login to receive JWT token
3. Admin verifies the user account
4. User registers a new case with documents
5. Admin creates a mediation panel
6. Track case progress through status updates
7. Test real-time notifications

## 🌐 Real-time Features

### WebSocket Events
- **Case Updates**: Real-time case status changes
- **Notifications**: Live notification delivery
- **Mediation Sessions**: Live chat during mediation
- **Panel Activities**: Real-time panel member activities

### Socket.io Integration
- Authenticated socket connections
- Room-based event broadcasting
- Typing indicators for mediation chat
- Connection status monitoring

## 📱 User Interface

### Responsive Design
- Mobile-first responsive design
- Tailwind CSS for consistent styling
- Accessible components with proper ARIA labels
- Dark/light mode support (configurable)

### Key Pages
- **Landing Page**: Marketing and feature overview
- **Authentication**: Login and registration forms
- **User Dashboard**: Personal case overview and statistics
- **Admin Dashboard**: System-wide analytics and management
- **Case Registration**: Comprehensive case submission form
- **Case Details**: Detailed case view with timeline
- **Notifications**: Real-time notification center

## 🚀 Deployment

### Environment Configuration
```env
# Production environment variables
NODE_ENV=production
DATABASE_URL=<production_database_url>
JWT_SECRET=<secure_random_secret>
CORS_ORIGIN=<frontend_domain>
```

### Security Checklist
- [ ] HTTPS enabled
- [ ] Secure JWT secrets
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] File upload restrictions
- [ ] Environment variables secured
- [ ] Database access restricted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Check the [SETUP.md](SETUP.md) for installation issues
- Review [API Documentation](docs/API_Documentation.md) for API usage
- Check console logs for debugging information
- Verify environment configuration

## 🎯 Future Enhancements

- Video conferencing integration for virtual mediation
- AI-powered case categorization and routing
- Multi-language support
- Mobile application
- Advanced analytics and reporting
- Integration with legal databases
- Automated agreement generation
- Payment processing for mediation fees