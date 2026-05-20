// mastra/workflows/analyze-cv.ts
// CV → Gemini extraction → Gemini embeddings + Pinecone matching
// (Anthropic was swapped out for Gemini per PLAN_ONBOARDING §5.1)

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import { createGoogleModel } from '../lib/createModel';
import { matchAllCategories } from '../../lib/embed/matcher';

// Polyfill global DOM objects required by pdfjs-dist when running in serverless environments (like Vercel)
// where @napi-rs/canvas cannot be loaded.
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {} as any;
}
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {} as any;
}
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {} as any;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const MatchResultSchema = z.object({
  input: z.string(),
  status: z.enum(['matched', 'suggestion', 'new']),
  existingId: z.string().optional(),
  existingLabel: z.string().optional(),
  similarity: z.number().optional(),
  synonyms: z.array(z.string()).optional(),
});

const MatchGroupSchema = z.object({
  skills: z.array(MatchResultSchema),
  roles: z.array(MatchResultSchema),
  methods: z.array(MatchResultSchema),
  missions: z.array(MatchResultSchema),
  vallues: z.array(MatchResultSchema),
});

const ProposedSpSchema = z.object({
  name: z.string(),
  descrip: z.string().optional(),
});

export const CvWorkflowOutputSchema = z.object({
  matched: MatchGroupSchema,
  suggestions: MatchGroupSchema,
  newItems: MatchGroupSchema,
  tasks: z.array(z.string()),
  proposed_sps: z.array(ProposedSpSchema),
  sourceLang: z.enum(['he', 'en', 'mixed', 'other']).optional(),
});

export type CvWorkflowOutput = z.infer<typeof CvWorkflowOutputSchema>;

// ─── Step 1: extract text from file ──────────────────────────────────────────

const SUPPORTED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'text/plain': 'txt',
  'text/markdown': 'txt',
  'application/rtf': 'rtf',
};

const LangSchema = z.enum(['he', 'en', 'ar']).default('he');
type Lang = z.infer<typeof LangSchema>;

const extractTextStep = createStep({
  id: 'extract-text',
  inputSchema: z.object({
    fileBuffer: z.instanceof(ArrayBuffer).optional(),
    mimeType: z.string().optional(),
    fileName: z.string().optional(),
    rawText: z.string().optional(),
    lang: LangSchema.optional(),
  }),
  outputSchema: z.object({
    text: z.string(),
    detectedFormat: z.string(),
    lang: LangSchema,
  }),
  execute: async ({ inputData }) => {
    const { fileBuffer, mimeType, fileName, rawText } = inputData;
    const lang: Lang = inputData.lang ?? 'he';

    // Free-text path (e.g. /onboard/provider/describe) — skip file parsing.
    if (rawText && rawText.trim().length >= 50) {
      return { text: rawText.trim(), detectedFormat: 'rawText', lang };
    }
    if (!fileBuffer || !mimeType) {
      throw new Error('חסר קלט: יש לספק קובץ או טקסט (לפחות 50 תווים).');
    }

    const buffer = Buffer.from(fileBuffer);
    const ext = fileName?.split('.').pop()?.toLowerCase() ?? '';

    let text = '';
    let detectedFormat = SUPPORTED_TYPES[mimeType] ?? ext ?? 'unknown';

    if (mimeType === 'application/pdf' || ext === 'pdf') {
      // pdfjs-dist tries to load its worker via `await import(workerSrc)` where
      // workerSrc is a runtime string ("./pdf.worker.mjs"). On Vercel serverless
      // the bundler cannot track that dynamic specifier, so the worker file is
      // missing from the function output and the "fake worker" setup fails.
      // Pre-importing the module with a literal specifier makes Rollup bundle
      // it, and pdfjs-dist will use `globalThis.pdfjsWorker.WorkerMessageHandler`
      // instead of attempting the dynamic import.
      if (!(globalThis as any).pdfjsWorker) {
        (globalThis as any).pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
      }
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(fileBuffer) });
      try {
        text = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
      detectedFormat = 'pdf';
    } else if (
      mimeType.includes('wordprocessingml') ||
      mimeType === 'application/msword' ||
      ext === 'docx' ||
      ext === 'doc'
    ) {
      const mammothPkg = 'mammoth';
      const mod = await import(/* @vite-ignore */ mammothPkg).catch(() => {
        throw new Error('חבילת mammoth לא מותקנת — הריצי npm i mammoth');
      });
      const mammoth = (mod as any).default ?? mod;
      text = (await mammoth.extractRawText({ buffer })).value;
      detectedFormat = 'docx';
    } else if (
      mimeType.startsWith('text/') ||
      mimeType === 'application/rtf' ||
      ['txt', 'md', 'rtf'].includes(ext)
    ) {
      text = buffer.toString('utf-8');
    } else {
      throw new Error(`פורמט לא נתמך: ${mimeType || ext}`);
    }

    if (text.trim().length < 50) {
      throw new Error('לא ניתן לחלץ טקסט — ייתכן שהקובץ סרוק כתמונה.');
    }

    return { text: text.trim(), detectedFormat, lang };
  },
});

// ─── Step 2: Gemini extracts structured data ─────────────────────────────────

// Items can be either a plain string in the target language or a multi-lingual
// object — Gemini decides per-item whether the source carried alt-language
// synonyms worth preserving.
const ItemSchema = z.union([
  z.string(),
  z.object({
    he: z.string().optional(),
    en: z.string().optional(),
    ar: z.string().optional(),
  }),
]);

const RawExtractionSchema = z.object({
  skills: z.array(ItemSchema).default([]),
  roles: z.array(ItemSchema).default([]),
  methods: z.array(ItemSchema).default([]),
  tasks: z.array(ItemSchema).default([]),
  vallues: z.array(ItemSchema).default([]),
  proposed_sps: z.array(ProposedSpSchema).default([]),
  sourceLang: z.enum(['he', 'en', 'ar', 'mixed', 'other']).default('he'),
  lang: z.enum(['he', 'en', 'ar']).optional(),  // output language passed through
});

type RawItem = z.infer<typeof ItemSchema>;
type NormalizedItem = { canonical: string; synonyms: string[] };

function normalizeItemFor(raw: RawItem, primary: Lang): NormalizedItem {
  if (typeof raw === 'string') return { canonical: raw.trim(), synonyms: [] };
  const others: Lang[] = (['he', 'en', 'ar'] as Lang[]).filter((l) => l !== primary);
  const canonical = (raw[primary] ?? raw.he ?? raw.en ?? raw.ar ?? '').trim();
  const synonyms = others
    .map((l) => raw[l]?.trim())
    .filter((s): s is string => !!s && s !== canonical);
  return { canonical, synonyms };
}

const LANG_NAMES: Record<Lang, string> = {
  he: 'Hebrew (עברית)',
  en: 'English',
  ar: 'Arabic (العربية)',
};

const analyzeWithGeminiStep = createStep({
  id: 'analyze-with-gemini',
  inputSchema: z.object({
    text: z.string(),
    detectedFormat: z.string(),
    lang: LangSchema,
  }),
  outputSchema: RawExtractionSchema,
  execute: async ({ inputData }) => {
    const lang: Lang = inputData.lang ?? 'he';
    const primaryName = LANG_NAMES[lang];
    const others = (['he', 'en', 'ar'] as Lang[]).filter((l) => l !== lang);

    const agent = new Agent({
      id: 'CvExtractor',
      name: 'CvExtractor',
      instructions:
        'You extract structured data from CVs and free-text descriptions. Return JSON only — no explanations, no markdown fences.',
      model: createGoogleModel(undefined, 'gemini-flash-latest', { thinkingBudget: 0 }),
    });

    const prompt = `Analyze the following text (a CV or free-text self-description) and return JSON ONLY:
{
  "skills":        [],   // technical + soft skills
  "roles":         [],   // job titles / positions held
  "methods":       [],   // work styles: remote, on-site, full-time, part-time, freelance
  "tasks":         [],   // discrete tasks the person can do: logo design, website build, moving help
  "vallues":       [],   // leading values: honesty, creativity, curiosity, responsibility, growth, freedom
  "proposed_sps":  [],   // physically-shareable resources: iPad Pro, car, studio space, camera
  "sourceLang":    "he"  // 'he' | 'en' | 'ar' | 'mixed' | 'other' — source language
}

Critical i18n rules:
- Output language: **ALWAYS ${primaryName}** for every item — translate if the source is in a different language.
- Each item is either a plain string in ${primaryName}, OR an object carrying same-meaning labels in other languages
  as synonyms, e.g. { "${lang}": "...", "${others[0]}": "...", "${others[1]}": "..." }.
  Only include alt-lang fields when the source actually contained that wording — do not invent.
- Mandatory: at least 3 items in EACH of skills/roles/tasks/vallues — you may infer leading values
  from tone, focus, and work style even if not stated explicitly.
- If truly no info exists for a category (nothing inferable) — empty array; never fabricate.
- methods: 1–4 items. proposed_sps: only if physical equipment/space/property is explicitly mentioned.
- Each proposed_sp: { "name": "...", "descrip": "..." } (descrip optional, name in ${primaryName}).
- sourceLang: report the dominant language of the SOURCE text ('he' / 'en' / 'ar' / 'mixed' / 'other').

ATOMICITY rules (very important for skills):
- **skills must be ATOMIC** — one concept per item, never a bundle.
  ✗ BAD:  "Cloud Technologies AWS S3"          → one chip with 3 things lumped together.
  ✓ GOOD: "Cloud Technologies", "AWS", "S3"    → three separate chips.
  ✗ BAD:  "Python, Django, FastAPI"             → comma-separated list as one skill.
  ✓ GOOD: "Python", "Django", "FastAPI"         → three skills.
  ✗ BAD:  "React/Vue/Angular"                   → multiple frameworks bundled.
  ✓ GOOD: "React", "Vue", "Angular".
  Split umbrella terms from their concrete tools — keep BOTH the family ("Cloud Technologies") and the specific tools ("AWS", "S3") as separate skills.
- roles, methods, tasks, vallues: keep as written by the source — they CAN be multi-word phrases
  (e.g. role "Senior Backend Engineer", method "hybrid work", task "build a logo for a non-profit").
  Atomization applies to SKILLS ONLY.

---
${inputData.text.slice(0, 12000)}
---`;

    const result = await agent.generate([{ role: 'user', content: prompt }]);

    const cleaned = (result.text ?? '')
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    try {
      const parsed = RawExtractionSchema.parse(JSON.parse(cleaned));
      return { ...parsed, lang };
    } catch (err) {
      console.error('CV extraction parse failed. Raw output:\n', cleaned.slice(0, 500));
      throw new Error('AI response could not be parsed. Please try again.');
    }
  },
});

// ─── Step 3: match against existing vocabulary ──────────────────────────────

const matchToExistingStep = createStep({
  id: 'match-to-existing',
  description: 'Embeds extracted strings with Gemini, queries Pinecone, classifies each item',
  inputSchema: RawExtractionSchema.extend({ lang: LangSchema.optional() }),
  outputSchema: CvWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    const { skills, roles, methods, tasks, vallues, proposed_sps, sourceLang } = inputData;
    const lang: Lang = inputData.lang ?? 'he';

    // Normalize each item to { canonical, synonyms } — canonical is in the
    // user's locale; synonyms are the alt-lang labels Gemini supplied so the
    // UI can show them and so we can save them as sinanames on the vocab.
    const skillsN = skills.map((r) => normalizeItemFor(r, lang)).filter((x) => x.canonical);
    const rolesN = roles.map((r) => normalizeItemFor(r, lang)).filter((x) => x.canonical);
    const methodsN = methods.map((r) => normalizeItemFor(r, lang)).filter((x) => x.canonical);
    const tasksN = tasks.map((r) => normalizeItemFor(r, lang)).filter((x) => x.canonical);
    const valluesN = vallues.map((r) => normalizeItemFor(r, lang)).filter((x) => x.canonical);

    const synByCat: Record<string, Map<string, string[]>> = {
      skills: new Map(skillsN.map((x) => [x.canonical, x.synonyms])),
      roles: new Map(rolesN.map((x) => [x.canonical, x.synonyms])),
      methods: new Map(methodsN.map((x) => [x.canonical, x.synonyms])),
      missions: new Map(tasksN.map((x) => [x.canonical, x.synonyms])),
      vallues: new Map(valluesN.map((x) => [x.canonical, x.synonyms])),
    };

    const { matched, suggestions, newItems } = await matchAllCategories({
      skills: skillsN.map((x) => x.canonical),
      roles: rolesN.map((x) => x.canonical),
      methods: methodsN.map((x) => x.canonical),
      missions: tasksN.map((x) => x.canonical),
      vallues: valluesN.map((x) => x.canonical),
    });

    function attachSynonyms(group: typeof matched) {
      for (const cat of ['skills', 'roles', 'methods', 'missions', 'vallues'] as const) {
        for (const r of group[cat]) {
          const syn = synByCat[cat].get(r.input);
          if (syn && syn.length > 0) r.synonyms = syn;
        }
      }
      return group;
    }

    return {
      matched: attachSynonyms(matched),
      suggestions: attachSynonyms(suggestions),
      newItems: attachSynonyms(newItems),
      tasks: tasksN.map((x) => x.canonical),
      proposed_sps,
      sourceLang,
    };
  },
});

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const analyzeCvWorkflow = createWorkflow({
  id: 'analyze-cv',
  description:
    'CV or free text → Gemini extraction (output in caller locale, alt-lang synonyms preserved) → Pinecone match',
  inputSchema: z.object({
    fileBuffer: z.instanceof(ArrayBuffer).optional(),
    mimeType: z.string().optional(),
    fileName: z.string().optional(),
    rawText: z.string().optional(),
    lang: LangSchema.optional(),
  }),
  outputSchema: CvWorkflowOutputSchema,
})
  .then(extractTextStep)
  .then(analyzeWithGeminiStep)
  .then(matchToExistingStep)
  .commit();
