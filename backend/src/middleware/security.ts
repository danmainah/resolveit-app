import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

// Rate limiting for different endpoints
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Strict rate limiting for auth endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts, please try again later.'
);

// General API rate limiting
export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100 // 100 requests per window
);

// File upload rate limiting
export const uploadRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Too many file uploads, please try again later.'
);

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potential XSS characters from string inputs
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;

    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests and API endpoints with proper authentication
  if (req.method === 'GET' || req.path.startsWith('/api/auth/')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = (req.session as any)?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      message: 'Invalid CSRF token'
    });
  }

  next();
};

// SQL injection prevention (additional layer)
export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  const sqlInjectionPatterns = [
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi,
    /[';\\|*%<>^[\]{}()]/gi,
    /(\%3D|=)[^\n]*(\%27|'|\-\-|\%3B|;)/gi,
    /(\%27|')(\%6F|o|\%4F)(\%72|r|\%52)/gi
  ];

  const checkForSQLInjection = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlInjectionPatterns.some(pattern => pattern.test(value));
    }

    if (Array.isArray(value)) {
      return value.some(checkForSQLInjection);
    }

    if (value && typeof value === 'object') {
      return Object.values(value).some(checkForSQLInjection);
    }

    return false;
  };

  // Check request body
  if (req.body && checkForSQLInjection(req.body)) {
    return res.status(400).json({
      message: 'Invalid input detected'
    });
  }

  // Check query parameters
  if (req.query && checkForSQLInjection(req.query)) {
    return res.status(400).json({
      message: 'Invalid query parameters detected'
    });
  }

  next();
};

// File upload security
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.files && !req.file) {
    return next();
  }

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/avi',
    'audio/mpeg',
    'audio/wav'
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

  for (const file of files) {
    if (!file) continue;

    // Check file size
    if (file.size > maxFileSize) {
      return res.status(400).json({
        message: `File ${file.originalname} is too large. Maximum size is 10MB.`
      });
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: `File type ${file.mimetype} is not allowed.`
      });
    }

    // Check for executable file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs', '.jar'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    if (dangerousExtensions.includes(fileExtension)) {
      return res.status(400).json({
        message: `File extension ${fileExtension} is not allowed.`
      });
    }
  }

  next();
};

// Request size limiting
export const limitRequestSize = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = 50 * 1024 * 1024; // 50MB for multipart/form-data

  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return res.status(413).json({
      message: 'Request entity too large'
    });
  }

  next();
};

// Parameter pollution prevention
export const preventParameterPollution = (req: Request, res: Response, next: NextFunction) => {
  // Convert arrays to single values for specific parameters
  const singleValueParams = ['page', 'limit', 'sort', 'order'];

  for (const param of singleValueParams) {
    if (req.query[param] && Array.isArray(req.query[param])) {
      req.query[param] = (req.query[param] as string[])[0];
    }
  }

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict transport security (HTTPS only)
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https:; " +
    "connect-src 'self' ws: wss:;"
  );

  next();
};

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  next();
};