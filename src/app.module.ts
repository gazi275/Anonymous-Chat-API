import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { envSchema } from './config/env.schema';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (env) => envSchema.parse(env),
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    RoomsModule,
    RealtimeModule,
  ],
})
export class AppModule {}