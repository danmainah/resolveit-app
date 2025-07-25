import express, { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { notifyWorkshopRegistrants } from '../utils/notifications';

const router: Router = express.Router();

// Get all workshops
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { upcoming = 'true', page = 1, limit = 10 } = req.query;
    
    const where: any = { isActive: true };
    
    if (upcoming === 'true') {
      where.scheduledAt = { gte: new Date() };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [workshops, total] = await Promise.all([
      prisma.workshop.findMany({
        where,
        include: {
          _count: {
            select: { registrations: true }
          }
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.workshop.count({ where })
    ]);

    res.json({
      workshops,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single workshop
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { registrations: true }
        }
      }
    });

    if (!workshop || !workshop.isActive) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    res.json(workshop);
  } catch (error) {
    next(error);
  }
});

// Register for workshop (authenticated)
router.post('/:id/register', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if workshop exists and is active
    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    });

    if (!workshop || !workshop.isActive) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Check if workshop is full
    if (workshop._count.registrations >= workshop.maxParticipants) {
      return res.status(400).json({ message: 'Workshop is full' });
    }

    // Check if user is already registered
    const existingRegistration = await prisma.workshopRegistration.findUnique({
      where: {
        userId_workshopId: {
          userId,
          workshopId: id
        }
      }
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this workshop' });
    }

    const registration = await prisma.workshopRegistration.create({
      data: {
        userId,
        workshopId: id
      },
      include: {
        workshop: {
          select: { title: true, scheduledAt: true }
        }
      }
    });

    res.status(201).json(registration);
  } catch (error) {
    next(error);
  }
});

// Get user's workshop registrations (authenticated)
router.get('/user/registrations', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const registrations = await prisma.workshopRegistration.findMany({
      where: { userId },
      include: {
        workshop: true
      },
      orderBy: { registeredAt: 'desc' }
    });

    res.json(registrations);
  } catch (error) {
    next(error);
  }
});

// Admin routes
// Create workshop (admin only)
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, instructor, maxParticipants, scheduledAt, duration, meetingUrl } = req.body;

    const workshop = await prisma.workshop.create({
      data: {
        title,
        description,
        instructor,
        maxParticipants,
        scheduledAt: new Date(scheduledAt),
        duration,
        meetingUrl
      }
    });

    res.status(201).json(workshop);
  } catch (error) {
    next(error);
  }
});

// Update workshop (admin only)
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { title, description, instructor, maxParticipants, scheduledAt, duration, meetingUrl, isActive } = req.body;

    const existingWorkshop = await prisma.workshop.findUnique({
      where: { id }
    });

    const workshop = await prisma.workshop.update({
      where: { id },
      data: {
        title,
        description,
        instructor,
        maxParticipants,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        duration,
        meetingUrl,
        isActive
      }
    });

    // Notify registrants if workshop was cancelled
    if (existingWorkshop?.isActive && !isActive) {
      await notifyWorkshopRegistrants(
        id,
        'WORKSHOP_CANCELLED',
        'Workshop Cancelled',
        `The workshop "${title}" has been cancelled. We apologize for any inconvenience.`
      );
    }

    res.json(workshop);
  } catch (error) {
    next(error);
  }
});

// Mark attendance (admin only)
router.patch('/:workshopId/attendance/:userId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { workshopId, userId } = req.params;
    const { attended } = req.body;

    const registration = await prisma.workshopRegistration.update({
      where: {
        userId_workshopId: {
          userId,
          workshopId
        }
      },
      data: { attended }
    });

    res.json(registration);
  } catch (error) {
    next(error);
  }
});

export default router;