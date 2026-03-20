/**
 * Real-Time Socket.io Server for HITL Expert Intervention
 * Enables bidirectional communication between users and experts
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from '../utils/logger';
import { criticalInterventionService } from '../services/criticalInterventionService';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface UserSocketData {
  userId: string;
  sessionId: string;
}

interface ExpertSocketData {
  expertId: string;
  expertName: string;
}

interface HITLAlert {
  id: string;
  userId: string;
  sessionId: string;
  riskLevel: string;
  riskType: string;
  userMessage: string;
  detectedKeywords: string[];
  timestamp: Date;
}

// =============================================================================
// ROOM NAMING CONVENTIONS
// =============================================================================

const getUserRoom = (userId: string, sessionId: string) => `user_${userId}_${sessionId}`;
const getExpertRoom = () => 'expert_dashboard';
const getInterventionRoom = (alertId: string) => `intervention_${alertId}`;

// =============================================================================
// SOCKET.IO SERVER INITIALIZATION
// =============================================================================

export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://soulfriend-kendo260599s-projects.vercel.app',
        'https://soulfriend-git-main-kendo260599s-projects.vercel.app',
        'https://soulfriend-production.up.railway.app'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  logger.info('🔌 Socket.io server initializing...');

  // =============================================================================
  // USER NAMESPACE - For users in crisis
  // =============================================================================

  const userNamespace = io.of('/user');

  userNamespace.on('connection', (socket: Socket) => {
    const { userId, sessionId } = socket.handshake.query as { userId?: string; sessionId?: string };

    if (!userId || !sessionId) {
      logger.warn('User connected without userId/sessionId');
      socket.disconnect();
      return;
    }

    logger.info(`👤 User connected: ${userId} | Session: ${sessionId}`);

    // Join user's private room
    const userRoom = getUserRoom(userId, sessionId);
    socket.join(userRoom);

    // Handle user messages
    socket.on('user_message', async (data: { message: string; timestamp: Date }) => {
      const { message, timestamp } = data;

      logger.info(`💬 User message: ${userId} | ${message.substring(0, 50)}...`);

      // Broadcast back to user room (for multi-device sync)
      userNamespace.to(userRoom).emit('message_received', {
        from: 'user',
        message,
        timestamp
      });

      // Check if there's an active intervention for this session
      try {
        const activeAlert = await getActiveInterventionForSession(sessionId);
        
        if (activeAlert) {
          // Forward message to expert
          const interventionRoom = getInterventionRoom(activeAlert.id);
          io.of('/expert').to(interventionRoom).emit('user_message', {
            userId,
            sessionId,
            alertId: activeAlert.id,
            message,
            timestamp
          });
          
          logger.info(`📤 Message forwarded to expert in intervention: ${activeAlert.id}`);
        }
      } catch (error) {
        logger.error('Error checking active intervention:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`👤 User disconnected: ${userId}`);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Kết nối thành công với hệ thống hỗ trợ',
      userId,
      sessionId
    });
  });

  // =============================================================================
  // EXPERT NAMESPACE - For mental health professionals
  // =============================================================================

  const expertNamespace = io.of('/expert');

  expertNamespace.on('connection', (socket: Socket) => {
    const { expertId, expertName } = socket.handshake.query as { expertId?: string; expertName?: string };

    if (!expertId || !expertName) {
      logger.warn('Expert connected without credentials');
      socket.disconnect();
      return;
    }

    logger.info(`👨‍⚕️ Expert connected: ${expertName} (${expertId})`);

    // Join expert dashboard room (for broadcast alerts)
    socket.join(getExpertRoom());

    // Expert takes over an intervention
    socket.on('join_intervention', async (data: {
      alertId: string;
      userId: string;
      sessionId: string;
    }) => {
      const { alertId, userId, sessionId } = data;

      logger.info(`👨‍⚕️ Expert ${expertName} joining intervention: ${alertId}`);

      // Join intervention room
      const interventionRoom = getInterventionRoom(alertId);
      socket.join(interventionRoom);

      // Acknowledge alert in the system
      try {
        await criticalInterventionService.acknowledgeAlert(alertId, expertId);
        logger.info(`✅ Alert ${alertId} acknowledged by ${expertName}`);
      } catch (error) {
        logger.error(`Error acknowledging alert:`, error);
      }

      // Notify user that expert has joined
      const userRoom = getUserRoom(userId, sessionId);
      userNamespace.to(userRoom).emit('expert_joined', {
        expertName,
        message: `👨‍⚕️ Chuyên gia tâm lý ${expertName} đã tham gia cuộc trò chuyện. Xin chào bạn!`,
        timestamp: new Date()
      });

      // Send session history to expert (if available)
      try {
        const history = await getSessionHistory(sessionId);
        socket.emit('session_history', { alertId, history });
      } catch (error) {
        logger.error('Error retrieving session history:', error);
        socket.emit('session_history', { alertId, history: [] });
      }

      // Confirm join to expert
      socket.emit('intervention_joined', {
        alertId,
        userId,
        sessionId,
        message: 'Bạn đã tham gia can thiệp thành công'
      });
    });

    // Expert sends message to user
    socket.on('expert_message', async (data: {
      alertId: string;
      userId: string;
      sessionId: string;
      message: string;
      timestamp: Date;
    }) => {
      const { alertId, userId, sessionId, message, timestamp } = data;

      logger.info(`👨‍⚕️ Expert message to ${userId}: ${message.substring(0, 50)}...`);

      // Save message to database (implement later)
      // await saveInterventionMessage(alertId, sessionId, message, 'expert', expertId);

      // Send to user
      const userRoom = getUserRoom(userId, sessionId);
      userNamespace.to(userRoom).emit('expert_message', {
        from: 'expert',
        expertName,
        message,
        timestamp
      });

      // Broadcast to other experts in same intervention (for collaboration)
      const interventionRoom = getInterventionRoom(alertId);
      socket.to(interventionRoom).emit('expert_message_sent', {
        expertId,
        expertName,
        message,
        timestamp
      });

      logger.info(`📤 Expert message delivered to user ${userId}`);
    });

    // Expert closes intervention
    socket.on('close_intervention', async (data: {
      alertId: string;
      userId: string;
      sessionId: string;
      notes?: string;
    }) => {
      const { alertId, userId, sessionId, notes } = data;

      logger.info(`👨‍⚕️ Expert ${expertName} closing intervention: ${alertId}`);

      try {
        // Resolve alert in system
        await criticalInterventionService.resolveAlert(alertId, notes || 'Intervention completed by expert');
        
        // Notify user
        const userRoom = getUserRoom(userId, sessionId);
        userNamespace.to(userRoom).emit('intervention_ended', {
          message: `👨‍⚕️ Chuyên gia đã kết thúc can thiệp. Bạn có thể tiếp tục chat với AI hoặc liên hệ lại bất cứ lúc nào.
          
📧 Email: kendo2605@gmail.com
📞 Hotline: 0938021111`,
          timestamp: new Date()
        });

        // Leave intervention room
        const interventionRoom = getInterventionRoom(alertId);
        socket.leave(interventionRoom);

        // Confirm to expert
        socket.emit('intervention_closed', { alertId, success: true });

        logger.info(`✅ Intervention ${alertId} closed successfully`);
      } catch (error) {
        logger.error(`Error closing intervention:`, error);
        socket.emit('intervention_closed', { alertId, success: false, error: 'Failed to close intervention' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`👨‍⚕️ Expert disconnected: ${expertName}`);
    });

    // Send welcome message
    socket.emit('connected', {
      message: `Xin chào ${expertName}! Bạn đã kết nối với Expert Dashboard.`,
      expertId,
      expertName
    });
  });

  // =============================================================================
  // HITL ALERT BROADCASTING - Called when crisis detected
  // =============================================================================

  (io as any).broadcastHITLAlert = async (alert: HITLAlert) => {
    logger.warn(`🚨 Broadcasting HITL alert to all experts: ${alert.id}`);

    // Broadcast to all connected experts
    expertNamespace.to(getExpertRoom()).emit('hitl_alert', {
      alertId: alert.id,
      userId: alert.userId,
      sessionId: alert.sessionId,
      riskLevel: alert.riskLevel,
      riskType: alert.riskType,
      message: alert.userMessage,
      keywords: alert.detectedKeywords,
      timestamp: alert.timestamp
    });

    logger.info(`📡 HITL alert broadcasted to expert dashboard`);
  };

  logger.info('✅ Socket.io server initialized successfully');
  logger.info('   - User namespace: /user');
  logger.info('   - Expert namespace: /expert');

  return io;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get active intervention for a session
 */
async function getActiveInterventionForSession(sessionId: string): Promise<HITLAlert | null> {
  try {
    // Check if there's an active alert for this session
    const activeAlerts = criticalInterventionService.getActiveAlerts();
    
    for (const alert of activeAlerts.values()) {
      if (alert.sessionId === sessionId && 
          (alert.status === 'acknowledged' || alert.status === 'pending')) {
        return {
          id: alert.id,
          userId: alert.userId,
          sessionId: alert.sessionId,
          riskLevel: alert.riskLevel,
          riskType: alert.riskType,
          userMessage: alert.userMessage,
          detectedKeywords: alert.detectedKeywords,
          timestamp: alert.timestamp
        };
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting active intervention:', error);
    return null;
  }
}

/**
 * Get session conversation history
 */
async function getSessionHistory(sessionId: string): Promise<any[]> {
  try {
    // TODO: Implement MongoDB query to get conversation history
    // For now, return empty array
    return [];
  } catch (error) {
    logger.error('Error getting session history:', error);
    return [];
  }
}

export default initializeSocketServer;



