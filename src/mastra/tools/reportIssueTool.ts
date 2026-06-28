import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getMcpContext } from '../../lib/server/mcpContext.js';

export const reportIssueTool = createTool({
  id: 'reportIssueTool',
  description: `Report a bug, suggest a feature, send a partnership inquiry, or contact the 1lev1 site team.
Use this tool whenever the user:
- Reports a problem or error on the site (type: bug)
- Suggests a new feature or improvement (type: feature)
- Wants to inquire about a partnership (type: partnership)
- Wants to contact the site team for any other reason (type: contact)
The report is saved and the admin is notified immediately.`,
  inputSchema: z.object({
    type: z
      .enum(['bug', 'feature', 'partnership', 'contact'])
      .describe('Type: bug (problem), feature (suggestion), partnership (collaboration inquiry), contact (other)'),
    description: z
      .string()
      .describe('Full description of the issue, feature idea, or message — in the user\'s own words'),
    userName: z.string().optional().describe('User\'s name if they provided it'),
    userEmail: z.string().optional().describe('User\'s email if they provided it for follow-up'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    strapiId: z.number().nullable().optional(),
  }),
  execute: async (inputData) => {
    const { type, description, userName, userEmail } = inputData;
    const ctx = getMcpContext();
    const fetchInstance = ctx?.fetchInstance ?? fetch;
    const userId = ctx?.userId && ctx.userId !== 'anonymous' ? ctx.userId : null;
    const currentPath = ctx?.currentPath ?? '/';
    const lang = (ctx as any)?.lang ?? 'he';

    try {
      const res = await fetchInstance('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description, page: currentPath, userId, userName, userEmail, lang }),
      });

      if (res.ok) {
        const data = await res.json();
        const successMsg =
          lang === 'he'
            ? 'הפנייה נשלחה בהצלחה לצוות האתר! נחזור אליך בהקדם.'
            : lang === 'ar'
            ? 'تم إرسال طلبك بنجاح إلى فريق الموقع! سنتواصل معك قريباً.'
            : lang === 'ru'
            ? 'Ваше обращение успешно отправлено команде сайта! Мы свяжемся с вами в ближайшее время.'
            : 'Your report was sent to the site team! We\'ll get back to you soon.';
        return { success: true, message: successMsg, strapiId: data.strapiId ?? null };
      }

      const failMsg =
        lang === 'he' ? 'שגיאה בשליחת הפנייה. נסה שנית.' : 'Failed to send report. Please try again.';
      return { success: false, message: failMsg };
    } catch (e) {
      console.error('reportIssueTool error:', e);
      return { success: false, message: 'Error sending report.' };
    }
  },
});
