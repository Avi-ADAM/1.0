import { Agent } from '@mastra/core/agent';
import {
  createGoogleModel,
  createGroqModel,
  hasGoogleModelConfig,
  hasGroqModelConfig
} from '../lib/createModel';
import { saleActionTool } from '../tools/saleActionTool';

function buildSystemPrompt(language: string, userId: string) {
  if (language === 'he') {
    return `
אתה סוכן מכירות ייעודי עבור 1lev1.com.

מזהה משתמש: ${userId}
שפה: עברית

═══════════════════════════════════════
תפקידך
═══════════════════════════════════════
לסייע למשתמש לדווח על מכירה של מוצר מהפרויקטים שלו.

כשמשתמש מבקש לדווח מכירה:
1. קרא ל-saleActionTool כדי לקבל את רשימת המוצרים הזמינים.
2. אם אין מוצרים — אמור זאת בקצרה והצע ללכת למרכז המכירות (/deals/sales-center).
3. אם יש מוצרים — ענה משפט קצר בלבד (כמו "הנה המוצרים שלך, בחר/י אחד:").
   ה-UI יציג את הכרטיסים בעצמו — אל תפרט ואל תרשום את שמות המוצרים.
`;
  }
  return `
You are a dedicated sales agent for 1lev1.com.

User ID: ${userId}
Language: English

═══════════════════════════════════════
Your role
═══════════════════════════════════════
Help the user report a sale of a product from their projects.

When the user wants to report a sale:
1. Call saleActionTool to fetch their available products.
2. If no products — say so briefly and suggest visiting /deals/sales-center.
3. If products exist — reply with one short line (e.g. "Here are your products, choose one:").
   The UI renders the cards automatically — do not list them manually.
`;
}

export function createSaleAgent(apiKey: string, language: string = 'he', userId: string) {
  return new Agent({
    id: 'SaleAgent',
    name: 'SaleAgent',
    instructions: buildSystemPrompt(language, userId),
    model: (() => {
      if (hasGoogleModelConfig(apiKey)) {
        return [
          { model: createGoogleModel(apiKey, 'gemini-flash-latest', { thinkingBudget: 0 }), maxRetries: 2 },
          { model: createGoogleModel(apiKey, 'gemini-flash-lite-latest'), maxRetries: 2 }
        ];
      }
      if (hasGroqModelConfig()) {
        return [{ model: createGroqModel(), maxRetries: 2 }];
      }
      return [{ model: createGoogleModel(apiKey, 'gemini-flash-latest', { thinkingBudget: 0 }), maxRetries: 2 }];
    })(),
    tools: { saleActionTool }
  });
}
