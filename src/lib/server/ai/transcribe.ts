/**
 * transcribe — speech to text for the composer's microphone, when the
 * browser's own Web Speech API is missing (Firefox) or blocked (Brave,
 * Electron shells, some managed Chrome installs).
 *
 * Groq's hosted Whisper first — free tier, about a second per clip — and
 * Gemini with the audio inline as the fallback. Both keys are optional; with
 * neither configured the caller gets '' and says so.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Largest clip we accept, in bytes (~a minute of opus at browser defaults). */
export const TRANSCRIBE_MAX_BYTES = 5 * 1024 * 1024;

const LANG_NAMES: Record<string, string> = {
  he: 'Hebrew',
  en: 'English',
  ar: 'Arabic',
  ru: 'Russian',
  es: 'Spanish'
};

async function viaGroq(audio: Blob, lang: string, key: string): Promise<string> {
  const form = new FormData();
  // Whisper goes by the extension: Chrome records webm, Safari mp4.
  const ext = /mp4|m4a|aac/.test(audio.type)
    ? 'm4a'
    : /ogg/.test(audio.type)
      ? 'ogg'
      : /wav/.test(audio.type)
        ? 'wav'
        : 'webm';
  form.append('file', audio, `speech.${ext}`);
  form.append('model', 'whisper-large-v3-turbo');
  form.append('response_format', 'json');
  if (LANG_NAMES[lang]) form.append('language', lang);
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form
  });
  if (!res.ok) throw new Error(`groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return typeof data?.text === 'string' ? data.text.trim() : '';
}

async function viaGemini(audio: Blob, lang: string, key: string): Promise<string> {
  const b64 = Buffer.from(await audio.arrayBuffer()).toString('base64');
  const language = LANG_NAMES[lang] ?? 'the spoken language';
  const res = await fetch(
    `${GEMINI_URL}/gemini-flash-lite-latest:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  `Transcribe this recording verbatim in ${language}. ` +
                  'Return only the transcript - no commentary. If nothing is said, return nothing.'
              },
              { inline_data: { mime_type: audio.type || 'audio/webm', data: b64 } }
            ]
          }
        ],
        generationConfig: { temperature: 0 }
      })
    }
  );
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p: { text?: string }) => p?.text ?? '')
    .join('')
    .trim();
}

export async function transcribe(
  audio: Blob,
  lang: string,
  keys: { groq?: string; gemini?: string }
): Promise<string> {
  if (keys.groq) {
    try {
      return await viaGroq(audio, lang, keys.groq);
    } catch (err) {
      console.warn('[transcribe] Groq failed, trying Gemini…', err);
    }
  }
  if (keys.gemini) return viaGemini(audio, lang, keys.gemini);
  return '';
}
