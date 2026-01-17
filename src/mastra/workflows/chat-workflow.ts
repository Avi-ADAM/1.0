import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { createIntentAgent } from '../agents/intent-agent';
import { createTimerAgent } from '../agents/timer-agent';
import { createNavigationAgent } from '../agents/navigation-agent';
import { createGeneralHelpAgent } from '../agents/help-agent';

interface IntentResult {
  type: 'timer' | 'navigation' | 'general';
  confidence: number;
  details: {
    action?: string;
    target?: string;
    context?: string;
  };
}

interface ChatOutput {
  reply: string;
  intent?: IntentResult;
  agentType?: string;
  navigation?: any;
  timerAction?: any;
  dataUpdate?: any;
}

// Step definitions
const analyzeIntent = createStep({
  id: 'analyzeIntent',
  description: 'Analyze user intent from message',
  inputSchema: z.object({
    message: z.string(),
    history: z.array(
      z.object({
        user: z.boolean(),
        text: z.string()
      })
    ),
    userId: z.string().optional(),
    language: z.string(),
    apiKey: z.string(),
    fetchInstance: z.any().optional(),
    currentPath: z.string().optional()
  }),
  outputSchema: z.object({
    message: z.string(),
    history: z.array(
      z.object({
        user: z.boolean(),
        text: z.string()
      })
    ),
    userId: z.string().optional(),
    language: z.string(),
    apiKey: z.string(),
    fetchInstance: z.any().optional(),
    currentPath: z.string().optional(),
    intent: z.object({
      type: z.enum(['timer', 'navigation', 'general']),
      confidence: z.number(),
      details: z.object({
        action: z.string().optional(),
        target: z.string().optional(),
        context: z.string().optional()
      })
    })
  }),
  execute: async ({ inputData }) => {
    const { message, history, language, apiKey } = inputData;
    console.log('🔍 Analyzing intent for:', message);

    const intentAgent = createIntentAgent(apiKey, language);

    // Build conversation context for intent analysis
    // Include last 5 messages for context but focus on the current message
    const recentHistory = history.slice(-5);
    const contextMessages = recentHistory.map((msg: any) => ({
      role: msg.user ? 'user' : 'assistant',
      content: msg.text
    }));

    // Add current message
    contextMessages.push({
      role: 'user',
      content: message
    });

    const result = await intentAgent.generateVNext(contextMessages);

    let intent: IntentResult;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = result.text.trim();

      // Try to extract from markdown code blocks
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      // Try to extract JSON object from text
      const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonText = jsonObjectMatch[0];
      }

      intent = JSON.parse(jsonText);

      // Validate the parsed intent has required fields
      if (!intent.type || !intent.confidence || !intent.details) {
        throw new Error('Invalid intent structure');
      }

    } catch (e) {
      console.error('Failed to parse intent:', result.text);
      console.error('Parse error:', e);

      // Try to determine intent from the message content as fallback
      const messageText = message.toLowerCase();
      if (messageText.includes('טיימר') || messageText.includes('timer') ||
        messageText.includes('התחל') || messageText.includes('start') ||
        messageText.includes('עצור') || messageText.includes('stop')) {
        intent = {
          type: 'timer' as const,
          confidence: 0.7,
          details: {
            action: messageText.includes('התחל') || messageText.includes('start') ? 'start' : 'stop',
            target: null,
            context: 'fallback_parsing'
          }
        };
      } else {
        intent = {
          type: 'general' as const,
          confidence: 0.5,
          details: {
            action: 'help',
            target: null,
            context: 'parsing_failed'
          }
        };
      }
    }

    console.log('📊 Intent detected:', intent);

    // Pass through all input data plus the intent
    return {
      ...inputData,
      intent
    };
  }
});

const routeToAgent = createStep({
  id: 'routeToAgent',
  description: 'Route to appropriate agent based on intent',
  inputSchema: z.object({
    message: z.string(),
    history: z.array(
      z.object({
        user: z.boolean(),
        text: z.string()
      })
    ),
    userId: z.string().optional(),
    language: z.string(),
    apiKey: z.string(),
    fetchInstance: z.any().optional(),
    currentPath: z.string().optional(),
    intent: z.object({
      type: z.enum(['timer', 'navigation', 'general']),
      confidence: z.number(),
      details: z.object({
        action: z.string().optional(),
        target: z.string().optional(),
        context: z.string().optional()
      })
    })
  }),
  outputSchema: z.object({
    agentResult: z.any(),
    agentType: z.string(),
    intent: z.object({
      type: z.enum(['timer', 'navigation', 'general']),
      confidence: z.number(),
      details: z.object({
        action: z.string().optional(),
        target: z.string().optional(),
        context: z.string().optional()
      })
    })
  }),
  execute: async ({ inputData }) => {
    const {
      message,
      history,
      userId,
      language,
      apiKey,
      intent,
      fetchInstance
    } = inputData;

    console.log('🚀 Routing to agent for intent:', intent.type);
    console.log('🌐 Language for agent:', language);

    // Set global context for tools to access
    global.botContext = {
      fetchInstance: fetchInstance,
      userId: userId,
      fullHistory: history // Store full history for getChatHistoryTool
    };

    let agent: any;
    let agentType = intent.type;

    switch (intent.type) {
      case 'timer':
        if (!userId) {
          // Unregistered users can't use timer functions
          agent = createGeneralHelpAgent(apiKey, language);
          agentType = 'general';
        } else {
          agent = createTimerAgent(apiKey, language, userId);
        }
        break;

      case 'navigation':
        // Navigation is available for all users, but some pages require authentication
        agent = createNavigationAgent(apiKey, language, userId);
        break;

      default:
        agent = createGeneralHelpAgent(apiKey, language);
        agentType = 'general';
    }

    // Build conversation messages - limit to last 10 messages to avoid context overflow
    const recentHistory = history.slice(-10);
    const messages = recentHistory.map((msg: any) => ({
      role: msg.user ? 'user' : 'assistant',
      content: msg.text
    }));

    messages.push({
      role: 'user',
      content: message
    });

    console.log(
      `🤖 Executing ${agentType} agent with ${messages.length} messages`
    );
    console.log(
      '📝 Recent messages:',
      messages.map((m) => `${m.role}: ${m.content.substring(0, 50)}...`)
    );

    const result = await agent.generateVNext(messages, {
      fetchInstance: fetchInstance,
      userId: userId,
      intent: intent
    });
    function logAgentResult(result: any) {
      const cleanResult = {
        text: result.text,
        usage: result.usage
          ? {
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            totalTokens: result.usage.totalTokens
          }
          : undefined,
        finishReason: result.finishReason,
        warnings: result.warnings,
        hasSteps: Boolean(result.steps?.length),
        hasToolCalls: Boolean(result.toolCalls?.length)
      };

      console.log('🔍 Agent result:', cleanResult);
    }
    logAgentResult(result);
    console.log(
      '🔧 Tool calls in response:',
      result.response?.messages?.filter((m: any) => m.role === 'tool')
        ?.length || 0
    );
    // Clean up global context
    if (global.botContext) {
      delete global.botContext;
    }

    return {
      agentResult: result,
      agentType: agentType,
      intent: intent
    };
  }
});

const processResponse = createStep({
  id: 'processResponse',
  description: 'Process agent response and extract actions',
  inputSchema: z.object({
    agentResult: z.any(),
    agentType: z.string(),
    intent: z.object({
      type: z.enum(['timer', 'navigation', 'general']),
      confidence: z.number(),
      details: z.object({
        action: z.string().optional(),
        target: z.string().optional(),
        context: z.string().optional()
      })
    })
  }),
  outputSchema: z.object({
    reply: z.string(),
    intent: z.any().optional(),
    agentType: z.string().optional(),
    navigation: z.any().optional(),
    timerAction: z.any().optional(),
    dataUpdate: z.any().optional()
  }),
  execute: async ({ inputData }) => {
    const { agentResult, agentType, intent } = inputData;
    console.log('⚙️ Processing agent response', agentResult.response);

    let response: ChatOutput = {
      reply: agentResult.text,
      intent: intent,
      agentType: agentType
    };

    // Extract tool results if any
    if (agentResult.response && agentResult.response.messages) {
      const toolMessages = agentResult.response.messages.filter(
        (msg: any) => msg.role === 'tool'
      );

      for (const toolMessage of toolMessages) {
        for (const toolResult of toolMessage.content) {
          console.log(
            '🔧 Tool executed:',
            toolResult.toolName,
            toolResult.output
          );

          // Handle navigation
          if (
            toolResult.toolName === 'navigateToPageTool' &&
            toolResult.output?.value?.success
          ) {
            response.navigation = toolResult.output.value.navigation;
          }

          // Handle timer actions
          if (
            toolResult.toolName === 'timerActionTool' &&
            toolResult.output?.value
          ) {
            response.timerAction = toolResult.output.value;
          }

          // Handle data updates
          if (
            toolResult.toolName === 'updateDataTool' &&
            toolResult.output?.value
          ) {
            response.dataUpdate = toolResult.output.value;
          }
        }
      }
    }

    console.log('✅ Final response:', response);
    return response;
  }
});

// Create the workflow with proper chaining
const chatWorkflow = createWorkflow({
  id: 'chat-workflow',
  inputSchema: z.object({
    message: z.string(),
    history: z.array(
      z.object({
        user: z.boolean(),
        text: z.string()
      })
    ),
    userId: z.string().optional(),
    language: z.string(),
    apiKey: z.string(),
    fetchInstance: z.any().optional(),
    currentPath: z.string().optional()
  }),
  outputSchema: z.object({
    reply: z.string(),
    intent: z.any().optional(),
    agentType: z.string().optional(),
    navigation: z.any().optional(),
    timerAction: z.any().optional(),
    dataUpdate: z.any().optional()
  })
})
  .then(analyzeIntent)
  .then(routeToAgent)
  .then(processResponse);

chatWorkflow.commit();

export { chatWorkflow };
