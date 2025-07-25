import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Enhanced validation with security checks
export const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must contain only letters and spaces'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Valid email is required'),

  body('phone')
    .matches(/^\+?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Valid phone number is required'),

  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number and special character'),

  body('age')
    .isInt({ min: 18, max: 120 })
    .withMessage('Age must be between 18 and 120'),

  body('gender')
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('Gender must be MALE, FEMALE, or OTHER'),

  body('address.street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .matches(/^[a-zA-Z0-9\s\-\,\.]+$/)
    .withMessage('Street address contains invalid characters'),

  body('address.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s\-]+$/)
    .withMessage('City name contains invalid characters'),

  body('address.zipCode')
    .matches(/^[\d\-\s]{3,10}$/)
    .withMessage('Invalid zip code format'),
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('password')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password is required'),
];

export const validateCaseCreation = [
  body('caseType')
    .isIn(['FAMILY', 'BUSINESS', 'CRIMINAL', 'PROPERTY', 'OTHER'])
    .withMessage('Invalid case type'),

  body('issueDescription')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .matches(/^[a-zA-Z0-9\s\.\,\!\?\-\(\)]+$/)
    .withMessage('Issue description contains invalid characters'),

  body('isCourtPending')
    .optional()
    .isBoolean()
    .withMessage('Court pending must be boolean'),

  body('caseNumber')
    .optional()
    .matches(/^[A-Z0-9\-\/]+$/)
    .withMessage('Invalid case number format'),

  body('firNumber')
    .optional()
    .matches(/^[A-Z0-9\-\/]+$/)
    .withMessage('Invalid FIR number format'),

  body('courtPoliceStation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .matches(/^[a-zA-Z0-9\s\-\,\.]+$/)
    .withMessage('Court/Police station name contains invalid characters'),
];

export const validateOppositeParty = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must contain only letters and spaces'),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Valid phone number is required'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .matches(/^[a-zA-Z0-9\s\-\,\.]+$/)
    .withMessage('Address contains invalid characters'),
];

export const validateResourceCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .matches(/^[a-zA-Z0-9\s\-\.\,\!\?]+$/)
    .withMessage('Title contains invalid characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .matches(/^[a-zA-Z0-9\s\-\.\,\!\?\(\)]+$/)
    .withMessage('Description contains invalid characters'),

  body('content')
    .trim()
    .isLength({ min: 50, max: 10000 })
    .withMessage('Content must be between 50 and 10000 characters'),

  body('type')
    .isIn(['ARTICLE', 'VIDEO', 'WORKSHOP', 'GUIDE', 'TEMPLATE'])
    .withMessage('Invalid resource type'),

  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s\-]+$/)
    .withMessage('Category contains invalid characters'),

  body('author')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s\-\.]+$/)
    .withMessage('Author name contains invalid characters'),

  body('videoUrl')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Invalid video URL'),

  body('thumbnailUrl')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Invalid thumbnail URL'),
];

export const validateWorkshopCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .matches(/^[a-zA-Z0-9\s\-\.\,\!\?]+$/)
    .withMessage('Title contains invalid characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .matches(/^[a-zA-Z0-9\s\-\.\,\!\?\(\)]+$/)
    .withMessage('Description contains invalid characters'),

  body('instructor')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s\-\.]+$/)
    .withMessage('Instructor name contains invalid characters'),

  body('maxParticipants')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max participants must be between 1 and 1000'),

  body('scheduledAt')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),

  body('meetingUrl')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Invalid meeting URL'),
];

export const validateIdParam = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
];

export const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .matches(/^[a-zA-Z_]+$/)
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateSearchQuery = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .matches(/^[a-zA-Z0-9\s\-\.]+$/)
    .withMessage('Search query contains invalid characters'),
];

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    return res.status(400).json({
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
};

// Additional security validation
export const validateNoScriptTags = (req: Request, res: Response, next: NextFunction) => {
  const checkForScripts = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(obj) ||
        /javascript:/gi.test(obj) ||
        /on\w+\s*=/gi.test(obj);
    }

    if (Array.isArray(obj)) {
      return obj.some(checkForScripts);
    }

    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkForScripts);
    }

    return false;
  };

  if (req.body && checkForScripts(req.body)) {
    return res.status(400).json({
      message: 'Script tags and JavaScript code are not allowed'
    });
  }

  if (req.query && checkForScripts(req.query)) {
    return res.status(400).json({
      message: 'Script tags and JavaScript code are not allowed in query parameters'
    });
  }

  next();
};

// File upload validation
export const validateFileUploadSecurity = (req: Request, res: Response, next: NextFunction) => {
  if (!req.files && !req.file) {
    return next();
  }

  const files = req.files ?
    (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) :
    [req.file];

  for (const file of files) {
    if (!file) continue;

    // Check for null bytes (directory traversal attempt)
    if (file.originalname.includes('\0')) {
      return res.status(400).json({
        message: 'Invalid file name detected'
      });
    }

    // Check for path traversal attempts
    if (file.originalname.includes('../') || file.originalname.includes('..\\')) {
      return res.status(400).json({
        message: 'Path traversal attempt detected'
      });
    }

    // Check file name length
    if (file.originalname.length > 255) {
      return res.status(400).json({
        message: 'File name too long'
      });
    }

    // Check for executable file signatures (magic bytes)
    const buffer = file.buffer;
    if (buffer) {
      const magicBytes = buffer.slice(0, 4);
      const executableSignatures = [
        [0x4D, 0x5A], // PE executable
        [0x7F, 0x45, 0x4C, 0x46], // ELF executable
        [0xCA, 0xFE, 0xBA, 0xBE], // Java class file
        [0xFE, 0xED, 0xFA, 0xCE], // Mach-O executable
      ];

      for (const signature of executableSignatures) {
        if (signature.every((byte, index) => magicBytes[index] === byte)) {
          return res.status(400).json({
            message: 'Executable files are not allowed'
          });
        }
      }
    }
  }

  next();
};