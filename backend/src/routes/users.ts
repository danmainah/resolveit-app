import express, { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        address: true,
        _count: {
          select: {
            casesAsPlaintiff: true,
            casesAsDefendant: true,
            panelMemberships: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Get user notifications
router.get('/notifications', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          case: {
            select: {
              id: true,
              caseType: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      },
      unreadCount
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId
      },
      data: {
        isRead: true
      }
    });

    if (notification.count === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.patch('/notifications/read-all', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;