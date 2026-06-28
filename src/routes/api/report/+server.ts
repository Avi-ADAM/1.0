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
import { TELEGRAM_BOT_TOKEN_NEW, NEW_TELEGRAM, STRAPI_URL, ADMINMONTHER } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const TYPE_LABELS: Record<string, { emoji: string; he: string; en: string }> = {
  bug:         { emoji: '🐛', he: 'תקלה',     en: 'Bug Report' },
  feature:     { emoji: '✨', he: 'פיצ\'ר',    en: 'Feature Request' },
  partnership: { emoji: '🤝', he: 'שותפות',   en: 'Partnership' },
  contact:     { emoji: '📬', he: 'פנייה לצוות', en: 'Contact Team' },
};

export const POST: RequestHandler = async ({ request }) => {
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

  return json({ success: true, strapiId });
};
