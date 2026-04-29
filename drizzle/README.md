Drizzle migration artifacts live here. Use the project `drizzle.config.ts` + `drizzle-kit` to generate and apply migrations.

Common commands:

```bash
npx drizzle-kit generate --config drizzle.config.ts --out ./drizzle/migrations
npx drizzle-kit push --config drizzle.config.ts
```

This repo includes an initial SQL migration (`0000_initial.sql`) checked into `drizzle/` for reviewers.

When running CI, set `DATABASE_URL` and run `npx drizzle-kit push` to apply migrations.
