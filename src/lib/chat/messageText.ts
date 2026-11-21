/**
 * A chat message as the reader sees it: plain text, with http(s) links made
 * clickable. Never HTML.
 *
 * Every writer of `Message.content` stores plain text (members typing, agents
 * via the MCP, the server's own seed lines), so nothing is lost by refusing
 * markup — and a message is written by one member and read by the others, so
 * markup in it would be one member's code running in another's browser.
 *
 * The only markup we soften is a literal `<br>`: older rows may hold one, and
 * the reader should see a line break, not the tag. It becomes `\n`, which the
 * bubble keeps through `whitespace-pre-line`.
 */

export type MessagePart = { kind: 'text'; text: string } | { kind: 'link'; text: string; href: string };

const BR = /<br\s*\/?>/gi;
// A link starts at http(s):// and runs to the next whitespace or angle bracket.
const URL_RE = /https?:\/\/[^\s<>"']+/gi;
// Punctuation that usually closes the sentence, not the URL.
const TRAILING = /[.,;:!?)\]}'"»”’]+$/;

/** The message's text, with `<br>` turned into a newline. */
export function messageText(message: unknown): string {
  if (message == null) return '';
  return String(message).replace(BR, '\n');
}

/** Split a message into text runs and http(s) links, in order. */
export function messageParts(message: unknown): MessagePart[] {
  const text = messageText(message);
  const parts: MessagePart[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    let url = m[0];
    const tail = url.match(TRAILING)?.[0] ?? '';
    // Keep a closing paren that matches one inside the URL (wiki links).
    if (tail && !(tail.startsWith(')') && url.includes('('))) url = url.slice(0, -tail.length);
    const start = m.index ?? 0;
    if (start > last) parts.push({ kind: 'text', text: text.slice(last, start) });
    parts.push({ kind: 'link', text: url, href: url });
    last = start + url.length;
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
  return parts;
}
