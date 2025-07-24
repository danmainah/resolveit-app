import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

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

export const validateUserRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),

    body('phone')
        .matches(/^\+?[\d\s\-\(\)]{10,15}$/)
        .withMessage('Please provide a valid phone number'),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('age')
        .isInt({ min: 18, max: 120 })
        .withMessage('Age must be between 18 and 120'),

    body('gender')
        .isIn(['MALE', 'FEMALE', 'OTHER'])
        .withMessage('Gender must be MALE, FEMALE, or OTHER'),

    body('address.street')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Street address must be between 5 and 200 characters'),

    body('address.city')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),

    body('address.zipCode')
        .matches(/^\d{5,10}$/)
        .withMessage('Zip code must be 5-10 digits'),

    handleValidationErrors
];

export const validateCaseRegistration = [
    body('caseType')
        .isIn(['FAMILY', 'BUSINESS', 'CRIMINAL', 'PROPERTY', 'OTHER'])
        .withMessage('Invalid case type'),

    body('issueDescription')
        .trim()
        .isLength({ min: 50, max: 2000 })
        .withMessage('Issue description must be between 50 and 2000 characters'),

    body('oppositeParty.name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Opposite party name must be between 2 and 100 characters'),

    body('oppositeParty.email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email for opposite party'),

    body('oppositeParty.phone')
        .optional()
        .matches(/^\+?[\d\s\-\(\)]{10,15}$/)
        .withMessage('Please provide a valid phone number for opposite party'),

    body('isCourtPending')
        .isBoolean()
        .withMessage('Court pending status must be true or false'),

    body('caseNumber')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Case number must be between 1 and 50 characters'),

    body('firNumber')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('FIR number must be between 1 and 50 characters'),

    body('courtPoliceStation')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Court/Police station name must be between 2 and 200 characters'),

    handleValidationErrors
];

export const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];