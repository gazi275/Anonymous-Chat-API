import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ServerOptions } from 'socket.io';

import { RedisService } from './redis.service';

export class RedisIoAdapter extends IoAdapter {
  constructor(app: INestApplicationContext, private readonly redisService: RedisService) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): ReturnType<IoAdapter['createIOServer']> {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: true,
        credentials: true,
      },
    });

    server.adapter(createAdapter(this.redisService.getSocketIoPublisherClient(), this.redisService.getSocketIoSubscriberClient()));
    return server;
  }
}