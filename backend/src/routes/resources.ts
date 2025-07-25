import express, { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// Get all resources (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, category, search, page = 1, limit = 12 } = req.query;
    
    const where: any = { isPublished: true };
    
    if (type) where.type = type;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [resources, total, categories] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: {
          tags: true,
          _count: {
            select: { userProgress: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.resource.count({ where }),
      prisma.resource.findMany({
        where: { isPublished: true },
        select: { category: true },
        distinct: ['category']
      })
    ]);

    res.json({
      resources,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      },
      categories: categories.map(c => c.category)
    });
  } catch (error) {
    next(error);
  }
});

// Get single resource
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        tags: true,
        _count: {
          select: { userProgress: true }
        }
      }
    });

    if (!resource || !resource.isPublished) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Increment view count
    await prisma.resource.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json(resource);
  } catch (error) {
    next(error);
  }
});

// Update user progress (authenticated)
router.post('/:id/progress', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { progress, completed } = req.body;
    const userId = (req as any).user.id;

    const userProgress = await prisma.userResourceProgress.upsert({
      where: {
        userId_resourceId: {
          userId,
          resourceId: id
        }
      },
      update: {
        progress: progress || 0,
        completed: completed || false,
        lastAccessed: new Date()
      },
      create: {
        userId,
        resourceId: id,
        progress: progress || 0,
        completed: completed || false
      }
    });

    res.json(userProgress);
  } catch (error) {
    next(error);
  }
});

// Get user's progress (authenticated)
router.get('/user/progress', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const progress = await prisma.userResourceProgress.findMany({
      where: { userId },
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            type: true,
            category: true,
            thumbnailUrl: true
          }
        }
      },
      orderBy: { lastAccessed: 'desc' }
    });

    res.json(progress);
  } catch (error) {
    next(error);
  }
});

// Admin routes
// Create resource (admin only)
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, content, type, category, videoUrl, thumbnailUrl, author, tags } = req.body;

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        content,
        type,
        category,
        videoUrl,
        thumbnailUrl,
        author,
        tags: {
          connectOrCreate: tags?.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          })) || []
        }
      },
      include: { tags: true }
    });

    res.status(201).json(resource);
  } catch (error) {
    next(error);
  }
});

// Update resource (admin only)
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { title, description, content, type, category, videoUrl, thumbnailUrl, author, isPublished, tags } = req.body;

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        title,
        description,
        content,
        type,
        category,
        videoUrl,
        thumbnailUrl,
        author,
        isPublished,
        tags: {
          set: [],
          connectOrCreate: tags?.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          })) || []
        }
      },
      include: { tags: true }
    });

    res.json(resource);
  } catch (error) {
    next(error);
  }
});

// Delete resource (admin only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    await prisma.resource.delete({
      where: { id }
    });

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;