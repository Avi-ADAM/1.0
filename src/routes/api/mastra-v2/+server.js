import { json } from '@sveltejs/kit';
import { t } from '$lib/translations';
import { GOOGLE_GENERATIVE_AI_API_KEY } from '$env/static/private';
import { mastra } from '../../../mastra';
import { createUnregisteredBotAgent } from '../../../mastra/agents/nonreg-bot.js';

export async function POST({ request, fetch }) {
  const { payload, user } = await request.json();
  const lang = user?.lang || 'he';

  // await locale.set(lang);
  // await loadTranslations(lang);

  try {
    // Check if user is registered (has an ID)
    if (!user?.id) {
      console.log('🔓 Unregistered user detected, using nonreg-bot');

      // Use the unregistered bot agent directly
      const nonregAgent = createUnregisteredBotAgent(
        GOOGLE_GENERATIVE_AI_API_KEY,
        lang
      );

      // Build conversation messages from history
      const messages = [];
      if (payload.history && payload.history.length > 0) {
        // Include last 10 messages for context
        const recentHistory = payload.history.slice(-10);
        for (const msg of recentHistory) {
          messages.push({
            role: msg.user ? 'user' : 'assistant',
            content: msg.text
          });
        }
      }

      // Add current message
      messages.push({
        role: 'user',
        content: payload.text
      });

      console.log(
        '🤖 Executing nonreg agent with',
        messages.length,
        'messages'
      );

      const result = await nonregAgent.generateVNext(messages);

      let response = {
        reply: result.text || 'שגיאה בעיבוד התשובה',
        agentType: 'nonregistered'
      };

      // Extract tool results if any (for navigation)
      if (result.response && result.response.messages) {
        const toolMessages = result.response.messages.filter(
          (msg) => msg.role === 'tool'
        );

        for (const toolMessage of toolMessages) {
          for (const toolResult of toolMessage.content) {
            console.log(
              '🔧 Nonreg tool executed:',
              toolResult.toolName,
              toolResult.output
            );

            // Handle navigation for unregistered users
            if (
              toolResult.toolName === 'navigateToPageTool' &&
              toolResult.output?.value?.success
            ) {
              response.navigation = toolResult.output.value.navigation;
            }
          }
        }
      }

      console.log('📤 Nonreg bot response:', response);
      return json(response);
    }

    console.log('🚀 Starting chat workflow for registered user');
    console.log(
      payload.text,
      user?.id,
      lang,
      GOOGLE_GENERATIVE_AI_API_KEY,
      fetch
    );
    global.botContext = {
      fetchInstance: fetch,
      userId: user.id.toString()
    };
    // Execute the workflow
    const run = await mastra.getWorkflow('chatWorkflow').createRunAsync();

    const result = await run.start({
      inputData: {
        message: payload.text,
        history: payload.history || [],
        userId: user?.id.toString(),
        language: lang,
        apiKey: GOOGLE_GENERATIVE_AI_API_KEY,
        fetchInstance: fetch
      }
    });

    if (result.status === 'suspended') {
      await run.resume({
        inputData: {
          message: payload.text,
          history: payload.history || [],
          userId: user?.id,
          language: lang,
          apiKey: GOOGLE_GENERATIVE_AI_API_KEY,
          fetchInstance: fetch
        }
      });
    }
    // const result = await chatWorkflow.execute();

    console.log('✅ Workflow completed:', result);

    // Extract the actual output data from the workflow result
    const outputData =
      result.result || result.outputData || result.data || result;

    // Ensure we return the expected format for the frontend
    const response = {
      reply: outputData.reply || 'שגיאה בעיבוד התשובה',
      ...(outputData.navigation && { navigation: outputData.navigation }),
      ...(outputData.timerAction && { timerAction: outputData.timerAction }),
      ...(outputData.dataUpdate && { dataUpdate: outputData.dataUpdate }),
      ...(outputData.intent && { intent: outputData.intent }),
      ...(outputData.agentType && { agentType: outputData.agentType })
    };

    console.log('📤 Final API Response:', response);
    return json(response);
  } catch (error) {
    console.error('❌ Workflow Error:', error);
    return json(
      {
        error: t.get('bot.internalError'),
        details: error.message
      },
      { status: 500 }
    );
  }
}
