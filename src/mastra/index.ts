
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { Agent } from '@mastra/core/agent';
import { LibSQLStore } from '@mastra/libsql';
import { chatWorkflow } from './workflows/chat-workflow';
import { analyzeCvWorkflow } from './workflows/analyze-cv';
import { createUnregisteredBotAgent } from './agents/nonreg-bot';
import { createEnhancedBotAgent } from './agents/reg-bot';
 import { createNavigationAgent } from './agents/navigation-agent'
 import { createIntentAgent } from './agents/intent-agent'

// Per-request agents are always re-created with the caller's real apiKey /
// language / userId in the chat route and workflow. The registry instances
// below are constructed with resolved defaults purely so the Mastra registry
// holds valid agents (they were previously registered with placeholder string
// literals like 'apiKey'/'language'/'useId', which were never valid keys).
const REGISTRY_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const REGISTRY_LANG = 'he';

// Persistence is env-driven so ops can turn it on without a code change and
// without risking a read-only filesystem on serverless build adapters. Set
// MASTRA_DB_URL (e.g. `file:./.mastra/mastra.db` or a libSQL/Turso URL) to keep
// telemetry, evals and conversation memory across restarts; defaults to the
// previous in-memory behaviour when unset.
const MASTRA_DB_URL = process.env.MASTRA_DB_URL || ':memory:';

export const mastra = new Mastra({
  workflows: { chatWorkflow, 'analyze-cv': analyzeCvWorkflow },
  agents: {
    IntentAgent: createIntentAgent(REGISTRY_API_KEY, REGISTRY_LANG),
    NavigationAgent: createNavigationAgent(REGISTRY_API_KEY, REGISTRY_LANG),
    unregisteredBotAgent: createUnregisteredBotAgent(REGISTRY_API_KEY, REGISTRY_LANG) as Agent<any, any>,
    enhancedBotAgent: createEnhancedBotAgent(REGISTRY_API_KEY, REGISTRY_LANG, 'system') as Agent<any, any>
  },
  storage: new LibSQLStore({
    url: MASTRA_DB_URL,
    id: 'libsql-storage'
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info'
  })
});
