import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '../config/env.schema';
import { schema, Schema } from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  private readonly database: NodePgDatabase<Schema> = drizzle(this.pool, {
    schema,
  });

  async onModuleInit(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  get db(): NodePgDatabase<Schema> {
    return this.database;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}