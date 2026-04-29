import { defineConfig } from 'drizzle-kit';

import { env } from './src/config/env.schema';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});