/**
 * Local, instant reading of a visitor's free text (he / en):
 *  - `closestTemplate` picks the ready idea whose parts fit best — the answer
 *    the kiosk falls back to when no live draft arrives in time;
 *  - `inferSkills` tags an assistant-named part with the fair's skill keys, so
 *    `computeMissionMatchScore` has something to match people against.
 *
 * Substring matching on lowercase text is deliberate: Hebrew prefixes
 * (ה־, ו־, ל־, ב־) glue onto the word, and a stem still finds it.
 */
import type { IdeaKey, SkillKey } from '../types';

const IDEA_WORDS: Record<IdeaKey, string[]> = {
  mural: ['ציור', 'קיר', 'גרפיטי', 'אמנות רחוב', 'צבע', 'mural', 'wall', 'graffiti', 'street art', 'paint'],
  book: ['ספר', 'סיפור', 'ילדים', 'איור', 'קומיקס', 'שיר', 'book', 'story', 'children', 'comic', 'poem', 'illustrat'],
  repair: ['תיקון', 'תיקונים', 'לתקן', 'מחזור', 'קפה', 'רהיט', 'repair', 'fix', 'recycl', 'café', 'cafe', 'coffee', 'furniture'],
  fashion: ['אופנה', 'בגד', 'בגדים', 'תפירה', 'שמלה', 'תכשיט', 'fashion', 'cloth', 'sew', 'dress', 'jewel', 'textile'],
  festival: ['פסטיבל', 'מוזיקה', 'הופעה', 'להקה', 'מסיבה', 'אוכל', 'מסעדה', 'אירוע', 'festival', 'music', 'concert', 'band', 'party', 'food', 'event'],
  ceramics: ['קרמיקה', 'חימר', 'כלים', 'סטודיו', 'סדנה', 'סדנאות', 'פיסול', 'ceramic', 'pottery', 'clay', 'studio', 'workshop', 'sculpt']
};

const SKILL_WORDS: Record<SkillKey, string[]> = {
  design: ['עיצוב', 'מעצב', 'מיתוג', 'לוגו', 'עימוד', 'design', 'brand', 'logo', 'layout'],
  illustration: ['איור', 'מאייר', 'סקיצ', 'illustrat', 'sketch', 'drawing'],
  painting: ['ציור', 'צבע', 'קיר', 'paint', 'mural'],
  photo: ['צילום', 'צלם', 'תמונ', 'photo', 'camera'],
  video: ['וידאו', 'סרט', 'הסרטה', 'video', 'film'],
  music: ['מוזיק', 'הגבר', 'להקה', 'שיר', 'music', 'sound', 'band', 'song'],
  writing: ['כתיב', 'כותב', 'סיפור', 'טקסט', 'תוכן', 'writ', 'story', 'text', 'content', 'copy'],
  community: ['קהיל', 'שכנ', 'מתנדב', 'גיוס', 'שותפ', 'communit', 'neighbo', 'volunteer', 'outreach'],
  events: ['אירוע', 'הפקה', 'פסטיבל', 'השקה', 'לוגיסטיקה', 'event', 'production', 'festival', 'launch', 'logistic'],
  ceramics: ['קרמיק', 'חימר', 'תנור', 'גלזור', 'ceramic', 'clay', 'kiln', 'pottery', 'glaze'],
  carpentry: ['נגר', 'עץ', 'רהיט', 'הקמת', 'פיגום', 'carpent', 'wood', 'furniture', 'set up', 'scaffold'],
  sewing: ['תפיר', 'בד', 'בגד', 'קולקצי', 'sew', 'fabric', 'cloth', 'textile', 'collection'],
  cooking: ['אוכל', 'בישול', 'שף', 'קפה', 'מטבח', 'food', 'cook', 'chef', 'kitchen', 'coffee', 'café', 'cafe'],
  marketing: ['שיווק', 'פרסום', 'רשתות', 'קידום', 'מכיר', 'market', 'promot', 'social', 'advertis', 'sales'],
  tech: ['אתר', 'חנות מקוונת', 'דיגיטל', 'אפליקצי', 'חשמל', 'website', 'online', 'digital', 'app', 'electr'],
  fixing: ['תיקון', 'תיקונ', 'לתקן', 'מכשיר', 'repair', 'fix', 'device'],
  teaching: ['הדרכ', 'סדנ', 'לימוד', 'מורה', 'שיעור', 'teach', 'workshop', 'lesson', 'class', 'guide']
};

const hits = (text: string, words: readonly string[]) => words.filter((w) => text.includes(w)).length;

/** The ready idea nearest to free text; `fallback` when no word fits any. */
export function closestTemplate(text: string, fallback: IdeaKey = 'ceramics'): IdeaKey {
  const t = (text ?? '').toLowerCase();
  let best: IdeaKey = fallback;
  let bestScore = 0;
  for (const key of Object.keys(IDEA_WORDS) as IdeaKey[]) {
    const score = hits(t, IDEA_WORDS[key]);
    if (score > bestScore) {
      best = key;
      bestScore = score;
    }
  }
  return best;
}

/** Skill keys a part's name suggests, strongest first, at most three. */
export function inferSkills(name: string): SkillKey[] {
  const t = (name ?? '').toLowerCase();
  return (Object.keys(SKILL_WORDS) as SkillKey[])
    .map((k) => [k, hits(t, SKILL_WORDS[k])] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);
}
