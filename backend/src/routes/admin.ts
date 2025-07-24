import express from 'express';
import prisma from '../config/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { io } from '../server';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const [
      totalCases,
      pendingCases,
      inProgressCases,
      resolvedCases,
      unresolvedCases,
      totalUsers,
      recentCases
    ] = await Promise.all([
      prisma.case.count(),
      prisma.case.count({ where: { status: 'PENDING' } }),
      prisma.case.count({ 
        where: { 
          status: { 
            in: ['AWAITING_RESPONSE', 'ACCEPTED', 'PANEL_CREATED', 'MEDIATION_IN_PROGRESS'] 
          } 
        } 
      }),
      prisma.case.count({ where: { status: 'RESOLVED' } }),
      prisma.case.count({ where: { status: 'UNRESOLVED' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.case.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          plaintiff: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    // Case type distribution
    const caseTypeStats = await prisma.case.groupBy({
      by: ['caseType'],
      _count: {
        id: true
      }
    });

    // Monthly case trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyCases = await prisma.case.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    // Process monthly data
    const monthlyStats = monthlyCases.reduce((acc: any, case_: any) => {
      const month = case_.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { total: 0, resolved: 0, pending: 0 };
      }
      acc[month].total++;
      if (case_.status === 'RESOLVED') {
        acc[month].resolved++;
      } else if (['PENDING', 'AWAITING_RESPONSE'].includes(case_.status)) {
        acc[month].pending++;
      }
      return acc;
    }, {});

    res.json({
      stats: {
        totalCases,
        pendingCases,
        inProgressCases,
        resolvedCases,
        unresolvedCases,
        totalUsers,
        resolutionRate: totalCases > 0 ? ((resolvedCases / totalCases) * 100).toFixed(1) : 0
      },
      caseTypeDistribution: caseTypeStats.map(stat => ({
        type: stat.caseType,
        count: stat._count.id
      })),
      monthlyTrends: Object.entries(monthlyStats).map(([month, data]: [string, any]) => ({
        month,
        ...data
      })),
      recentCases
    });
  } catch (error) {
    next(error);
  }
});

// Get all cases with filters
router.get('/cases', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { 
      status, 
      type, 
      page = 1, 
      limit = 20, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.caseType = type;
    }

    if (search) {
      where.OR = [
        {
          plaintiff: {
            name: {
              contains: search as string,
              mode: 'insensitive'
            }
          }
        },
        {
          issueDescription: {
            contains: search as string,
            mode: 'insensitive'
          }
        },
        {
          oppositePartyDetails: {
            name: {
              contains: search as string,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          plaintiff: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          defendant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          oppositePartyDetails: true,
          panel: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      role: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              documents: true,
              caseUpdates: true
            }
          }
        },
        orderBy: {
          [sortBy as string]: sortOrder
        },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.case.count({ where })
    ]);

    res.json({
      cases,
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

// Create panel for a case
router.post('/cases/:id/panel', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body; // Array of user IDs with their roles

    // Validate that we have required panel members
    const members = await prisma.user.findMany({
      where: {
        id: {
          in: memberIds.map((m: any) => m.userId)
        }
      }
    });

    const roles = memberIds.map((m: any) => m.role);
    const requiredRoles = ['LAWYER', 'RELIGIOUS_SCHOLAR', 'SOCIAL_EXPERT'];
    
    const hasAllRequiredRoles = requiredRoles.every(role => 
      roles.includes(role)
    );

    if (!hasAllRequiredRoles) {
      return res.status(400).json({
        message: 'Panel must include at least one lawyer, one religious scholar, and one social expert'
      });
    }

    // Create panel
    const panel = await prisma.panel.create({
      data: {
        caseId: id,
        members: {
          createMany: {
            data: memberIds.map((member: any) => ({
              userId: member.userId,
              role: member.role
            }))
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    // Update case status
    await prisma.case.update({
      where: { id },
      data: { status: 'PANEL_CREATED' }
    });

    // Create case update
    await prisma.caseUpdate.create({
      data: {
        caseId: id,
        status: 'PANEL_CREATED',
        description: 'Mediation panel has been created'
      }
    });

    // Create notifications for panel members
    const notifications = memberIds.map((member: any) => ({
      userId: member.userId,
      caseId: id,
      type: 'PANEL_INVITATION' as any,
      title: 'Panel Invitation',
      message: 'You have been invited to join a mediation panel'
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    // Emit real-time update
    io.emit('caseUpdate', {
      caseId: id,
      status: 'PANEL_CREATED',
      message: 'Mediation panel created'
    });

    res.status(201).json({
      message: 'Panel created successfully',
      panel
    });
  } catch (error) {
    next(error);
  }
});

// Get available panel members
router.get('/panel-members', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.query;

    const where: any = {
      role: {
        in: ['LAWYER', 'RELIGIOUS_SCHOLAR', 'SOCIAL_EXPERT']
      },
      isVerified: true
    };

    if (role) {
      where.role = role;
    }

    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            panelMemberships: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ members });
  } catch (error) {
    next(error);
  }
});

// Update user verification status
router.patch('/users/:id/verify', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isVerified },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: id,
        type: 'SYSTEM',
        title: isVerified ? 'Account Verified' : 'Account Verification Revoked',
        message: isVerified 
          ? 'Your account has been verified. You can now register cases.'
          : 'Your account verification has been revoked.'
      }
    });

    res.json({
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      user
    });
  } catch (error) {
    next(error);
  }
});

export default router;