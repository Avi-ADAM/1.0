
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { Agent } from '@mastra/core/agent';
import { mastraStorage } from './lib/storage';
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

// The store lives in ./lib/storage so chat Memory (agents) and the Mastra
// instance share one pool — see docs/PLAN_MASTRA_STORAGE.md.
export const mastra = new Mastra({
  workflows: { chatWorkflow, 'analyze-cv': analyzeCvWorkflow },
  agents: {
    IntentAgent: createIntentAgent(REGISTRY_API_KEY, REGISTRY_LANG),
    NavigationAgent: createNavigationAgent(REGISTRY_API_KEY, REGISTRY_LANG),
    unregisteredBotAgent: createUnregisteredBotAgent(REGISTRY_API_KEY, REGISTRY_LANG) as Agent<any, any>,
    enhancedBotAgent: createEnhancedBotAgent(REGISTRY_API_KEY, REGISTRY_LANG, 'system') as Agent<any, any>
  },
  storage: mastraStorage,
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info'
  })
});
