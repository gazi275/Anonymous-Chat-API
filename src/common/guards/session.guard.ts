import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { unauthorizedError } from '../errors/app-errors';
import { RedisService } from '../../redis/redis.service';
import { SessionPayload } from '../../sessions/session.types';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ session?: SessionPayload; headers: Record<string, string | string[] | undefined> }>();
    const authorization = request.headers.authorization;

    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
      throw unauthorizedError();
    }

    const token = authorization.slice('Bearer '.length).trim();
    const session = await this.redisService.getSession(token);

    if (!session) {
      throw unauthorizedError();
    }

    request.session = session;
    return true;
  }
}