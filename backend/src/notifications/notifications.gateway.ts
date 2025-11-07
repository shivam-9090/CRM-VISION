import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://192.168.1.2:3000'], // Frontend URLs
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        console.log('⚠️ WebSocket connection rejected: No token provided');
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify token with proper error handling
      let payload;
      try {
        payload = this.jwtService.verify(token);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          console.log('⚠️ WebSocket connection rejected: Token expired');
          client.emit('error', {
            message: 'Token expired. Please login again.',
          });
        } else if (err.name === 'JsonWebTokenError') {
          console.log('⚠️ WebSocket connection rejected: Invalid token');
          client.emit('error', { message: 'Invalid token' });
        } else {
          console.log(
            '⚠️ WebSocket connection rejected: Token verification failed',
          );
          client.emit('error', { message: 'Authentication failed' });
        }
        client.disconnect();
        return;
      }

      const userId = payload.id || payload.sub;
      if (!userId) {
        console.log('⚠️ WebSocket connection rejected: No user ID in token');
        client.emit('error', { message: 'Invalid token payload' });
        client.disconnect();
        return;
      }

      // Store socket connection
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.add(client.id);
      }

      // Join user-specific room
      client.join(`user:${userId}`);
      if (payload.companyId) {
        client.join(`company:${payload.companyId}`);
      }

      client.data.userId = userId;
      client.data.companyId = payload.companyId;

      console.log(`✅ WebSocket connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      console.error('❌ WebSocket connection error:', error.message || error);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
    console.log(
      `🔌 WebSocket disconnected: ${client.id}${userId ? ` (User: ${userId})` : ''}`,
    );
  }

  @SubscribeMessage('getUnreadCount')
  async handleGetUnreadCount(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    const companyId = client.data.companyId;

    if (!userId || !companyId) {
      return { event: 'error', data: 'Unauthorized' };
    }

    const count = await this.notificationsService.getUnreadCount(
      userId,
      companyId,
    );
    return { event: 'unreadCount', data: count };
  }

  // Emit notification to specific user
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Emit notification to all users in a company
  emitToCompany(companyId: string, event: string, data: any) {
    this.server.to(`company:${companyId}`).emit(event, data);
  }

  // Send notification (creates DB record and emits via WebSocket)
  async sendNotification(
    userId: string,
    companyId: string,
    type: any,
    title: string,
    message: string,
    entityType?: string,
    entityId?: string,
  ) {
    // Create notification in database
    const notification = await this.notificationsService.create(
      {
        type,
        title,
        message,
        entityType,
        entityId,
        userId,
      },
      companyId,
    );

    // Emit to user via WebSocket
    this.emitToUser(userId, 'notification', notification);

    // Also update unread count
    const unreadCount = await this.notificationsService.getUnreadCount(
      userId,
      companyId,
    );
    this.emitToUser(userId, 'unreadCount', unreadCount);

    return notification;
  }
}
