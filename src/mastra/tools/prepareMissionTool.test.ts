import { describe, expect, it } from 'vitest';
import { prepareMissionTool } from './prepareMissionTool';
import { decodeMissionDraft } from '../../lib/prefill/missionDraft';

const execute = (input: Record<string, unknown>) => (prepareMissionTool as any).execute(input, {});

describe('prepareMissionTool', () => {
  it('hands out an absolute link whose draft survives being decoded', async () => {
    const input = {
      projectId: '57',
      name: 'בניית מפת נקודות חלוקה',
      descrip: '&lt;p&gt;מפה עם נקודות ל&#39;מזון&#39; &amp; חפצים&lt;/p&gt;'.repeat(40),
      skills: ['Svelte', 'מפות, GIS'],
      roles: ['מפתח/ת'],
      workways: ['מרחוק'],
      nhours: 40,
      valph: 120
    };
    const out = await execute(input);

    expect(out.status).toBe('prepared');
    expect(out.url.startsWith('https://1lev1.com/moach/57/create?action=createmission&draft=d1.')).toBe(true);
    expect(out.navigation.url.startsWith('/moach/57/create?')).toBe(true);

    const draft = await decodeMissionDraft(new URL(decodeURIComponent(out.url)).searchParams.get('draft'));
    expect(draft?.descrip?.startsWith("<p>מפה עם נקודות ל'מזון' & חפצים</p>")).toBe(true);
    expect(draft?.skills).toEqual(input.skills);
    expect([draft?.name, draft?.roles, draft?.workways, draft?.nhours, draft?.valph]).toEqual([
      input.name,
      input.roles,
      input.workways,
      40,
      120
    ]);
    // The project id is the path, not part of the draft.
    expect(draft).not.toHaveProperty('projectId');
  });

  it('refuses a draft too long for a link', async () => {
    let seed = 7;
    const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
    const descrip = Array.from({ length: 20000 }, () => String.fromCharCode(0x5d0 + (next() % 27))).join('');
    const out = await execute({ projectId: '1', name: 'x', descrip });
    expect([out.success, out.status, out.url]).toEqual([false, 'tooLong', undefined]);
  });
});
