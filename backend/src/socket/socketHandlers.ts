import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, role: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Join admin users to admin room
    if (socket.user!.role === 'ADMIN') {
      socket.join('admin_room');
    }

    // Handle case updates
    socket.on('joinCase', (caseId: string) => {
      socket.join(`case_${caseId}`);
    });

    socket.on('leaveCase', (caseId: string) => {
      socket.leave(`case_${caseId}`);
    });

    // Handle mediation session events
    socket.on('joinMediationSession', (caseId: string) => {
      socket.join(`mediation_${caseId}`);
      socket.to(`mediation_${caseId}`).emit('userJoinedSession', {
        userId: socket.userId,
        userName: socket.user!.name
      });
    });

    socket.on('leaveMediationSession', (caseId: string) => {
      socket.leave(`mediation_${caseId}`);
      socket.to(`mediation_${caseId}`).emit('userLeftSession', {
        userId: socket.userId,
        userName: socket.user!.name
      });
    });

    // Handle chat messages in mediation
    socket.on('mediationMessage', (data: {
      caseId: string;
      message: string;
      timestamp: string;
    }) => {
      socket.to(`mediation_${data.caseId}`).emit('newMediationMessage', {
        userId: socket.userId,
        userName: socket.user!.name,
        message: data.message,
        timestamp: data.timestamp
      });
    });

    // Handle typing indicators
    socket.on('typing', (data: { caseId: string; isTyping: boolean }) => {
      socket.to(`mediation_${data.caseId}`).emit('userTyping', {
        userId: socket.userId,
        userName: socket.user!.name,
        isTyping: data.isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user!.name} disconnected`);
    });
  });

  // Helper functions to emit events
  const emitToUser = (userId: string, event: string, data: any) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  const emitToCase = (caseId: string, event: string, data: any) => {
    io.to(`case_${caseId}`).emit(event, data);
  };

  const emitToAdmins = (event: string, data: any) => {
    io.to('admin_room').emit(event, data);
  };

  // Export helper functions for use in routes
  return {
    emitToUser,
    emitToCase,
    emitToAdmins
  };
};