import { GEMINI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { mastra } from '../../../mastra';
import { createUnregisteredBotAgent } from '../../../mastra/agents/nonreg-bot.js';
import { t } from '$lib/translations';

/**
 * Enhanced Chat API — connected to Mastra agents.
 * Used by the expanded /chat page for rich, tool-capable conversations.
 * Supports both registered (workflow) and unregistered (direct agent) users.
 */
export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
  const body = await request.json();
  console.log('📥 Chat API received request:', JSON.stringify(body, null, 2));
  // ── Flexible Payload Parsing (Supports both /chat and legacy /mastra-v2 formats) ──
  const userId = body.userId || body.user?.id;
  const lang = body.lang || body.user?.lang || 'he';
  const currentPath = body.currentPath || body.payload?.currentPath || '/';

  let rawMessages = body.messages || [];
  // Fallback for legacy format (payload.text + payload.history)
  if (rawMessages.length === 0 && body.payload?.text) {
    const legacyHistory = (body.payload.history || []).map((m: any) => ({
      role: m.user ? 'user' : 'assistant',
      content: m.text
    }));
    rawMessages = [...legacyHistory, { role: 'user', content: body.payload.text }];
  }

  // Convert to intermediate Mastra history format
  const history = rawMessages.map((m: { role: string; content: string }) => ({
    text: m.content,
    user: m.role === 'user'
  }));

  // Get the last user message
  const lastUserMessage = [...rawMessages].reverse().find((m: { role: string }) => m.role === 'user');
  if (!lastUserMessage) {
    return json({
      content: t.get('bot.noMessageReceived'),
      reply: t.get('bot.noMessageReceived'),
      components: []
    });
  }

  try {
    
    if (!userId) {
      // ── Unregistered user → direct agent ──
      console.log('🔓 Unregistered user detected, using nonreg-bot');
      const nonregAgent = createUnregisteredBotAgent(GEMINI_API_KEY, lang);

      const agentMessages = [];
      // Include recent history for context (last 10 messages)
      if (history.length > 1) {
        const recentHistory = history.slice(-11, -1); // exclude current message
        for (const msg of recentHistory) {
          agentMessages.push({ role: msg.user ? 'user' : 'assistant', content: msg.text });
        }
      }

      agentMessages.push({
        role: 'user',
        content: `User is on page: ${currentPath}\n\nMessage: ${lastUserMessage.content}`
      });

      const result = await nonregAgent.generate(agentMessages);

      const response: Record<string, unknown> = {
        content: result.text || t.get('bot.responseProcessingError'),
        reply: result.text || t.get('bot.responseProcessingError'), // Essential for Bot.svelte compatibility
        components: [],
        agentType: 'nonregistered',
        ...result // Pass through all Mastra metadata (usage, etc.)
      };

      // Extract tool results for navigation & rich components
      if (result.response?.messages) {
        const toolMessages = result.response.messages.filter(
          (msg: { role: string }) => msg.role === 'tool'
        );

        for (const toolMessage of toolMessages) {
          for (const toolResult of toolMessage.content) {
            console.log('🔧 Nonreg tool executed:', toolResult.toolName, toolResult.output);
            
            // Handle generic tool outputs (navigation, timers, etc.)
            if (toolResult.toolName === 'navigateToPageTool' && toolResult.output?.value?.success) {
              response.navigation = toolResult.output.value.navigation;
            }
            // Pass through other standard tool outputs if they exist
            if (toolResult.output?.value) {
              const val = toolResult.output.value;
              if (val.timerAction) response.timerAction = val.timerAction;
              if (val.dataUpdate) response.dataUpdate = val.dataUpdate;
            }
          }
        }
      }

      // Detect rich rendering components
      const components = detectRenderComponents(lastUserMessage.content);
      if (components.length > 0) response.components = components;

      console.log('📤 Nonreg bot response:', response);
      return json(response);
    }

    // ── Registered user → Mastra workflow ──
    // @ts-expect-error global context for Mastra tools
    global.botContext = {
      fetchInstance: fetch,
      userId: userId?.toString() || 'anonymous',
      currentPath
    };

    console.log('🚀 Executing Mastra workflow for rich chat');
    const run = await mastra.getWorkflow('chatWorkflow').createRun();

    const startParams = {
      inputData: {
        message: lastUserMessage.content,
        history: history.slice(0, -1),
        userId: userId?.toString() || 'anonymous',
        language: lang,
        apiKey: GEMINI_API_KEY,
        fetchInstance: fetch,
        currentPath
      }
    };

    let result = await run.start(startParams);

    if (result.status === 'suspended') {
      result = await run.resume(startParams);
    }

    console.log('✅ Workflow completed, processing result...');
    const outputData = result.result || result.outputData || result.data || result;
    
    console.log('✅ Workflow output raw:', JSON.stringify(outputData, null, 2));

    const response: Record<string, unknown> = {
      components: [], // Default empty
      ...outputData, // Spread EVERYTHING from Mastra output (may overwrite components)
      content: (outputData.reply !== undefined && outputData.reply !== null && outputData.reply !== '') 
        ? outputData.reply 
        : (outputData.timerAction)
          ? (outputData.timerAction.success ? t.get('bot.timerActionSuccess', { message: outputData.timerAction.message || '' }) : t.get('bot.timerActionError', { error: outputData.timerAction.error || outputData.timerAction.message || '' }))
          : (outputData.navigation || outputData.intent || (outputData.components && outputData.components.length > 0)) 
            ? '' 
            : t.get('bot.responseProcessingError'),
      reply: outputData.reply ?? '',
      agentType: outputData.agentType || 'workflow'
    };

    // pass through specific enrichments (backwards compatibility)
    if (outputData.navigation) response.navigation = outputData.navigation;
    if (outputData.timerAction) response.timerAction = outputData.timerAction;
    if (outputData.dataUpdate) response.dataUpdate = outputData.dataUpdate;
    if (outputData.intent) response.intent = outputData.intent;
    
    // Detect rich UI components (supplemental)
    const detectedComponents = detectRenderComponents(lastUserMessage.content);
    if (detectedComponents.length > 0) {
      if (!Array.isArray(response.components)) {
        response.components = [];
      }
      (response.components as any[]).push(...detectedComponents);
    }

    console.log('📤 Mastra workflow response:', response);
    return json(response);
  } catch (error) {
    console.error('❌ Chat API Error:', error);
    return json(
      {
        content: t.get('bot.requestProcessingError'),
        reply: t.get('bot.requestProcessingError'),
        components: [],
        error: true,
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
};


// ── Rich component detection ─────────────────────────────
function detectRenderComponents(userText: string) {
  const t = userText.toLowerCase();
  const components = [];

  if (t.includes('סיכום') || t.includes('שותפויות') || t.includes('כל המידע')) {
    components.push({
      type: 'summary',
      props: {
        partnerships: [
          { name: 'אלון נכסים', stake: '34%', value: '₪2.4M', trend: 'up', change: '+8.2% השנה', members: 3 },
          { name: 'גליל טק', stake: '18%', value: '₪890K', trend: 'up', change: '+22% השנה', members: 5 },
          { name: 'מרכז מסחרי ב', stake: '50%', value: '₪1.1M', trend: 'down', change: '-3.1% השנה', members: 2 },
          { name: 'קרן ירוקה', stake: '12%', value: '₪340K', trend: 'up', change: '+5.4% השנה', members: 8 },
        ],
      },
    });
  }

  if (t.includes('הצבעה') || t.includes('הצביע') || t.includes('פתוח')) {
    components.push({
      type: 'voting',
      props: {
        proposal: 'חלוקת רווח שנתית 2024 — 70% הון עצמי / 30% השקעה חוזרת',
        options: ['בעד', 'נגד', 'נמנע'],
        deadline: '28.02.2025',
        partnership: 'אלון נכסים',
      },
    });
  }

  return components;
}
