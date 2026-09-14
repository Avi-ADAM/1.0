import { describe, expect, it } from 'vitest';
import { createProjectTool } from './createProjectTool';
import { decodeProjectDraft } from '../../lib/prefill/projectDraft';

const execute = (input: Record<string, unknown>) => (createProjectTool as any).execute(input, {});

describe('createProjectTool', () => {
  // The reported case: entity-escaped Hebrew HTML + four values, handed to a
  // human through an agent that decoded the link once. `details` and `vals`
  // used to arrive empty with `success: true`.
  it('hands out a link that still carries every field after being decoded', async () => {
    const input = {
      name: 'מפת השפע',
      desc: 'אתר קהילתי שבו כל אחד מפרסם איפה יש כרגע מזון וחפצים בחינם',
      details: '&lt;h2&gt;מה זה&lt;/h2&gt;&lt;p&gt;אתר ל&#39;מזון&#39; בחינם, &amp; חפצים&lt;/p&gt;'.repeat(60),
      ont: true,
      profit: 'never',
      res: 'feh',
      vals: ['מניעת בזבוז מזון', 'ערבות הדדית וקהילה', 'קיימות וכלכלה מעגלית', 'שקיפות ונתונים פתוחים']
    };
    const out = await execute(input);

    expect(out.status).toBe('prepared');
    expect(out.url.startsWith('https://1lev1.com/me?action=createproject&draft=d1.')).toBe(true);
    expect(out.navigation.url.startsWith('/me?')).toBe(true);

    const draft = await decodeProjectDraft(new URL(decodeURIComponent(out.url)).searchParams.get('draft'));
    expect(draft?.vals).toEqual(input.vals);
    expect(draft?.details?.startsWith("<h2>מה זה</h2><p>אתר ל'מזון' בחינם, & חפצים</p>")).toBe(true);
    expect([draft?.name, draft?.res, draft?.profit, draft?.ont]).toEqual([input.name, 'feh', 'never', true]);
  });

  it('refuses a draft too long for a link instead of letting it fail silently', async () => {
    // Pseudo-random Hebrew letters barely compress (an LCG — a plain `i % 27`
    // pattern repeats and deflates to almost nothing).
    let seed = 42;
    const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
    const details = Array.from({ length: 20000 }, () => String.fromCharCode(0x5d0 + (next() % 27))).join('');
    const out = await execute({ name: 'x', details });
    expect(out.success).toBe(false);
    expect(out.status).toBe('tooLong');
    expect(out.url).toBeUndefined();
  });
});
