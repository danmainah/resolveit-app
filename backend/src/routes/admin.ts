import express, { Request, Response, NextFunction, Router } from 'express';
import prisma from '../config/database';
import { UserRole } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { io } from '../server';

const router: Router = express.Router();

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
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
      prisma.user.count({ where: { role: UserRole.USER } }),
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
      caseTypeDistribution: caseTypeStats.map((stat: any) => ({
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
router.get('/cases', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
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
router.post('/cases/:id/panel', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
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

// Get panel members
router.get('/panel-members', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.LAWYER, UserRole.RELIGIOUS_SCHOLAR, UserRole.SOCIAL_EXPERT]
        },
        isVerified: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
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

// Add panel members
router.post('/panel-members', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignments } = req.body; // Array of { userId, role }

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ message: 'Assignments array is required' });
    }

    // Validate roles
    const validRoles = [UserRole.LAWYER, UserRole.RELIGIOUS_SCHOLAR, UserRole.SOCIAL_EXPERT];
    const invalidAssignments = assignments.filter(a => !validRoles.includes(a.role));

    if (invalidAssignments.length > 0) {
      return res.status(400).json({
        message: 'Invalid roles provided. Must be LAWYER, RELIGIOUS_SCHOLAR, or SOCIAL_EXPERT'
      });
    }

    // Update users with their specific panel roles
    const updatePromises = assignments.map(({ userId, role }) =>
      prisma.user.update({
        where: {
          id: userId,
          role: UserRole.USER
        },
        data: { role }
      })
    );

    const updatedUsers = await Promise.all(updatePromises);

    res.json({
      message: `${updatedUsers.length} users added as panel members`,
      count: updatedUsers.length,
      users: updatedUsers
    });
  } catch (error) {
    next(error);
  }
});

// Remove panel member
router.delete('/panel-members/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Update user back to regular user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: UserRole.USER
      }
    });

    res.json({
      message: 'Panel member removed successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Update panel member status
router.patch('/panel-members/:id/status', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // For now, we'll just update the user's verification status
    // In a more complex system, you might have a separate panel member status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isVerified: status === 'ACTIVE' }
    });

    res.json({
      message: 'Panel member status updated',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Contact opposite party
router.post('/cases/:id/contact-opposite-party', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    // Update case status
    await prisma.case.update({
      where: { id },
      data: { status: 'AWAITING_RESPONSE' }
    });

    // Create case update
    await prisma.caseUpdate.create({
      data: {
        caseId: id,
        status: 'AWAITING_RESPONSE',
        description: message || 'Opposite party has been contacted for mediation'
      }
    });

    // Create notification for plaintiff
    const case_ = await prisma.case.findUnique({
      where: { id },
      include: { plaintiff: true }
    });

    if (case_) {
      await prisma.notification.create({
        data: {
          userId: case_.plaintiffId,
          caseId: id,
          type: 'OPPOSITE_PARTY_CONTACTED',
          title: 'Opposite Party Contacted',
          message: 'The opposite party has been contacted regarding your case'
        }
      });
    }

    // Emit real-time update
    io.emit('caseUpdate', {
      caseId: id,
      status: 'AWAITING_RESPONSE',
      message: 'Opposite party contacted'
    });

    res.json({
      message: 'Opposite party contacted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update opposite party response
router.patch('/cases/:id/opposite-party-response', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { response, defendantId } = req.body; // ACCEPTED or REJECTED

    const updateData: any = {
      oppositePartyResponse: response
    };

    if (response === 'ACCEPTED') {
      updateData.status = 'ACCEPTED';
      if (defendantId) {
        updateData.defendantId = defendantId;
      }
    } else {
      updateData.status = 'REJECTED';
    }

    await prisma.case.update({
      where: { id },
      data: updateData
    });

    // Create case update
    await prisma.caseUpdate.create({
      data: {
        caseId: id,
        status: response === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED',
        description: `Opposite party ${response.toLowerCase()} mediation`
      }
    });

    // Create notification for plaintiff
    const case_ = await prisma.case.findUnique({
      where: { id },
      include: { plaintiff: true }
    });

    if (case_) {
      await prisma.notification.create({
        data: {
          userId: case_.plaintiffId,
          caseId: id,
          type: 'CASE_UPDATE',
          title: 'Case Update',
          message: `Opposite party has ${response.toLowerCase()} mediation for your case`
        }
      });
    }

    // Emit real-time update
    io.emit('caseUpdate', {
      caseId: id,
      status: updateData.status,
      message: `Opposite party ${response.toLowerCase()} mediation`
    });

    res.json({
      message: `Opposite party response updated to ${response}`
    });
  } catch (error) {
    next(error);
  }
});

// Start mediation
router.post('/cases/:id/start-mediation', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { scheduledDate } = req.body;

    await prisma.case.update({
      where: { id },
      data: {
        status: 'MEDIATION_IN_PROGRESS',
        mediationStartDate: new Date(scheduledDate)
      }
    });

    // Create case update
    await prisma.caseUpdate.create({
      data: {
        caseId: id,
        status: 'MEDIATION_IN_PROGRESS',
        description: `Mediation started on ${new Date(scheduledDate).toLocaleDateString()}`
      }
    });

    // Get case with participants
    const case_ = await prisma.case.findUnique({
      where: { id },
      include: {
        plaintiff: true,
        defendant: true,
        panel: {
          include: {
            members: true
          }
        }
      }
    });

    if (case_) {
      // Create notifications for all participants
      const notifications = [];

      // Plaintiff notification
      notifications.push({
        userId: case_.plaintiffId,
        caseId: id,
        type: 'MEDIATION_SCHEDULED' as any,
        title: 'Mediation Started',
        message: 'Mediation for your case has started'
      });

      // Defendant notification
      if (case_.defendantId) {
        notifications.push({
          userId: case_.defendantId,
          caseId: id,
          type: 'MEDIATION_SCHEDULED' as any,
          title: 'Mediation Started',
          message: 'Mediation for the case has started'
        });
      }

      // Panel member notifications
      if (case_.panel) {
        case_.panel.members.forEach((member: any) => {
          notifications.push({
            userId: member.userId,
            caseId: id,
            type: 'MEDIATION_SCHEDULED' as any,
            title: 'Mediation Started',
            message: 'Mediation for your assigned case has started'
          });
        });
      }

      await prisma.notification.createMany({
        data: notifications
      });
    }

    // Emit real-time update
    io.emit('caseUpdate', {
      caseId: id,
      status: 'MEDIATION_IN_PROGRESS',
      message: 'Mediation started'
    });

    res.json({
      message: 'Mediation started successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Resolve case
router.post('/cases/:id/resolve', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { resolution, resolutionDetails } = req.body; // RESOLVED or UNRESOLVED

    await prisma.case.update({
      where: { id },
      data: {
        status: resolution,
        mediationEndDate: new Date(),
        resolutionDetails
      }
    });

    // Create case update
    await prisma.caseUpdate.create({
      data: {
        caseId: id,
        status: resolution,
        description: resolutionDetails || `Case ${resolution.toLowerCase()}`
      }
    });

    // Get case with participants
    const case_ = await prisma.case.findUnique({
      where: { id },
      include: {
        plaintiff: true,
        defendant: true,
        panel: {
          include: {
            members: true
          }
        }
      }
    });

    if (case_) {
      // Create notifications for all participants
      const notifications = [];

      // Plaintiff notification
      notifications.push({
        userId: case_.plaintiffId,
        caseId: id,
        type: 'CASE_RESOLVED' as any,
        title: 'Case Resolved',
        message: `Your case has been ${resolution.toLowerCase()}`
      });

      // Defendant notification
      if (case_.defendantId) {
        notifications.push({
          userId: case_.defendantId,
          caseId: id,
          type: 'CASE_RESOLVED' as any,
          title: 'Case Resolved',
          message: `The case has been ${resolution.toLowerCase()}`
        });
      }

      // Panel member notifications
      if (case_.panel) {
        case_.panel.members.forEach((member: any) => {
          notifications.push({
            userId: member.userId,
            caseId: id,
            type: 'CASE_RESOLVED' as any,
            title: 'Case Resolved',
            message: `The case you were mediating has been ${resolution.toLowerCase()}`
          });
        });
      }

      await prisma.notification.createMany({
        data: notifications
      });
    }

    // Emit real-time update
    io.emit('caseUpdate', {
      caseId: id,
      status: resolution,
      message: `Case ${resolution.toLowerCase()}`
    });

    res.json({
      message: `Case ${resolution.toLowerCase()} successfully`
    });
  } catch (error) {
    next(error);
  }
});

// Update user verification status
router.patch('/users/:id/verify', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
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