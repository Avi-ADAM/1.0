import { createTool } from '@mastra/core/tools'
import { z } from 'zod';
import { createTimerAgent } from '../agents/timer-agent';
import { createNavigationAgent } from '../agents/navigation-agent';

export const delegateToAgentTool = createTool({
  id: 'delegateToAgentTool',
  description:
    'Delegate a request to a specialized agent (timer or navigation) when the help agent determines the user needs specific functionality',
  inputSchema: z.object({
    agentType: z
      .enum(['timer', 'navigation'])
      .describe('Which specialized agent to delegate to'),
    userMessage: z
      .string()
      .describe('The original user message to pass to the specialized agent'),
    context: z
      .string()
      .optional()
      .describe('Additional context about why this delegation is needed')
  }),
  execute: async (inputData, context) => {
    const { agentType, userMessage, context: delegationContext } = inputData;
    try {
      console.log(
        `🔄 Help agent delegating to ${agentType} agent:`,
        userMessage
      );

      // Get the global context that was set in the workflow
      const botContext = (global as any).botContext;
      if (!botContext) {
        return {
          success: false,
          error: 'Bot context not available for delegation'
        };
      }

      const { fetchInstance, userId, fullHistory } = botContext;

      // For timer operations, user must be registered
      if (agentType === 'timer' && !userId) {
        return {
          success: false,
          error: 'timer_requires_registration',
          message:
            'פעולות טיימר זמינות רק למשתמשים רשומים. אנא הירשם כדי להשתמש בטיימרים.'
        };
      }

      // Create the appropriate agent
      let agent;
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      const language = 'he'; // Default to Hebrew, could be passed as parameter

      switch (agentType) {
        case 'timer':
          agent = createTimerAgent(apiKey, language, userId);
          break;
        case 'navigation':
          agent = createNavigationAgent(apiKey, language, userId);
          break;
        default:
          return {
            success: false,
            error: `Unknown agent type: ${agentType}`
          };
      }

      // Build conversation context - use recent history plus current message
      const recentHistory = (fullHistory || []).slice(-5);
      const messages = recentHistory
        .filter((msg: any) => {
          const content = msg.content || msg.text || '';
          const role = msg.role || (msg.user ? 'user' : 'assistant');
          // Keep only plain text messages (user or assistant with text content)
          if (typeof content !== 'string' || content.trim() === '') return false;
          // Drop messages that were tool calls/results (role === 'tool')
          if (role === 'tool') return false;
          // Drop messages that contain parts with function calls (Gemini thought_signature issue)
          if (msg.parts && Array.isArray(msg.parts)) {
            const hasFunctionCall = msg.parts.some((part: any) =>
              part.functionCall || part.function_call || (part.type === 'function_call')
            );
            if (hasFunctionCall) return false;
          }
          return true;
        })
        .map((msg: any) => ({
          role: msg.role || (msg.user ? 'user' : 'assistant'),
          content: msg.content || msg.text
          // Intentionally omit `parts` — Gemini requires thought_signatures on tool-call parts
          // from previous turns, which we don't have when replaying from client-side history.
        }));

      // Add the current message
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Execute the specialized agent
      const result = await agent.generate(messages, {
        fetchInstance,
        userId
      });

      console.log(`✅ ${agentType} agent completed:`, result.text);

      // Extract any tool results from the specialized agent
      let toolResults = {};
      if (result.response && result.response.messages) {
        const toolMessages = result.response.messages.filter(
          (msg: any) => msg.role === 'tool'
        );

        for (const toolMessage of toolMessages) {
          for (const toolResult of toolMessage.content) {
            console.log(
              '🔧 Specialized agent tool result:',
              toolResult.toolName,
              toolResult.output
            );

            // Collect tool results by type
            if (
              toolResult.toolName === 'navigateToPageTool' &&
              toolResult.output?.value?.success
            ) {
              toolResults.navigation = toolResult.output.value.navigation;
            }
            if (
              toolResult.toolName === 'timerActionTool' &&
              toolResult.output?.value
            ) {
              toolResults.timerAction = toolResult.output.value;
            }
            if (
              toolResult.toolName === 'updateDataTool' &&
              toolResult.output?.value
            ) {
              toolResults.dataUpdate = toolResult.output.value;
            }
          }
        }
      }

      return {
        success: true,
        agentType,
        response: result.text,
        toolResults,
        context: delegationContext || `Delegated to ${agentType} agent`
      };
    } catch (error) {
      console.error(`❌ Error delegating to ${agentType} agent:`, error);
      return {
        success: false,
        error: error.message || 'Unknown delegation error'
      };
    }
  }
});