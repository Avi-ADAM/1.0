import { GEMINI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { mastra } from '../../../mastra';
import { createUnregisteredBotAgent } from '../../../mastra/agents/nonreg-bot.js';
import { t } from '$lib/translations';
import { sendToSer } from '$lib/send/sendToSer.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.1lev1.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Enhanced Chat API — connected to Mastra agents.
 * Used by the expanded /chat page for rich, tool-capable conversations.
 * Supports both registered (workflow) and unregistered (direct agent) users.
 */
export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
  const body = await request.json();
  console.log('📥 Chat API:', body.userId ? `user=${body.userId}` : 'unregistered', `lang=${body.lang || body.user?.lang || 'he'}`);
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

  // Preserve rich history for Mastra agents (essential for Gemini thought signatures)
  const history = rawMessages.map((m: any) => ({
    text: m.content,
    user: m.role === 'user',
    role: m.role,
    content: m.content,
    parts: m.parts // Preserve Gemini/AI-SDK parts if present
  }));

  // Get the last user message
  const lastUserMessage = [...rawMessages].reverse().find((m: { role: string }) => m.role === 'user');
  if (!lastUserMessage) {
    return json({
      content: t.get('bot.noMessageReceived'),
      reply: t.get('bot.noMessageReceived'),
      components: []
    }, { headers: corsHeaders });
  }

  try {
    
    if (!userId) {
      // ── Unregistered user → direct agent ──
      console.log('🔓 Unregistered user detected, using nonreg-bot');
      global.botContext = {
        fetchInstance: fetch,
        userId: 'anonymous',
        isInternalBot: false,
        currentPath,
        lang,
      };
      const nonregAgent = createUnregisteredBotAgent(GEMINI_API_KEY, lang);

      const agentMessages = [];
      // Include recent history for context (last 10 messages)
      // Strip parts/tool-call data to avoid Gemini thought_signature errors
      if (history.length > 1) {
        const recentHistory = history.slice(-11, -1); // exclude current message
        for (const msg of recentHistory) {
          const role = msg.role || (msg.user ? 'user' : 'assistant');
          const content = msg.content || msg.text;
          if (role === 'tool' || !content || typeof content !== 'string') continue;
          agentMessages.push({ role, content });
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
        rawAgentMessages: result.response?.messages,
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

      console.log('📤 Nonreg bot response: reply=', result.text?.slice(0, 80));
      if (global.botContext) delete (global as any).botContext;
      return json(response, { headers: corsHeaders });
    }

    // ── Registered user → Mastra workflow ──
    global.botContext = {
      fetchInstance: fetch,
      userId: userId?.toString() || 'anonymous',
      isInternalBot: true, // JWT-authenticated session
      currentPath,
      lang,
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

    console.log('✅ Workflow completed');
    const outputData = result.result || result.outputData || result.data || result;
    
    if (result.status === 'failed') {
      const err = outputData?.error || result.error;
      const step = result.stepExecutionPath?.at(-1);
      console.error(`❌ Workflow failed @ ${step}: [${err?.name}] ${err?.message}`);
      if (err?.url) console.error(`   → URL: ${err.url} | status: ${err?.statusCode}`);
      if (err?.responseBody) console.error(`   → Body: ${String(err.responseBody).slice(0, 200)}`);
    } else {
      console.log('📊 Workflow result: intent=', outputData?.intent?.type, '| agent=', outputData?.agentType, '| reply=', outputData?.reply?.slice(0, 80));
    }

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
    const missionNameHint: string | null = outputData.intent?.details?.target ?? null;
    const timerEditComponents = userId
      ? await detectTimerEditComponents(lastUserMessage.content, userId.toString(), fetch, missionNameHint)
      : [];
    const allExtra = [...detectedComponents, ...timerEditComponents];
    if (allExtra.length > 0) {
      if (!Array.isArray(response.components)) {
        response.components = [];
      }
      (response.components as any[]).push(...allExtra);
    }

    console.log('📤 Workflow response: content=', String(response.content).slice(0, 80), '| nav=', !!response.navigation, '| timer=', !!response.timerAction);
    return json(response, { headers: corsHeaders });
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
      { status: 500, headers: corsHeaders }
    );
  }
};


// ── Timer interval edit component detection ──────────────
// Matches intent to edit/correct timer times regardless of exact phrasing.
// Hebrew: any combo of (ערוך/לערוך/עריכת/שנה/תקן) near (טיימר/זמן/שעות/קטע/זמנים)
// English: edit/fix/correct/adjust near timer/interval/time/hours
const TIMER_EDIT_PATTERN = new RegExp(
  // Hebrew — verb near noun (up to 20 chars apart, or noun near verb)
  '(ערו[ךכ]|לערוך|עריכת|שינוי|שנה|תקן|לתקן)(.{0,20})(טיימר|זמן|שעות|קטע|זמנים)' +
  '|(טיימר|זמן|שעות|קטע|זמנים)(.{0,20})(ערו[ךכ]|לערוך|עריכת|שינוי|שנה|תקן|לתקן)' +
  // English
  '|edit.{0,15}(timer|interval|time|hours)' +
  '|(fix|correct|adjust|change|update).{0,15}(timer|interval|time|hours)',
  'i'
);

async function detectTimerEditComponents(
  userText: string,
  userId: string,
  fetchInstance: Function,
  missionNameHint: string | null = null
): Promise<any[]> {
  if (!TIMER_EDIT_PATTERN.test(userText)) return [];

  try {
    const res = await sendToSer({ id: userId }, '8getMissionsOnProgress', 0, 0, false, fetchInstance);
    const missions = (res as any)?.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data ?? [];

    // Only include missions that have at least one completed interval
    let withTimers = missions.filter((m: any) => {
      const intervals = m.attributes.activeTimer?.data?.attributes?.timers;
      return Array.isArray(intervals) && intervals.some((iv: any) => iv.start && iv.stop);
    });
    if (withTimers.length === 0) return [];

    // If we know which mission the user asked about, narrow down to just that one.
    // Score each mission by how many words from the hint appear in its name.
    if (missionNameHint) {
      const hintWords = missionNameHint
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 1);

      const scored = withTimers.map((m: any) => {
        const name = (m.attributes.name || '').toLowerCase();
        const score = hintWords.reduce((s: number, w: string) => s + (name.includes(w) ? 1 : 0), 0);
        return { m, score };
      });

      const bestScore = Math.max(...scored.map((x: any) => x.score));
      if (bestScore > 0) {
        // Keep only missions that share the most words with the hint
        withTimers = scored
          .filter((x: any) => x.score === bestScore)
          .map((x: any) => x.m);
      }
      // If bestScore === 0 nothing matched the hint — fall through and show all
    }

    return withTimers.map((mission: any) => ({
      type: 'timer_edit',
      props: {
        missionId: mission.id,
        missionName: mission.attributes.name,
        timerId: mission.attributes.activeTimer.data.id,
        projectId: mission.attributes.project?.data?.id || '',
        intervals: mission.attributes.activeTimer.data.attributes.timers || []
      }
    }));
  } catch (err) {
    console.error('detectTimerEditComponents error:', err);
    return [];
  }
}

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

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}