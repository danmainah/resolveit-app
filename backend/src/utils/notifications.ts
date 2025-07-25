import prisma from '../config/database';

export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  caseId?: string
) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        caseId
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const notifyWorkshopRegistrants = async (
  workshopId: string,
  type: 'WORKSHOP_REMINDER' | 'WORKSHOP_CANCELLED',
  title: string,
  message: string
) => {
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        registrations: {
          include: {
            user: true
          }
        }
      }
    });

    if (!workshop) return;

    const notifications = workshop.registrations.map(registration => ({
      userId: registration.userId,
      type,
      title,
      message,
      isRead: false
    }));

    await prisma.notification.createMany({
      data: notifications
    });
  } catch (error) {
    console.error('Error notifying workshop registrants:', error);
  }
};

export const notifyNewResource = async (
  resourceId: string,
  title: string,
  message: string
) => {
  try {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { isVerified: true },
      select: { id: true }
    });

    const notifications = users.map(user => ({
      userId: user.id,
      type: 'RESOURCE_PUBLISHED' as any,
      title,
      message,
      isRead: false
    }));

    await prisma.notification.createMany({
      data: notifications
    });
  } catch (error) {
    console.error('Error notifying about new resource:', error);
  }
};

export const notifyAgreementReady = async (
  caseId: string,
  title: string,
  message: string
) => {
  try {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        plaintiff: true,
        defendant: true
      }
    });

    if (!caseData) return;

    const notifications = [];
    
    notifications.push({
      userId: caseData.plaintiffId,
      type: 'AGREEMENT_READY' as any,
      title,
      message,
      caseId,
      isRead: false
    });

    if (caseData.defendantId) {
      notifications.push({
        userId: caseData.defendantId,
        type: 'AGREEMENT_READY' as any,
        title,
        message,
        caseId,
        isRead: false
      });
    }

    await prisma.notification.createMany({
      data: notifications
    });
  } catch (error) {
    console.error('Error notifying about agreement:', error);
  }
};