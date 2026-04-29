import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { createPrefixedId } from '../common/utils/id.util';
import { DatabaseService } from '../database/database.service';
import { users } from '../database/schema';

export interface UserRecord {
  id: string;
  username: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getOrCreateUser(username: string): Promise<UserRecord> {
    const existing = await this.findByUsername(username);
    if (existing) {
      return existing;
    }

    try {
      const [created] = await this.databaseService.db
        .insert(users)
        .values({
          id: createPrefixedId('usr'),
          username,
        })
        .returning();

      if (!created) {
        throw new Error('Failed to create user');
      }

      return created;
    } catch (error) {
      const duplicate = typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505';
      if (!duplicate) {
        throw error;
      }

      const fallback = await this.findByUsername(username);
      if (!fallback) {
        throw error;
      }

      return fallback;
    }
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const [user] = await this.databaseService.db.select().from(users).where(eq(users.username, username)).limit(1);
    return user ?? null;
  }
}