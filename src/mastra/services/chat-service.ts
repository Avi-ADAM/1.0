import { createIntentAgent } from '../agents/intent-agent';
import { createTimerAgent } from '../agents/timer-agent';
import { createNavigationAgent } from '../agents/navigation-agent';
import { createGeneralHelpAgent } from '../agents/help-agent';
import {
  DEFAULT_AGENT_MAX_STEPS,
  getAgentReply
} from '../lib/agent-response';

interface ChatInput {
  message: string;
  history: Array<{ user: boolean; text: string }>;
  userId?: string;
  language: string;
  apiKey?: string;
  fetchInstance?: any;
}

interface IntentResult {
  type: 'timer' | 'navigation' | 'general';
  confidence: number;
  details: {
    action?: string;
    target?: string | null;
    context?: string | null;
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

export class ChatService {
  static async processChat(input: ChatInput): Promise<ChatOutput> {
    const { message, history, userId, language, apiKey, fetchInstance } = input;
    
    try {
      // Step 1: Analyze intent
      console.log('🔍 Analyzing intent for:', message);
      const intent = await this.analyzeIntent(message, language, apiKey);
      console.log('📊 Intent detected:', intent);

      // Step 2: Route to appropriate agent
      console.log('🚀 Routing to agent for intent:', intent.type);
      const agentResult = await this.routeToAgent({
        message,
        history,
        userId,
        language,
        apiKey,
        intent,
        fetchInstance
      });

      // Step 3: Process response
      console.log('⚙️ Processing agent response');
      const response = await this.processResponse({
        agentResult: agentResult.agentResult,
        agentType: agentResult.agentType,
        intent
      });

      console.log('✅ Final response:', response);
      return response;

    } catch (error) {
      console.error('❌ Chat service error:', error);
      throw error;
    }
  }

  private static async analyzeIntent(
    message: string, 
    language: string, 
    apiKey?: string
  ): Promise<IntentResult> {
    const intentAgent = createIntentAgent(apiKey, language);

    const result = await intentAgent.generate([
      {
        role: 'user',
        content: message
      }
    ]);

    let intent: IntentResult;
    try {
      intent = JSON.parse(result.text);
    } catch (e) {
      console.error('Failed to parse intent:', result.text);
      intent = { type: 'general', confidence: 0.5, details: {} };
    }

    return intent;
  }

  private static async routeToAgent(params: {
    message: string;
    history: Array<{ user: boolean; text: string }>;
    userId?: string;
    language: string;
    apiKey?: string;
    intent: IntentResult;
    fetchInstance?: any;
  }): Promise<{ agentResult: any; agentType: string }> {
    const {
      message,
      history,
      userId,
      language,
      apiKey,
      intent,
      fetchInstance
    } = params;

    let agent: any;
    let agentType = intent.type;

    // Set global context for tools
    if (userId && fetchInstance) {
      global.botContext = {
        fetchInstance: fetchInstance,
        userId: userId,
        intent: intent,
        currentMessage: message
      };
    }

    switch (intent.type) {
      case 'timer':
        if (!userId) {
          // Unregistered users can't use timer functions
          agent = createGeneralHelpAgent(apiKey, language);
          agentType = 'help';
        } else {
          agent = createTimerAgent(apiKey, language, userId);
        }
        break;

      case 'navigation':
        if (!userId) {
          agent = createGeneralHelpAgent(apiKey, language);
          agentType = 'help';
        } else {
          agent = createNavigationAgent(apiKey, language, userId);
        }
        break;

      default:
        agent = createGeneralHelpAgent(apiKey, language);
        agentType = 'help';
    }

    // Build conversation messages
    const messages = history.map((msg: any) => ({
      role: msg.user ? 'user' : 'assistant',
      content: msg.text
    }));

    messages.push({
      role: 'user',
      content: message
    });

    console.log(`🤖 Executing ${agentType} agent`);
    const result = await agent.generate(messages, {
      maxSteps: DEFAULT_AGENT_MAX_STEPS,
      toolChoice: 'auto'
    });

    return {
      agentResult: result,
      agentType: agentType
    };
  }

  private static async processResponse(params: {
    agentResult: any;
    agentType: string;
    intent: IntentResult;
  }): Promise<ChatOutput> {
    const { agentResult, agentType, intent } = params;

    let response: ChatOutput = {
      reply: getAgentReply(agentResult),
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

    // Clean up global context
    if (global.botContext) {
      delete global.botContext;
    }

    return response;
  }
}
