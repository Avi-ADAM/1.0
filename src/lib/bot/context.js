import { GoogleGenerativeAI } from '@google/generative-ai';
import { CHAT_GEMINI_MODELS } from '../../mastra/lib/createModel';

export const SITE_CONTEXT = `
שם האתר: 1💗1 (1lev1.com)
תיאור: פלטפורמה דיגיטלית חדשנית ליצירה, ניהול והגשמה של פרויקטים בשיתוף פעולה ובהסכמה מלאה. מאפשרת ניהול קבוצות ("רקמות") מבוזר תוך שמירה על עצמאות.
מטרות: שותפויות מבוססות הסכמה, ניהול משאבים ומשימות מבוזר, חלוקת רווחים דינמית, חיבור בין אנשים.
תכונות: קבלת החלטות פה-אחד, פנקס דיגיטלי מבוזר, כלי ניהול (גרפים, גאנט), מערכת הצבעות, שיתוף חפצים, חלוקת רווחים דינמית.
יתרונות: חיבור לרקמות מתאימות, עצמאות אישית בעבודה משותפת, הקמת שותפות קלה, השתתפות במערכת מבוססת הסכמה.
דרישות הרשמה: הסכמה ל"אמנת החירות העולמית" שתוצג באתר.
חזון: יצירת עולם טוב יותר באמצעות שיתוף פעולה מבוסס ערכים, כישורים והסכמה.
פנייה לצוות: הבוט יכול לעזור לדווח על תקלות (באגים), להציע פיצ'רים חדשים, לשלוח פנייה לשותפות, או ליצור קשר עם צוות האתר - גם ללא רישום.
`;

/**
 * A Gemini client that walks the same model order as the Mastra agents
 * (`CHAT_GEMINI_MODELS`). The bots only call `generateContent`.
 *
 * Never one hard-coded model id: an id Google doesn't know (this was
 * `gemini-3-flash-preview-preview`) or an overloaded model fails every call,
 * and the bot then answers every message with "I didn't understand".
 * @param {string | undefined} apiKey
 */
export function createGeminiClient(apiKey) {
  if (!apiKey) throw new Error('Gemini API Key not found!');
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = CHAT_GEMINI_MODELS.map((model) => genAI.getGenerativeModel({ model }));
  return {
    /** @param {Parameters<(typeof models)[number]['generateContent']>[0]} request */
    async generateContent(request) {
      let lastError;
      for (let i = 0; i < models.length; i++) {
        try {
          return await models[i].generateContent(request);
        } catch (error) {
          lastError = error;
          console.warn(`[gemini] ${CHAT_GEMINI_MODELS[i]} failed:`, /** @type {any} */ (error)?.message ?? error);
        }
      }
      throw lastError;
    }
  };
}
