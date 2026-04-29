import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';

import { env } from '../config/env.schema';
import { APP_EVENTS_CHANNEL, roomActiveUsersKey, roomSocketSetKey, sessionKey, socketStateKey } from '../common/constants/redis-keys';
import { SessionPayload } from '../sessions/session.types';

export interface SocketPresenceState {
  roomId: string;
  username: string;
  userId: string;
  token: string;
  createdAt: string;
}

export interface AppEventMessage {
  event: 'message:new' | 'room:deleted';
  roomId: string;
  payload: Record<string, unknown>;
}

export interface SocketJoinResult {
  activeUsers: string[];
  firstSocketForUser: boolean;
}

export interface SocketLeaveResult {
  roomId: string;
  username: string;
  activeUsers: string[];
  lastSocketForUser: boolean;
}

type RedisClient = ReturnType<typeof createClient>;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly commandClient: RedisClient = createClient({ url: env.REDIS_URL });
  private readonly appPublisherClient: RedisClient = createClient({ url: env.REDIS_URL });
  private readonly appSubscriberClient: RedisClient = createClient({ url: env.REDIS_URL });
  private readonly socketPublisherClient: RedisClient = createClient({ url: env.REDIS_URL });
  private readonly socketSubscriberClient: RedisClient = createClient({ url: env.REDIS_URL });

  async onModuleInit(): Promise<void> {
    await Promise.all([
      this.commandClient.connect(),
      this.appPublisherClient.connect(),
      this.appSubscriberClient.connect(),
      this.socketPublisherClient.connect(),
      this.socketSubscriberClient.connect(),
    ]);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([
      this.commandClient.quit(),
      this.appPublisherClient.quit(),
      this.appSubscriberClient.quit(),
      this.socketPublisherClient.quit(),
      this.socketSubscriberClient.quit(),
    ]);
  }

  getSocketIoPublisherClient(): RedisClient {
    return this.socketPublisherClient;
  }

  getSocketIoSubscriberClient(): RedisClient {
    return this.socketSubscriberClient;
  }

  async getSession(token: string): Promise<SessionPayload | null> {
    const raw = await this.commandClient.get(sessionKey(token));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as SessionPayload;
  }

  async setSession(session: SessionPayload, ttlSeconds: number): Promise<void> {
    await this.commandClient.set(sessionKey(session.token), JSON.stringify(session), {
      EX: ttlSeconds,
    });
  }

  async deleteSession(token: string): Promise<void> {
    await this.commandClient.del(sessionKey(token));
  }

  async registerSocket(socketId: string, roomId: string, session: SessionPayload): Promise<SocketJoinResult> {
    const activeUsersKey = roomActiveUsersKey(roomId);
    const socketKey = socketStateKey(socketId);
    const existingCount = Number((await this.commandClient.hGet(activeUsersKey, session.username)) ?? '0');

    await this.commandClient
      .multi()
      .hSet(socketKey, {
        roomId,
        username: session.username,
        userId: session.userId,
        token: session.token,
        createdAt: new Date().toISOString(),
      })
      .expire(socketKey, 60 * 60 * 25)
      .sAdd(roomSocketSetKey(roomId), socketId)
      .hIncrBy(activeUsersKey, session.username, 1)
      .exec();

    return {
      activeUsers: await this.getActiveUsers(roomId),
      firstSocketForUser: existingCount === 0,
    };
  }

  async unregisterSocket(socketId: string): Promise<SocketLeaveResult | null> {
    const state = await this.getSocketState(socketId);
    if (!state) {
      return null;
    }

    const activeUsersKey = roomActiveUsersKey(state.roomId);
    const socketKey = socketStateKey(socketId);

    const result = await this.commandClient
      .multi()
      .hIncrBy(activeUsersKey, state.username, -1)
      .sRem(roomSocketSetKey(state.roomId), socketId)
      .del(socketKey)
      .exec();

    const countAfter = Number(result?.[0] ?? 0);
    if (countAfter <= 0) {
      await this.commandClient.hDel(activeUsersKey, state.username);
    }

    return {
      roomId: state.roomId,
      username: state.username,
      activeUsers: await this.getActiveUsers(state.roomId),
      lastSocketForUser: countAfter <= 0,
    };
  }

  async getSocketState(socketId: string): Promise<SocketPresenceState | null> {
    const raw = await this.commandClient.hGetAll(socketStateKey(socketId));
    if (!raw.roomId || !raw.username || !raw.userId || !raw.token || !raw.createdAt) {
      return null;
    }

    return {
      roomId: raw.roomId,
      username: raw.username,
      userId: raw.userId,
      token: raw.token,
      createdAt: raw.createdAt,
    };
  }

  async getActiveUsers(roomId: string): Promise<string[]> {
    const users = await this.commandClient.hKeys(roomActiveUsersKey(roomId));
    return users.sort((left, right) => left.localeCompare(right));
  }

  async getActiveUserCount(roomId: string): Promise<number> {
    return this.commandClient.hLen(roomActiveUsersKey(roomId));
  }

  async clearRoomState(roomId: string): Promise<void> {
    const socketIds = await this.commandClient.sMembers(roomSocketSetKey(roomId));
    const socketKeys = socketIds.map((socketId) => socketStateKey(socketId));

    const multi = this.commandClient.multi();
    if (socketKeys.length > 0) {
      for (const socketKey of socketKeys) {
        multi.del(socketKey);
      }
    }
    multi.del(roomActiveUsersKey(roomId));
    multi.del(roomSocketSetKey(roomId));
    await multi.exec();
  }

  async publishAppEvent(message: AppEventMessage): Promise<void> {
    await this.appPublisherClient.publish(APP_EVENTS_CHANNEL, JSON.stringify(message));
  }

  async subscribeToAppEvents(handler: (message: AppEventMessage) => Promise<void> | void): Promise<void> {
    await this.appSubscriberClient.subscribe(APP_EVENTS_CHANNEL, async (rawMessage) => {
      const message = JSON.parse(rawMessage) as AppEventMessage;
      await handler(message);
    });
  }
}