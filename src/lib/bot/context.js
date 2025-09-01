import { GoogleGenerativeAI } from '@google/generative-ai';

export const SITE_CONTEXT = `
שם האתר: 1💗1 (1lev1.com)
תיאור: פלטפורמה דיגיטלית חדשנית ליצירה, ניהול והגשמה של פרויקטים בשיתוף פעולה ובהסכמה מלאה. מאפשרת ניהול קבוצות ("רקמות") מבוזר תוך שמירה על עצמאות.
מטרות: שותפויות מבוססות הסכמה, ניהול משאבים ומשימות מבוזר, חלוקת רווחים דינמית, חיבור בין אנשים.
תכונות: קבלת החלטות פה-אחד, פנקס דיגיטלי מבוזר, כלי ניהול (גרפים, גאנט), מערכת הצבעות, שיתוף חפצים, חלוקת רווחים דינמית.
יתרונות: חיבור לרקמות מתאימות, עצמאות אישית בעבודה משותפת, הקמת שותפות קלה, השתתפות במערכת מבוססת הסכמה.
דרישות הרשמה: הסכמה ל"אמנת החירות העולמית" שתוצג באתר.
חזון: יצירת עולם טוב יותר באמצעות שיתוף פעולה מבוסס ערכים, כישורים והסכמה.
`;

export function createGeminiClient(apiKey) {
  if (!apiKey) throw new Error('Gemini API Key not found!');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}
