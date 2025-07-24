import express from 'express';
import prisma from '../config/database';
import { authenticateToken, requireVerified } from '../middleware/auth';
import { validateCaseRegistration } from '../middleware/validation';
import { upload, getDocumentType } from '../middleware/upload';
import { io } from '../server';

const router = express.Router();

// Register a new case
router.post('/register', 
  authenticateToken, 
  requireVerified,
  upload.array('documents', 10),
  validateCaseRegistration,
  async (req, res, next) => {
    try {
      const {
        caseType,
        issueDescription,
        oppositeParty,
        isCourtPending,
        caseNumber,
        firNumber,
        courtPoliceStation
      } = req.body;

      const userId = req.user.id;
      const files = req.files as Express.Multer.File[];

      // Create case with opposite party details
      const newCase = await prisma.case.create({
        data: {
          caseType,
          issueDescription,
          isCourtPending: isCourtPending === 'true',
          caseNumber: caseNumber || null,
          firNumber: firNumber || null,
          courtPoliceStation: courtPoliceStation || null,
          plaintiffId: userId,
          oppositePartyDetails: {
            create: {
              name: oppositeParty.name,
              email: oppositeParty.email || null,
              phone: oppositeParty.phone || null,
              address: oppositeParty.address || null
            }
          },
          documents: files ? {
            createMany: {
              data: files.map(file => ({
                filename: file.originalname,
                filepath: file.filename,
                fileType: getDocumentType(file.mimetype) as any,
                fileSize: file.size
              }))
            }
          } : undefined
        },
        include: {
          plaintiff: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          oppositePartyDetails: true,
          documents: true
        }
      });

      // Create initial case update
      await prisma.caseUpdate.create({
        data: {
          caseId: newCase.id,
          status: 'PENDING',
          description: 'Case registered and pending review'
        }
      });

      // Create notification for admin
      await prisma.notification.create({
        data: {
          userId: userId, // This should be admin user ID in real implementation
          caseId: newCase.id,
          type: 'CASE_UPDATE',
          title: 'New Case Registered',
          message: `A new ${caseType.toLowerCase()} case has been registered and is pending review.`
        }
      });

      // Emit real-time update
      io.emit('caseUpdate', {
        caseId: newCase.id,
        status: 'PENDING',
        message: 'New case registered'
      });

      res.status(201).json({
        message: 'Case registered successfully',
        case: newCase
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's cases
router.get('/my-cases', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, type, page = 1, limit = 10 } = req.query;

    const where: any = {
      OR: [
        { plaintiffId: userId },
        { defendantId: userId }
      ]
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.caseType = type;
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
              email: true
            }
          },
          defendant: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          oppositePartyDetails: true,
          documents: true,
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
          caseUpdates: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          }
        },
        orderBy: {
          createdAt: 'desc'
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

// Get case details
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const caseDetails = await prisma.case.findFirst({
      where: {
        id,
        OR: [
          { plaintiffId: userId },
          { defendantId: userId },
          // Allow panel members to view case
          {
            panel: {
              members: {
                some: {
                  userId
                }
              }
            }
          }
        ]
      },
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
        documents: true,
        panel: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        caseUpdates: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!caseDetails) {
      return res.status(404).json({
        message: 'Case not found or access denied'
      });
    }

    res.json({ case: caseDetails });
  } catch (error) {
    next(error);
  }
});

// Update case status (for admin/panel members)
router.patch('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, description } = req.body;
    const userId = req.user.id;

    // Check if user has permission to update case status
    const hasPermission = req.user.role === 'ADMIN' || 
      await prisma.panelMember.findFirst({
        where: {
          userId,
          panel: {
            caseId: id
          }
        }
      });

    if (!hasPermission) {
      return res.status(403).json({
        message: 'Permission denied'
      });
    }

    // Update case status
    const updatedCase = await prisma.case.update({
      where: { id },
      data: { status },
      include: {
        plaintiff: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        defendant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create case update record
    await prisma.caseUpdate.create({
      data: {
        caseId: id,
        status,
        description: description || `Case status updated to ${status}`
      }
    });

    // Create notifications for involved parties
    const notifications = [];
    if (updatedCase.plaintiff) {
      notifications.push({
        userId: updatedCase.plaintiff.id,
        caseId: id,
        type: 'CASE_UPDATE' as any,
        title: 'Case Status Updated',
        message: `Your case status has been updated to ${status}`
      });
    }
    if (updatedCase.defendant) {
      notifications.push({
        userId: updatedCase.defendant.id,
        caseId: id,
        type: 'CASE_UPDATE' as any,
        title: 'Case Status Updated',
        message: `Case status has been updated to ${status}`
      });
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }

    // Emit real-time update
    io.emit('caseUpdate', {
      caseId: id,
      status,
      message: description || `Case status updated to ${status}`
    });

    res.json({
      message: 'Case status updated successfully',
      case: updatedCase
    });
  } catch (error) {
    next(error);
  }
});

export default router;