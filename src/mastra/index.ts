
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { Agent } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { chatWorkflow } from './workflows/chat-workflow';
import { createUnregisteredBotAgent } from './agents/nonreg-bot';
import { createEnhancedBotAgent } from './agents/reg-bot';
 import { createNavigationAgent } from './agents/navigation-agent'
 import { createIntentAgent } from './agents/intent-agent'

 
export const mastra = new Mastra({
  workflows: { chatWorkflow },
  agents: {
    IntentAgent: createIntentAgent(),
    NavigationAgent: createNavigationAgent('apiKey','language','useId'),
    unregisteredBotAgent: createUnregisteredBotAgent('lang') as Agent<
      any,
      ToolsInput,
      Record<string, Metric>
    >,
    enhancedBotAgent: createEnhancedBotAgent('lang') as Agent<
      any,
      ToolsInput,
      Record<string, Metric>
    >
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ':memory:'
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info'
  })
});
