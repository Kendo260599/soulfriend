/**
 * Real-Time Socket.io Server for HITL Expert Intervention
 * Enables bidirectional communication between users and experts
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { criticalInterventionService } from '../services/criticalInterventionService';
import { expertMonitoringService } from '../services/pge/expertMonitoringService';
import InterventionMessage from '../models/InterventionMessage';
import ConversationLog from '../models/ConversationLog';

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
const getDirectChatRoom = (userId: string, sessionId: string) => `direct_${userId}_${sessionId}`;

// Track connected users for expert direct chat
const connectedUsers = new Map<string, { userId: string; sessionId: string; connectedAt: Date }>();

// =============================================================================
// SOCKET.IO SERVER INITIALIZATION
// =============================================================================

export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  const SOCKET_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://soulfriend.vercel.app',
    'https://soulfriend-v4.vercel.app',
    'https://soulfriend-api.onrender.com',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (SOCKET_ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  logger.info('🔌 Socket.io server initializing...');

  // =============================================================================
  // SOCKET AUTHENTICATION MIDDLEWARE
  // =============================================================================

  const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      logger.warn(`🔒 Socket connection rejected: No auth token provided`);
      return next(new Error('Authentication required'));
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return next(new Error('Server configuration error'));
    }
    try {
      const decoded = jwt.verify(token as string, jwtSecret) as any;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      logger.warn(`🔒 Socket connection rejected: Invalid token`);
      return next(new Error('Invalid authentication token'));
    }
  };

  // =============================================================================
  // USER NAMESPACE - For users in crisis
  // =============================================================================

  const userNamespace = io.of('/user');

  // User namespace does NOT require JWT (users are anonymous session-based)
  // But we validate userId/sessionId presence
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

    // Track connected user
    connectedUsers.set(`${userId}_${sessionId}`, { userId, sessionId, connectedAt: new Date() });

    // Notify expert dashboard about new user
    io.of('/expert').to(getExpertRoom()).emit('user_connected', {
      userId, sessionId, connectedAt: new Date()
    });

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
          // Persist user message to MongoDB
          InterventionMessage.create({
            alertId: activeAlert.id,
            sessionId,
            userId,
            sender: 'user',
            message,
            timestamp: timestamp || new Date(),
          }).catch(err => logger.warn('Failed to persist user intervention message:', err));

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

      // Also forward to direct chat room (if expert is chatting directly)
      const directRoom = getDirectChatRoom(userId, sessionId);
      const directRoomSockets = await io.of('/expert').in(directRoom).fetchSockets();
      if (directRoomSockets.length > 0) {
        io.of('/expert').to(directRoom).emit('user_message', {
          userId, sessionId, message, timestamp
        });
        // Persist user message for direct chat history
        InterventionMessage.create({
          sessionId,
          sender: 'user',
          senderName: userId,
          message,
          timestamp: timestamp || new Date(),
          read: false,
        }).catch(err => logger.warn('Failed to persist direct chat user message:', err));
      }
    });

    // Typing indicator
    socket.on('user_typing', (data: { isTyping: boolean }) => {
      getActiveInterventionForSession(sessionId).then(activeAlert => {
        if (activeAlert) {
          const interventionRoom = getInterventionRoom(activeAlert.id);
          io.of('/expert').to(interventionRoom).emit('user_typing', {
            userId,
            sessionId,
            alertId: activeAlert.id,
            isTyping: data.isTyping,
          });
        }
      }).catch(() => {});
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`👤 User disconnected: ${userId}`);
      connectedUsers.delete(`${userId}_${sessionId}`);
      io.of('/expert').to(getExpertRoom()).emit('user_disconnected', { userId, sessionId });
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

  // Apply authentication to expert namespace
  expertNamespace.use(authenticateSocket);

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
        expertName: 'CHUN❤️',
        message: `❤️ CHUN❤️ đã tham gia cuộc trò chuyện. Xin chào bạn!`,
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

      // Persist message to MongoDB
      InterventionMessage.create({
        alertId,
        sessionId,
        userId,
        sender: 'expert',
        senderName: expertName,
        senderId: expertId,
        message,
        timestamp: timestamp || new Date(),
      }).catch(err => logger.warn('Failed to persist expert intervention message:', err));

      // Send to user
      const userRoom = getUserRoom(userId, sessionId);
      userNamespace.to(userRoom).emit('expert_message', {
        from: 'expert',
        expertName: 'CHUN❤️',
        message,
        timestamp
      });

      // Broadcast to other experts in same intervention (for collaboration)
      const interventionRoom = getInterventionRoom(alertId);
      socket.to(interventionRoom).emit('expert_message_sent', {
        expertId,
        expertName: 'CHUN❤️',
        message,
        timestamp
      });

      logger.info(`📤 Expert message delivered to user ${userId}`);
    });

    // Expert typing indicator
    socket.on('expert_typing', (data: {
      alertId: string;
      userId: string;
      sessionId: string;
      isTyping: boolean;
    }) => {
      const userRoom = getUserRoom(data.userId, data.sessionId);
      userNamespace.to(userRoom).emit('expert_typing', {
        expertName: 'CHUN❤️',
        isTyping: data.isTyping,
      });
    });

    // Mark messages as read
    socket.on('mark_read', async (data: { alertId: string }) => {
      try {
        await InterventionMessage.updateMany(
          { alertId: data.alertId, sender: 'user', read: false },
          { read: true }
        );
      } catch (err) {
        logger.warn('Failed to mark messages as read:', err);
      }
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
          message: `❤️ CHUN❤️ đã kết thúc can thiệp. Bạn có thể tiếp tục chat với 𝑺𝒆𝒄𝒓𝒆𝒕❤️ hoặc liên hệ lại bất cứ lúc nào.
          
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

    // =========================================================================
    // DIRECT CHAT — Expert initiates conversation with any active user
    // =========================================================================

    // Expert requests list of connected users
    socket.on('get_active_users', () => {
      const users = Array.from(connectedUsers.values());
      socket.emit('active_users', users);
    });

    // Expert starts direct chat with a user
    socket.on('start_direct_chat', async (data: {
      userId: string;
      sessionId: string;
    }) => {
      const { userId, sessionId } = data;
      logger.info(`👨‍⚕️ Expert ${expertName} starting direct chat with ${userId}`);

      const directRoom = getDirectChatRoom(userId, sessionId);
      socket.join(directRoom);

      // Load conversation history
      try {
        const history = await getSessionHistory(sessionId);
        socket.emit('direct_chat_history', { userId, sessionId, history });
      } catch (error) {
        socket.emit('direct_chat_history', { userId, sessionId, history: [] });
      }

      // Notify user
      const userRoom = getUserRoom(userId, sessionId);
      userNamespace.to(userRoom).emit('expert_joined', {
        expertName: 'CHUN❤️',
        message: `❤️ CHUN❤️ đã tham gia cuộc trò chuyện.`,
        timestamp: new Date()
      });

      socket.emit('direct_chat_started', { userId, sessionId, success: true });
    });

    // Expert sends direct message to user (no alertId needed)
    socket.on('direct_message', async (data: {
      userId: string;
      sessionId: string;
      message: string;
      timestamp: Date;
    }) => {
      const { userId, sessionId, message, timestamp } = data;

      logger.info(`💬 Expert direct message to ${userId}: ${message.substring(0, 50)}...`);

      // Persist to InterventionMessage for proper history retrieval
      InterventionMessage.create({
        sessionId,
        sender: 'expert',
        senderName: expertName,
        message,
        timestamp: timestamp || new Date(),
        read: true,
      }).catch(err => logger.warn('Failed to persist direct message:', err));

      // Send to user
      const userRoom = getUserRoom(userId, sessionId);
      userNamespace.to(userRoom).emit('expert_message', {
        from: 'expert',
        expertName: 'CHUN❤️',
        message,
        timestamp
      });

      // Broadcast to other experts in same direct chat
      const directRoom = getDirectChatRoom(userId, sessionId);
      socket.to(directRoom).emit('expert_message_sent', {
        expertId, expertName: 'CHUN❤️', message, timestamp
      });
    });

    // Expert ends direct chat
    socket.on('end_direct_chat', (data: { userId: string; sessionId: string }) => {
      const { userId, sessionId } = data;
      const directRoom = getDirectChatRoom(userId, sessionId);
      socket.leave(directRoom);

      // Notify user
      const userRoom = getUserRoom(userId, sessionId);
      userNamespace.to(userRoom).emit('intervention_ended', {
        message: '❤️ CHUN❤️ đã kết thúc cuộc trò chuyện. Bạn có thể tiếp tục chat với 𝑺𝒆𝒄𝒓𝒆𝒕❤️.',
        timestamp: new Date()
      });

      socket.emit('direct_chat_ended', { userId, sessionId, success: true });
      logger.info(`👨‍⚕️ Expert ${expertName} ended direct chat with ${userId}`);
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

  // =============================================================================
  // PGE MONITORING BROADCASTER — Real-time expert monitoring (Phase 13)
  // =============================================================================

  expertMonitoringService.setBroadcaster((event: string, data: any) => {
    expertNamespace.to(getExpertRoom()).emit(event, data);
  });

  // Hydrate monitoring service with recent user data from DB
  expertMonitoringService.hydrate().catch(err => {
    logger.warn('Expert monitoring hydration failed:', err);
  });

  logger.info('✅ Socket.io server initialized successfully');
  logger.info('   - User namespace: /user');
  logger.info('   - Expert namespace: /expert');
  logger.info('   - Direct chat: enabled');
  logger.info('   - PGE monitoring broadcaster: attached');

  // Expose connected users for REST API access
  (io as any).getConnectedUsers = () => Array.from(connectedUsers.values());

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
    // 1. Get intervention messages from MongoDB
    const interventionMsgs = await InterventionMessage.find({ sessionId })
      .sort({ timestamp: 1 })
      .limit(100)
      .lean();

    if (interventionMsgs.length > 0) {
      return interventionMsgs.map(m => ({
        sender: m.sender,
        senderName: m.senderName,
        message: m.message,
        timestamp: m.timestamp,
        read: m.read,
      }));
    }

    // 2. Fallback: Get recent chatbot conversation from ConversationLog
    const chatLogs = await ConversationLog.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    const history: any[] = [];
    for (const log of chatLogs.reverse()) {
      history.push(
        { sender: 'user', message: log.userMessage, timestamp: log.timestamp },
        { sender: 'assistant', message: log.aiResponse, timestamp: log.timestamp }
      );
    }
    return history;
  } catch (error) {
    logger.error('Error getting session history:', error);
    return [];
  }
}

export default initializeSocketServer;

