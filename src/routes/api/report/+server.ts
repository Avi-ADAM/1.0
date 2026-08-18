/**
 * /api/report — Save user reports (bugs, features, contact) to Strapi and notify admin via Telegram.
 *
 * Strapi content type required: "site-report"
 * Collection API endpoint: /api/site-reports
 * Fields:
 *   - type:        Enumeration ['bug', 'feature', 'partnership', 'contact']  (required)
 *   - description: Long text  (required)
 *   - page:        Short text (URL the user was on)
 *   - userId:      Short text (Strapi user ID, null for guests)
 *   - userName:    Short text
 *   - userEmail:   Email
 *   - lang:        Short text
 *   - status:      Enumeration ['new', 'in_review', 'resolved']  default 'new'
 */
import { TELEGRAM_BOT_TOKEN_NEW, NEW_TELEGRAM, ADMINMONTHER } from '$env/static/private';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mirrorSiteReport } from '$lib/server/siteReportMirror.js';

const TYPE_LABELS: Record<string, { emoji: string; he: string; en: string }> = {
  bug:         { emoji: '🐛', he: 'תקלה',     en: 'Bug Report' },
  feature:     { emoji: '✨', he: 'פיצ\'ר',    en: 'Feature Request' },
  partnership: { emoji: '🤝', he: 'שותפות',   en: 'Partnership' },
  contact:     { emoji: '📬', he: 'פנייה לצוות', en: 'Contact Team' },
};

// The raw env value can carry whitespace and a `ADMINMONTHER=` prefix. The
// Strapi REST call below has always passed it through untouched, so that stays
// as it is; the action system needs the clean token, same as /api/v1/*.
const ADMIN_TOKEN = ADMINMONTHER.replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');

/** Subject line of the confirmation, in the reporter's own language. */
const CONFIRM_SUBJECT: Record<string, string> = {
  he: 'קיבלנו את הפנייה שלך — 1💗1',
  en: 'We got your report — 1💗1',
  ar: 'لقد استلمنا بلاغك — 1💗1',
  ru: 'Мы получили ваше обращение — 1💗1',
  es: 'Hemos recibido tu reporte — 1💗1',
};

/**
 * Close the loop with the person who wrote to us, when they chose to leave an
 * address. Best-effort: a bounced confirmation must not fail a report that was
 * already saved.
 */
async function sendConfirmation(
  args: {
    type: string;
    description: string;
    userName?: string | null;
    userEmail: string;
    userId?: string | null;
    lang: string;
  },
  fetchFn: typeof globalThis.fetch,
  origin: string,
) {
  try {
    const { render } = await import('svelty-email');
    const { default: SiteReportReceived } = await import(
      '$lib/components/mail/siteReportReceived.svelte'
    );

    const isGuest = !args.userId;
    const lang = ['he', 'en', 'ar', 'ru', 'es'].includes(args.lang) ? args.lang : 'he';

    // svelty-email 0.1.1 exports `render(component, props)`. Some older call
    // sites in this repo pass `{ template, props }`, which silently renders a
    // component with every prop undefined — do not copy them.
    const emailHtml = await render(SiteReportReceived, {
      type: args.type,
      description: args.description,
      username: args.userName ?? '',
      isGuest,
      // A guest has nowhere to "go back" to yet, so the button invites them in.
      link: isGuest ? `${origin}/signup` : `${origin}/lev`,
      previewText: CONFIRM_SUBJECT[lang],
      lang,
    });

    const res = await fetchFn('/api/sendMail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: args.userEmail,
        emailHtml,
        previewText: CONFIRM_SUBJECT[lang],
      }),
    });
    if (!res.ok) console.warn('⚠️ Report confirmation mail failed:', res.status);
  } catch (e) {
    console.error('❌ Report confirmation mail error:', e);
  }
}

// `fetch` is deliberately NOT destructured from the event: hooks.server.js
// stamps the x-strapi-gate secret by patching the GLOBAL fetch, and the Strapi
// save below has always relied on that. The event-scoped fetch is bound
// separately, for the relative /api/sendMail call and for the action system.
export const POST: RequestHandler = async ({ request, fetch: eventFetch, url }) => {
  const { type, description, page, userId, userName, userEmail, lang } = await request.json();

  if (!description?.trim()) {
    return json({ success: false, error: 'description required' }, { status: 400 });
  }

  const label = TYPE_LABELS[type] ?? { emoji: '📋', he: type, en: type };

  // ── 1. Save to Strapi REST API ────────────────────────────────────────────
  let strapiId: number | null = null;
  try {
    const res = await fetch(`${STRAPI_URL}/api/site-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADMINMONTHER}`,
      },
      body: JSON.stringify({
        data: {
          type,
          description,
          page: page || null,
          userId: userId ?? null,
          userName: userName ?? null,
          userEmail: userEmail ?? null,
          lang: lang || 'he',
          status: 'new',
        },
      }),
    });
    if (res.ok) {
      const body = await res.json();
      strapiId = body?.data?.id ?? null;
      console.log('✅ Report saved to Strapi, id:', strapiId);
    } else {
      const err = await res.text();
      console.warn('⚠️ Strapi save failed:', res.status, err.slice(0, 200));
    }
  } catch (e) {
    console.error('❌ Strapi report error:', e);
  }

  // ── 1b. Mirror into the central rikma + confirm to the reporter ───────────
  // A person who finds a bug is doing the platform a favour; the least it owes
  // them is that the report becomes somebody's actual, consented work rather
  // than a row in a table.
  //
  // Started here so they overlap with the Telegram send below, and awaited
  // before the response: one of the build targets is adapter-vercel, which
  // freezes the function the moment the response is returned — un-awaited work
  // there is silently dropped.
  const sideErrands: Promise<unknown>[] = [];

  if (strapiId != null) {
    sideErrands.push(
      mirrorSiteReport({
        report: { type, description, page, userId, userName, userEmail, lang },
        reportId: strapiId,
        adminToken: ADMIN_TOKEN,
        fetch: eventFetch,
        origin: url.origin,
      }),
    );
  }

  if (userEmail?.trim()) {
    sideErrands.push(
      sendConfirmation(
        {
          type,
          description,
          userName,
          userEmail: userEmail.trim(),
          userId,
          lang: lang || 'he',
        },
        eventFetch,
        url.origin,
      ),
    );
  }

  // ── 2. Telegram notification ──────────────────────────────────────────────
  try {
    const guestLabel = lang === 'he' ? 'אורח' : lang === 'ar' ? 'ضيف' : 'Guest';
    const userLine = userId
      ? `👤 ${userName || userId}`
      : `👤 ${guestLabel}${userName ? ` · ${userName}` : ''}`;

    const strapiLine = strapiId ? `\n🗄 Strapi #${strapiId}` : '';

    const msgParts = [
      `${label.emoji} *${lang === 'he' ? label.he : label.en}* — 1💗1 Bot`,
      '',
      userLine,
      userEmail ? `📧 ${userEmail}` : null,
      `📍 ${page || '—'}`,
      `🌐 ${lang}`,
      strapiLine,
      '',
      `*${lang === 'he' ? 'תיאור' : 'Description'}:*`,
      description,
    ].filter((l) => l !== null).join('\n');

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_NEW}/sendMessage`;
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: NEW_TELEGRAM,
        text: msgParts,
        parse_mode: 'Markdown',
      }),
    });
    console.log('📨 Telegram notification sent for report type:', type);
  } catch (e) {
    console.error('❌ Telegram notification error:', e);
  }

  // allSettled, never all: the report is already saved, so a busy rikma or a
  // refusing mail server must not turn a successful report into an error for
  // the person who took the trouble to send it.
  await Promise.allSettled(sideErrands);

  return json({ success: true, strapiId });
};
