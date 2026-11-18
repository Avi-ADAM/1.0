/**
 * One answer to "which language does this agent speak?" for all five site
 * locales (PLAN_EN_READINESS stage 5.4).
 *
 * The agents' instructions are mostly Hebrew (for `he`) and English (for
 * everyone else), and several had a `he ? Hebrew : ar ? Arabic : English`
 * chain — so a Russian or Spanish member was told, in the agent's own system
 * prompt, that they speak English. That is how a Hebrew answer leaks into a
 * non-Hebrew conversation: the model follows the explicit language line.
 *
 * `agentLanguageName` fixes the line; `agentLanguageDirective` adds one
 * unmistakable, per-language instruction to every agent, including the ones
 * whose prompt is otherwise Hebrew. These are instructions to a model, not
 * words on a screen — they are deliberately written in each model's own
 * language, which is why they live here rather than in `translations/`.
 */

export const AGENT_LANGS = ['he', 'en', 'ar', 'ru', 'es'] as const;

const LANGUAGE_NAMES: Record<string, string> = {
    he: 'Hebrew (עברית)',
    en: 'English',
    ar: 'Arabic (العربية)',
    ru: 'Russian (Русский)',
    es: 'Spanish (Español)'
};

/** The name of the reader's language, in English, with its own endonym. */
export function agentLanguageName(lang: string | null | undefined): string {
    return LANGUAGE_NAMES[String(lang ?? 'en')] ?? LANGUAGE_NAMES.en;
}

const DIRECTIVES: Record<string, string> = {
    he: `
## שפת התשובה (חובה)
- שפת המשתמש היא עברית. הבן את הודעת המשתמש בעברית והשב תמיד בעברית, גם אם ההוראות או נתוני הכלים באנגלית.
- פלט מובנה (JSON, ארגומנטים של כלים, מזהים וקישורים) נשאר בתבנית הנדרשת ואינו מתורגם.
- לעולם אל תענה בעברית למשתמש שכותב בשפה אחרת; אם הודעתו בשפה אחרת, ענה בשפתו.`,
    en: `
## Reply language (mandatory)
- The user's language is English. Understand their message in English and always answer in English, even when the instructions or tool data are in another language.
- Structured output (JSON, tool arguments, ids and links) stays in its required format and is not translated.
- Never answer in Hebrew to a user writing in another language; if their message is in another language, answer in theirs.`,
    ar: `
## لغة الإجابة (إلزامي)
- لغة المستخدم هي العربية. افهم رسالته بالعربية وأجب دائماً بالعربية، حتى لو كانت التعليمات أو بيانات الأدوات بلغة أخرى.
- يبقى الإخراج المنظّم (JSON، وسائط الأدوات، المعرّفات والروابط) بصيغته المطلوبة ولا يُترجم.
- لا تُجب بالعبرية أبداً على مستخدم يكتب بلغة أخرى؛ إن كانت رسالته بلغة أخرى فأجب بلغته.`,
    ru: `
## Язык ответа (обязательно)
- Язык пользователя — русский. Понимайте сообщение по-русски и всегда отвечайте по-русски, даже если инструкции или данные инструментов на другом языке.
- Структурированный вывод (JSON, аргументы инструментов, идентификаторы и ссылки) остаётся в требуемом формате и не переводится.
- Никогда не отвечайте на иврите пользователю, пишущему на другом языке; если его сообщение на другом языке, отвечайте на нём.`,
    es: `
## Idioma de la respuesta (obligatorio)
- El idioma del usuario es el español. Entiende su mensaje en español y responde siempre en español, aunque las instrucciones o los datos de las herramientas estén en otro idioma.
- La salida estructurada (JSON, argumentos de herramientas, identificadores y enlaces) conserva su formato y no se traduce.
- Nunca respondas en hebreo a alguien que escribe en otro idioma; si su mensaje está en otro idioma, responde en el suyo.`
};

/** An explicit, per-language instruction appended to every agent's prompt. */
export function agentLanguageDirective(lang: string | null | undefined): string {
    return DIRECTIVES[String(lang ?? 'en')] ?? DIRECTIVES.en;
}
