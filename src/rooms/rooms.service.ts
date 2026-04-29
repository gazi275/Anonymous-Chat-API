import { ConflictException, Injectable } from '@nestjs/common';
import { and, desc, eq, lt, or } from 'drizzle-orm';

import { forbiddenError, messageTooLongError, roomNameTakenError, roomNotFoundError } from '../common/errors/app-errors';
import { createPrefixedId } from '../common/utils/id.util';
import { DatabaseService } from '../database/database.service';
import { messages, rooms } from '../database/schema';
import { RedisService } from '../redis/redis.service';
import { SessionPayload } from '../sessions/session.types';

export interface RoomResponse {
  id: string;
  name: string;
  createdBy: string;
  activeUsers: number;
  createdAt: string;
}

export interface RoomDetailResponse {
  id: string;
  name: string;
  createdBy: string;
  activeUsers: number;
  createdAt: string;
}

export interface MessageResponse {
  id: string;
  roomId: string;
  username: string;
  content: string;
  createdAt: string;
}

@Injectable()
export class RoomsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  async listRooms(): Promise<{ rooms: RoomResponse[] }> {
    const roomRows = await this.databaseService.db.select().from(rooms).orderBy(desc(rooms.createdAt), desc(rooms.id));
    const roomResponses = await Promise.all(
      roomRows.map(async (roomRow) => ({
        id: roomRow.id,
        name: roomRow.name,
        createdBy: roomRow.createdByUsername,
        activeUsers: await this.redisService.getActiveUserCount(roomRow.id),
        createdAt: roomRow.createdAt.toISOString(),
      })),
    );

    return { rooms: roomResponses };
  }

  async createRoom(name: string, session: SessionPayload): Promise<RoomDetailResponse> {
    try {
      const [created] = await this.databaseService.db
        .insert(rooms)
        .values({
          id: createPrefixedId('room'),
          name,
          createdByUserId: session.userId,
          createdByUsername: session.username,
        })
        .returning();

      if (!created) {
        throw new ConflictException();
      }

      return {
        id: created.id,
        name: created.name,
        createdBy: created.createdByUsername,
        activeUsers: await this.redisService.getActiveUserCount(created.id),
        createdAt: created.createdAt.toISOString(),
      };
    } catch (error) {
      const duplicate = typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505';
      if (duplicate) {
        throw roomNameTakenError();
      }

      throw error;
    }
  }

  async getRoom(roomId: string): Promise<RoomDetailResponse> {
    const [room] = await this.databaseService.db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (!room) {
      throw roomNotFoundError(roomId);
    }

    return {
      id: room.id,
      name: room.name,
      createdBy: room.createdByUsername,
      activeUsers: await this.redisService.getActiveUserCount(room.id),
      createdAt: room.createdAt.toISOString(),
    };
  }

  async getRoomOrNull(roomId: string): Promise<RoomDetailResponse | null> {
    const [room] = await this.databaseService.db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (!room) {
      return null;
    }

    return {
      id: room.id,
      name: room.name,
      createdBy: room.createdByUsername,
      activeUsers: await this.redisService.getActiveUserCount(room.id),
      createdAt: room.createdAt.toISOString(),
    };
  }

  async deleteRoom(roomId: string, session: SessionPayload): Promise<{ deleted: true }> {
    const [room] = await this.databaseService.db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (!room) {
      throw roomNotFoundError(roomId);
    }

    if (room.createdByUserId !== session.userId) {
      throw forbiddenError();
    }

    await this.redisService.publishAppEvent({
      event: 'room:deleted',
      roomId,
      payload: { roomId },
    });

    await this.databaseService.db.delete(messages).where(eq(messages.roomId, roomId));
    await this.databaseService.db.delete(rooms).where(eq(rooms.id, roomId));

    return { deleted: true };
  }

  async getMessages(roomId: string, limit = 50, before?: string): Promise<{ messages: MessageResponse[]; hasMore: boolean; nextCursor: string | null }> {
    const [room] = await this.databaseService.db.select({ id: rooms.id }).from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (!room) {
      throw roomNotFoundError(roomId);
    }

    const cursor = before
      ? await this.databaseService.db
          .select({ id: messages.id, createdAt: messages.createdAt })
          .from(messages)
          .where(and(eq(messages.roomId, roomId), eq(messages.id, before)))
          .limit(1)
      : [];

    const cursorRow = cursor[0];
    const filters = cursorRow
      ? and(
          eq(messages.roomId, roomId),
          or(lt(messages.createdAt, cursorRow.createdAt), and(eq(messages.createdAt, cursorRow.createdAt), lt(messages.id, cursorRow.id))),
        )
      : eq(messages.roomId, roomId);

    const rows = await this.databaseService.db
      .select()
      .from(messages)
      .where(filters)
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const selected = hasMore ? rows.slice(0, limit) : rows;

    return {
      messages: selected.map((message) => ({
        id: message.id,
        roomId: message.roomId,
        username: message.username,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
      hasMore,
      nextCursor: hasMore && selected.length > 0 ? selected[selected.length - 1].id : null,
    };
  }

  async sendMessage(roomId: string, session: SessionPayload, content: string): Promise<MessageResponse> {
    const trimmed = content.trim();
    if (trimmed.length < 1 || trimmed.length > 1000) {
      throw messageTooLongError(trimmed.length < 1 ? 'Message content must not be empty' : 'Message content must not exceed 1000 characters');
    }

    const [room] = await this.databaseService.db.select({ id: rooms.id }).from(rooms).where(eq(rooms.id, roomId)).limit(1);
    if (!room) {
      throw roomNotFoundError(roomId);
    }

    const [created] = await this.databaseService.db
      .insert(messages)
      .values({
        id: createPrefixedId('msg'),
        roomId,
        userId: session.userId,
        username: session.username,
        content: trimmed,
      })
      .returning();

    if (!created) {
      throw new ConflictException('Failed to create message');
    }

    const response = {
      id: created.id,
      roomId: created.roomId,
      username: created.username,
      content: created.content,
      createdAt: created.createdAt.toISOString(),
    };

    await this.redisService.publishAppEvent({
      event: 'message:new',
      roomId,
      payload: response,
    });

    return response;
  }
}