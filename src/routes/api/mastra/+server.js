import { json } from '@sveltejs/kit';
import { t, locale, loadTranslations } from '$lib/translations';
import { createEnhancedBotAgent } from '../../../mastra/agents/reg-bot.ts';
import { createUnregisteredBotAgent } from '../../../mastra/agents/nonreg-bot.ts';
import { GOOGLE_GENERATIVE_AI_API_KEY } from '$env/static/private';

export async function POST({ request, fetch, cookies }) {
  const { action, payload, user } = await request.json();
  const lang = user?.lang || 'he';

  await locale.set(lang);
  await loadTranslations(lang);

  try {
    // Handle unregistered user queries
    if (action === 'ask') {
      const unregisteredAgent = createUnregisteredBotAgent(
        GOOGLE_GENERATIVE_AI_API_KEY,
        lang
      );

      // Build conversation history for context
      const messages = payload.history.map((msg) => ({
        role: msg.user ? 'user' : 'assistant',
        content: msg.text
      }));

      // Add current user message
      messages.push({
        role: 'user',
        content: payload.text
      });

      const result = await unregisteredAgent.generateVNext(messages);

      return json({
        reply: result.text || t.get('bot.understandingError')
      });
    }

    // Handle registered user interactions
    if (!user?.id) {
      return json({ error: t.get('bot.unauthorized') }, { status: 401 });
    }

    const registeredAgent = createEnhancedBotAgent(
      GOOGLE_GENERATIVE_AI_API_KEY,
      lang,
      user.id
    );

    // Build conversation history
    const messages = payload.history.map((msg) => ({
      role: msg.user ? 'user' : 'assistant',
      content: msg.text
    }));

    // Add current user message with context
    messages.push({
      role: 'user',
      content: payload.text
    });

    // Set global context for tools to access
    global.botContext = {
      fetchInstance: fetch,
      userId: user.id
    };

    // Execute the agent with access to tools
    const result = await registeredAgent.generateVNext(messages);

    // Debug: Log the full result to see what tools were called
    console.log('=== MASTRA AGENT RESULT ===');
    console.log('Result text:', result.text);
    console.log('Result response:', JSON.stringify(result.response, null, 2));

    // Handle different types of responses
    let response = { reply: result.text };

    // Check if any tool calls resulted in navigation
    if (result.response && result.response.messages) {
      const toolMessages = result.response.messages.filter(
        (msg) => msg.role === 'tool'
      );
      console.log('Tool messages found:', toolMessages.length);

      for (const toolMessage of toolMessages) {
        console.log('Tool message content:', toolMessage.content);
        for (const toolResult of toolMessage.content) {
          console.log('Tool result:', toolResult.toolName, toolResult.output);
          if (
            toolResult.toolName === 'navigateToPageTool' &&
            toolResult.output?.value?.success
          ) {
            response.navigation = toolResult.output.value.navigation;
            break;
          }
        }
        if (response.navigation) {
          break;
        }
      }
    }

    console.log('Final Bot Response:', response);
    return json(response);
  } catch (error) {
    console.error('Bot API Error:', error);
    return json(
      {
        error: t.get('bot.internalError')
      },
      { status: 500 }
    );
  } finally {
    // Clean up global context to prevent memory leaks
    if (global.botContext) {
      delete global.botContext;
    }
  }
}
