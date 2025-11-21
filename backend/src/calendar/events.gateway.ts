import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/calendar',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-company')
  handleJoinCompany(client: Socket, companyId: string) {
    client.join(`company:${companyId}`);
    this.logger.log(`Client ${client.id} joined company ${companyId}`);
    return { success: true };
  }

  @SubscribeMessage('leave-company')
  handleLeaveCompany(client: Socket, companyId: string) {
    client.leave(`company:${companyId}`);
    this.logger.log(`Client ${client.id} left company ${companyId}`);
    return { success: true };
  }

  /**
   * Emit meeting created event to all company members
   */
  emitMeetingCreated(companyId: string, meeting: any) {
    this.server.to(`company:${companyId}`).emit('meeting:created', meeting);
    this.logger.log(`Emitted meeting:created for company ${companyId}`);
  }

  /**
   * Emit meeting updated event
   */
  emitMeetingUpdated(companyId: string, meeting: any) {
    this.server.to(`company:${companyId}`).emit('meeting:updated', meeting);
    this.logger.log(`Emitted meeting:updated for company ${companyId}`);
  }

  /**
   * Emit meeting deleted event
   */
  emitMeetingDeleted(companyId: string, meetingId: string) {
    this.server
      .to(`company:${companyId}`)
      .emit('meeting:deleted', { id: meetingId });
    this.logger.log(`Emitted meeting:deleted for company ${companyId}`);
  }

  /**
   * Emit meeting reminder
   */
  emitMeetingReminder(companyId: string, userId: string, meeting: any) {
    this.server.to(`company:${companyId}`).emit('meeting:reminder', {
      userId,
      meeting,
      message: `Meeting "${meeting.title}" starts in ${meeting.minutesUntilStart} minutes`,
    });
    this.logger.log(`Emitted meeting reminder for user ${userId}`);
  }
}
