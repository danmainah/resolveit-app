import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import session from 'express-session'

import { config } from './config/env'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import caseRoutes from './routes/cases'
import adminRoutes from './routes/admin'
import { errorHandler } from './middleware/errorHandler'
import { setupSocketHandlers } from './socket/socketHandlers'
import { 
  apiRateLimit, 
  authRateLimit, 
  sanitizeInput, 
  preventSQLInjection, 
  validateFileUpload, 
  limitRequestSize, 
  preventParameterPollution, 
  securityHeaders 
} from './middleware/security'

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // We'll handle this in our custom middleware
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Session middleware for CSRF protection
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Security middleware stack
app.use(securityHeaders);
app.use(limitRequestSize);
app.use(preventParameterPollution);
app.use(sanitizeInput);
app.use(preventSQLInjection);
app.use(validateFileUpload);

// Rate limiting
app.use('/api', apiRateLimit);
app.use('/api/auth', authRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io setup
setupSocketHandlers(io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export { io };