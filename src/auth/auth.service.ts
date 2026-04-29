import { Injectable } from '@nestjs/common';

import { createOpaqueToken } from '../common/utils/id.util';
import { RedisService } from '../redis/redis.service';
import { SessionPayload } from '../sessions/session.types';
import { UsersService } from '../users/users.service';

const SESSION_TTL_SECONDS = 60 * 60 * 24;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  async login(username: string): Promise<{ sessionToken: string; user: { id: string; username: string; createdAt: string } }> {
    const user = await this.usersService.getOrCreateUser(username);
    const token = createOpaqueToken();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

    const session: SessionPayload = {
      token,
      userId: user.id,
      username: user.username,
      createdAt,
      expiresAt,
    };

    await this.redisService.setSession(session, SESSION_TTL_SECONDS);

    return {
      sessionToken: token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}