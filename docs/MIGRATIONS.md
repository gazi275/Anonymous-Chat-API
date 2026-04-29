## Drizzle migration workflow

This repository uses `drizzle-kit` to manage SQL migrations. The checked-in SQL folder is `drizzle/` and the project also includes a runtime-friendly `drizzle.config.js` for the CLI and CI.

Local development

- Generate a migration (captures changes from `src/database/schema.ts`):

```bash
# install dependencies once
npm ci

# generate a migration into drizzle/migrations
npx drizzle-kit generate --config drizzle.config.js --out ./drizzle/migrations
```

- Inspect and review the generated SQL. It's a best practice to keep small, human-reviewable migrations and commit them to the repo.

- Apply migrations to your local database:

```bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/anonymous_chat
npm run drizzle:push
```

CI / Production

- In CI, set the `DATABASE_URL` secret and invoke the `drizzle:push` script to apply migrations as part of your deployment pipeline.

Example GitHub Actions job (this repo includes `.github/workflows/drizzle-migrations.yml`):

```yaml
name: Apply Drizzle Migrations

on:
  workflow_dispatch: {}
  push:
    branches:
      - main

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - name: Apply migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run drizzle:push

```

Notes and best practices

- Always review generated SQL before committing. Prefer explicit, minimal SQL for complex schema changes.
- Keep a migration-per-change policy (1 logical change => 1 migration file) to simplify rollbacks and code review.
- Run `npx drizzle-kit studio` locally to inspect DB schema while developing.
- In production CI, consider a dry-run step or a schema-check job to detect potential harmful migrations before applying.
