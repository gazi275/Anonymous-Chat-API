/**
 * Drizzle CLI expects a JS or TS config file. This JS wrapper reads DATABASE_URL
 * from the environment at runtime so `drizzle-kit` can be invoked from CI or locally.
 */
module.exports = {
  schema: './src/database/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/anonymous_chat',
  },
};"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_kit_1 = require("drizzle-kit");
const env_schema_1 = require("./src/config/env.schema");
exports.default = (0, drizzle_kit_1.defineConfig)({
    schema: './src/database/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: env_schema_1.env.DATABASE_URL,
    },
});
