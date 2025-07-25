import express, { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// Get agreement templates (admin only)
router.get('/templates', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const templates = await prisma.agreementTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Create agreement template (admin only)
router.post('/templates', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, content, category } = req.body;

    const template = await prisma.agreementTemplate.create({
      data: {
        name,
        description,
        content,
        category
      }
    });

    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

// Create agreement from template
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId, templateId, content } = req.body;
    const userId = (req as any).user.id;

    // Check if user has access to this case
    const caseData = await prisma.case.findFirst({
      where: {
        id: caseId,
        OR: [
          { plaintiffId: userId },
          { defendantId: userId },
          { panel: { members: { some: { userId } } } }
        ]
      }
    });

    if (!caseData && (req as any).user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if agreement already exists for this case
    const existingAgreement = await prisma.agreement.findUnique({
      where: { caseId }
    });

    if (existingAgreement) {
      return res.status(400).json({ message: 'Agreement already exists for this case' });
    }

    const agreement = await prisma.agreement.create({
      data: {
        caseId,
        templateId,
        content
      },
      include: {
        template: true,
        case: {
          include: {
            plaintiff: { select: { id: true, name: true, email: true } },
            defendant: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    res.status(201).json(agreement);
  } catch (error) {
    next(error);
  }
});

// Get agreement by case ID
router.get('/case/:caseId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const userId = (req as any).user.id;

    // Check if user has access to this case
    const caseData = await prisma.case.findFirst({
      where: {
        id: caseId,
        OR: [
          { plaintiffId: userId },
          { defendantId: userId },
          { panel: { members: { some: { userId } } } }
        ]
      }
    });

    if (!caseData && (req as any).user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const agreement = await prisma.agreement.findUnique({
      where: { caseId },
      include: {
        template: true,
        signatures: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        case: {
          include: {
            plaintiff: { select: { id: true, name: true, email: true } },
            defendant: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    res.json(agreement);
  } catch (error) {
    next(error);
  }
});

// Update agreement
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content, status } = req.body;
    const userId = (req as any).user.id;

    // Get agreement with case info
    const existingAgreement = await prisma.agreement.findUnique({
      where: { id },
      include: {
        case: true
      }
    });

    if (!existingAgreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    // Check if user has access to modify this agreement
    const hasAccess = existingAgreement.case.plaintiffId === userId ||
                     existingAgreement.case.defendantId === userId ||
                     (req as any).user.role === 'ADMIN';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Don't allow modification if already signed
    if (existingAgreement.status === 'SIGNED' || existingAgreement.status === 'EXECUTED') {
      return res.status(400).json({ message: 'Cannot modify signed agreement' });
    }

    const agreement = await prisma.agreement.update({
      where: { id },
      data: {
        content,
        status
      },
      include: {
        template: true,
        signatures: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    res.json(agreement);
  } catch (error) {
    next(error);
  }
});

// Sign agreement
router.post('/:id/sign', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Get agreement with case info
    const agreement = await prisma.agreement.findUnique({
      where: { id },
      include: {
        case: true,
        signatures: true
      }
    });

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    // Check if user is authorized to sign
    const canSign = agreement.case.plaintiffId === userId ||
                   agreement.case.defendantId === userId;

    if (!canSign) {
      return res.status(403).json({ message: 'Not authorized to sign this agreement' });
    }

    // Check if user already signed
    const existingSignature = agreement.signatures.find(sig => sig.userId === userId);
    if (existingSignature) {
      return res.status(400).json({ message: 'Already signed this agreement' });
    }

    // Create signature
    const signature = await prisma.agreementSignature.create({
      data: {
        agreementId: id,
        userId,
        ipAddress,
        userAgent
      }
    });

    // Check if all parties have signed
    const updatedAgreement = await prisma.agreement.findUnique({
      where: { id },
      include: {
        signatures: true,
        case: true
      }
    });

    const requiredSignatures = [updatedAgreement!.case.plaintiffId];
    if (updatedAgreement!.case.defendantId) {
      requiredSignatures.push(updatedAgreement!.case.defendantId);
    }

    const signedUserIds = updatedAgreement!.signatures.map(sig => sig.userId);
    const allSigned = requiredSignatures.every(userId => signedUserIds.includes(userId));

    if (allSigned) {
      await prisma.agreement.update({
        where: { id },
        data: {
          status: 'SIGNED',
          signedAt: new Date()
        }
      });

      // Update case status to resolved
      await prisma.case.update({
        where: { id: agreement.caseId },
        data: { status: 'RESOLVED' }
      });
    }

    res.json({ signature, allSigned });
  } catch (error) {
    next(error);
  }
});

// Get agreement PDF (placeholder - would integrate with PDF generation library)
router.get('/:id/pdf', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Get agreement with access check
    const agreement = await prisma.agreement.findUnique({
      where: { id },
      include: {
        case: true,
        signatures: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        template: true
      }
    });

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    // Check access
    const hasAccess = agreement.case.plaintiffId === userId ||
                     agreement.case.defendantId === userId ||
                     (req as any).user.role === 'ADMIN';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // TODO: Implement PDF generation
    // For now, return agreement data that can be used to generate PDF on frontend
    res.json({
      message: 'PDF generation endpoint - implement with PDF library',
      agreement: {
        content: agreement.content,
        signatures: agreement.signatures,
        createdAt: agreement.createdAt,
        signedAt: agreement.signedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;