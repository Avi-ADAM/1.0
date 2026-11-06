/**
 * "Add to calendar" for a registration (docs/inprogress/PLAN_EVENTS_WEBINARS.md §5.2).
 *
 * The UID is the registration's, not the session's, and it never changes:
 * a calendar that receives the same UID again (a moved date, a cancellation
 * with METHOD:CANCEL) updates the entry instead of adding a second one.
 *
 * The location is the registrant's own `/e/<token>` page, never the raw
 * Zoom link — the page is what opens the room at the right time and knows
 * who walked in.
 */

export interface IcsInput {
  uid: string;
  title: string;
  description?: string | null;
  startsAt: string;
  durationMin: number;
  url: string;
  organizerName?: string | null;
  sequence?: number;
  cancel?: boolean;
  now?: Date;
}

/** 20261105T170000Z */
export function icsDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** RFC 5545 §3.3.11: backslash, semicolon and comma escaped; newlines as \n. */
export function icsText(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** RFC 5545 §3.1: lines longer than 75 octets are folded with CRLF + space. */
export function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    const limit = out.length === 0 ? 75 : 74;
    if (size + n > limit) {
      out.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join('\r\n ');
}

export function buildIcs(e: IcsInput): string {
  const start = Date.parse(e.startsAt);
  const end = start + e.durationMin * 60_000;
  const description = [e.description?.trim(), e.url].filter(Boolean).join('\n\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//1lev1//rikma events//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${e.cancel ? 'CANCEL' : 'PUBLISH'}`,
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `SEQUENCE:${e.sequence ?? 0}`,
    `DTSTAMP:${icsDate((e.now ?? new Date()).getTime())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(e.title)}`,
    `DESCRIPTION:${icsText(description)}`,
    `LOCATION:${icsText(e.url)}`,
    `URL:${e.url}`,
    ...(e.organizerName ? [`ORGANIZER;CN=${icsText(e.organizerName).replace(/:/g, '')}:mailto:notifications@1lev1.com`] : []),
    `STATUS:${e.cancel ? 'CANCELLED' : 'CONFIRMED'}`,
    ...(e.cancel
      ? []
      : ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(e.title)}`, 'TRIGGER:-PT15M', 'END:VALARM']),
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** Google Calendar's "add event" link. */
export function googleCalendarUrl(e: Pick<IcsInput, 'title' | 'description' | 'startsAt' | 'durationMin' | 'url'>): string {
  const start = Date.parse(e.startsAt);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${icsDate(start)}/${icsDate(start + e.durationMin * 60_000)}`,
    details: [e.description?.trim(), e.url].filter(Boolean).join('\n\n'),
    location: e.url
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Outlook on the web's "add event" link. */
export function outlookCalendarUrl(e: Pick<IcsInput, 'title' | 'description' | 'startsAt' | 'durationMin' | 'url'>): string {
  const start = Date.parse(e.startsAt);
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: e.title,
    startdt: new Date(start).toISOString(),
    enddt: new Date(start + e.durationMin * 60_000).toISOString(),
    body: [e.description?.trim(), e.url].filter(Boolean).join('\n\n'),
    location: e.url
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}
