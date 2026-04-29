import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { RedisService, AppEventMessage } from '../redis/redis.service';
import { RoomsService } from '../rooms/rooms.service';
import { SessionPayload } from '../sessions/session.types';

interface ChatSocketData {
  session?: SessionPayload;
  roomId?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  private middlewareRegistered = false;

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly redisService: RedisService,
    private readonly roomsService: RoomsService,
  ) {}

  afterInit(server: Server): void {
    this.server = server;

    if (!this.middlewareRegistered) {
      this.middlewareRegistered = true;
      this.registerMiddleware(server);
    }

    void this.redisService.subscribeToAppEvents(async (message) => {
      await this.handleAppEvent(message);
    });
  }

  private registerMiddleware(server: Server): void {
    server.use(async (socket, next) => {
      try {
        const token = typeof socket.handshake.query.token === 'string' ? socket.handshake.query.token : '';
        const roomId = typeof socket.handshake.query.roomId === 'string' ? socket.handshake.query.roomId : '';

        if (!token) {
          return next(this.createConnectionError(401, 'Missing or expired session token'));
        }

        const session = await this.redisService.getSession(token);
        if (!session) {
          return next(this.createConnectionError(401, 'Missing or expired session token'));
        }

        const room = await this.roomsService.getRoomOrNull(roomId);
        if (!room) {
          return next(this.createConnectionError(404, `Room with id ${roomId} does not exist`));
        }

        const data = socket.data as ChatSocketData;
        data.session = session;
        data.roomId = roomId;
        next();
      } catch (error) {
        next(error as Error);
      }
    });
  }

  private createConnectionError(code: 401 | 404, message: string): Error {
    const error = new Error(message);
    (error as Error & { data?: { code: number; message: string } }).data = { code, message };
    return error;
  }

  async handleConnection(client: Socket): Promise<void> {
    const data = client.data as ChatSocketData;
    if (!data.session || !data.roomId) {
      client.disconnect(true);
      return;
    }

    const joinResult = await this.redisService.registerSocket(client.id, data.roomId, data.session);
    client.join(data.roomId);
    client.emit('room:joined', { activeUsers: joinResult.activeUsers });

    if (joinResult.firstSocketForUser) {
      client.to(data.roomId).emit('room:user_joined', {
        username: data.session.username,
        activeUsers: joinResult.activeUsers,
      });
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.cleanupSocket(client, false);
  }

  @SubscribeMessage('room:leave')
  async leaveRoom(client: Socket): Promise<void> {
    await this.cleanupSocket(client, true);
    client.disconnect(true);
  }

  private async cleanupSocket(client: Socket, fromLeaveEvent: boolean): Promise<void> {
    const result = await this.redisService.unregisterSocket(client.id);
    if (!result) {
      return;
    }

    if (result.lastSocketForUser) {
      client.to(result.roomId).emit('room:user_left', {
        username: result.username,
        activeUsers: result.activeUsers,
      });
    }

    if (fromLeaveEvent) {
      client.leave(result.roomId);
    }
  }

  private async handleAppEvent(message: AppEventMessage): Promise<void> {
    if (message.event === 'message:new') {
      this.server.to(message.roomId).emit('message:new', message.payload);
      return;
    }

    if (message.event === 'room:deleted') {
      this.server.to(message.roomId).emit('room:deleted', { roomId: message.roomId });
      await this.redisService.clearRoomState(message.roomId);
      await this.server.in(message.roomId).disconnectSockets(true);
    }
  }
}