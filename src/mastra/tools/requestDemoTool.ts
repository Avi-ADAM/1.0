import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getMcpContext } from '../../lib/server/mcpContext.js';

/**
 * The bot's half of the personal-demo flow.
 *
 * The dialog in `DemoRequest.svelte` is the same conversation in form shape —
 * which track, how they'd like to meet, how to reach them. Someone who is
 * already typing to the bot shouldn't be pushed back into a form to say the
 * same things, so the bot can file the request itself. Both paths POST the
 * identical body to `/api/demo`, so the lead record, the meetings-app guest
 * link and the two follow-up missions in the central rikma come out the same
 * either way; only `source` distinguishes them.
 */
export const requestDemoTool = createTool({
  id: 'requestDemoTool',
  description: `Book a personal 20-minute demo of 1lev1 for someone who wants to understand the platform before signing up.
Use this tool when the user asks to see a demo, asks to talk to a person, asks how to get started with help, or says they want to understand the model before registering.
Before calling it, gather in conversation:
- their name,
- an email OR a phone number (either one is enough — do not insist on both),
- which of the four tracks is closest to them (track),
- how they'd like to meet (timeMode).
Optionally ask, in one sentence, what they want to build or solve, and when suits them.
Never invent contact details. If the user hasn't given a name or any way to reach them, ask before calling this tool.`,
  inputSchema: z.object({
    name: z.string().describe("The person's name, as they gave it"),
    email: z.string().optional().describe('Email address, if given'),
    phone: z.string().optional().describe('Phone number, if given'),
    track: z
      .enum(['idea', 'partnership', 'provider', 'curious'])
      .describe(
        'idea = has an idea for a venture; partnership = already has a partnership; provider = provides a service and looks for ventures; curious = just wants to get to know the system'
      ),
    timeMode: z
      .enum(['scheduled', 'flexible', 'callback', 'recorded'])
      .describe(
        'scheduled = wants to fix a time; flexible = would rather drop into a meeting room whenever it suits them (a guest link is minted for them); callback = leaves details for the team to get back to them; recorded = wants to watch a recorded demo first'
      ),
    goal: z
      .string()
      .optional()
      .describe("In their own words: what they'd like to create or solve"),
    preferredTime: z
      .string()
      .optional()
      .describe('Free-text time preference, e.g. "evenings" or "Sun-Tue after 18:00"')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    /** Present only for `timeMode: 'flexible'` — a guest link they can use right away. */
    meetingLink: z.string().nullable().optional(),
    demoRequestId: z.number().nullable().optional()
  }),
  execute: async (inputData) => {
    const { name, email, phone, track, timeMode, goal, preferredTime } = inputData;
    const ctx = getMcpContext();
    const fetchInstance = ctx?.fetchInstance ?? fetch;
    const userId = ctx?.userId && ctx.userId !== 'anonymous' ? ctx.userId : null;
    const currentPath = ctx?.currentPath ?? '/';
    const lang = (ctx as any)?.lang ?? 'he';

    const failMsg =
      lang === 'he'
        ? 'לא הצלחתי לשלוח את הבקשה לדמו. אפשר לנסות שוב עוד רגע?'
        : lang === 'ar'
          ? 'لم أتمكن من إرسال طلب العرض التوضيحي. نحاول مرة أخرى بعد قليل؟'
          : lang === 'ru'
            ? 'Не удалось отправить заявку на демо. Попробуем ещё раз через минуту?'
            : "I couldn't send the demo request. Shall we try again in a moment?";

    try {
      const res = await fetchInstance('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email ?? null,
          phone: phone ?? null,
          track,
          timeMode,
          goal: goal ?? null,
          preferredTime: preferredTime ?? null,
          lang,
          page: currentPath,
          source: 'bot',
          userId
        })
      });

      if (!res.ok) return { success: false, message: failMsg };

      const data = await res.json();
      if (!data?.success) return { success: false, message: failMsg };

      const link = data.meetingLink ?? null;
      const base =
        lang === 'he'
          ? 'קיבלנו את הפרטים, תודה. נחזור אליכם כדי לתאם דמו אישי של כ‑20 דקות.'
          : lang === 'ar'
            ? 'استلمنا تفاصيلكم، شكرًا. سنعود إليكم لتنسيق عرض توضيحي شخصي مدته نحو 20 دقيقة.'
            : lang === 'ru'
              ? 'Мы получили ваши контакты, спасибо. Мы свяжемся с вами, чтобы назначить личное демо примерно на 20 минут.'
              : "Got your details, thank you. We'll get back to you to arrange a personal demo of about 20 minutes.";

      const linkLine = link
        ? lang === 'he'
          ? ` חדר הפגישה שלכם כבר מוכן — אפשר להיכנס בזמן שנוח, בלי הרשמה: ${link}`
          : lang === 'ar'
            ? ` غرفة اللقاء جاهزة — يمكنكم الدخول في الوقت المناسب بدون تسجيل: ${link}`
            : lang === 'ru'
              ? ` Ваша комната встречи уже готова — заходите, когда удобно, без регистрации: ${link}`
              : ` Your meeting room is already open — walk in whenever it suits you, no sign-up: ${link}`
        : '';

      return {
        success: true,
        message: base + linkLine,
        meetingLink: link,
        demoRequestId: data.demoRequestId ?? null
      };
    } catch (e) {
      console.error('requestDemoTool error:', e);
      return { success: false, message: failMsg };
    }
  }
});
