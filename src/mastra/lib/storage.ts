import { LibSQLStore } from '@mastra/libsql';
import { PostgresStore } from '@mastra/pg';

// Persistence is env-driven so ops can turn it on without a code change and
// without risking a read-only filesystem on serverless build adapters. Set
// MASTRA_DB_URL (e.g. `file:./.mastra/mastra.db` or a libSQL/Turso URL) to keep
// telemetry, evals and conversation memory across restarts; defaults to the
// previous in-memory behaviour when unset.
export const MASTRA_DB_URL = process.env.MASTRA_DB_URL || ':memory:';

/** True when MASTRA_DB_URL points at a store that survives a restart. */
export const isPersistentStore = MASTRA_DB_URL !== ':memory:';

// A `postgres://` / `postgresql://` URL selects the Postgres store; anything
// else stays on libSQL (`:memory:`, `file:…`, Turso). See
// docs/PLAN_MASTRA_STORAGE.md — the VPS runs a dedicated `postgres` container
// on the app-network, so the URL there is postgres://…@postgres:5432/mastra.
// The pool is deliberately small: that container is capped at
// max_connections=25 and shares 1.9GB of RAM with Strapi, nginx and this app.
//
// Exported as a single shared instance on purpose: the Mastra instance
// (telemetry / workflow snapshots) and chat Memory (threads / messages /
// working memory) both use it, and two stores would mean two connection pools
// against those 25 connections.
export const mastraStorage = /^postgres(ql)?:\/\//.test(MASTRA_DB_URL)
  ? new PostgresStore({
      id: 'pg-storage',
      connectionString: MASTRA_DB_URL,
      max: 5,
      idleTimeoutMillis: 30_000
    })
  : new LibSQLStore({
      url: MASTRA_DB_URL,
      id: 'libsql-storage'
    });
