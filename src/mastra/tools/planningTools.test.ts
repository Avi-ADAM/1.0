import { describe, expect, it } from 'vitest';
import {
  buildBoardReviewUrl,
  planProjectWorkTool,
  scanProjectDirectionsTool
} from './planningTools';

describe('buildBoardReviewUrl', () => {
  it('points at the project create page, where the boards live', () => {
    expect(buildBoardReviewUrl('42')).toBe('/moach/42/create');
  });

  it('deep-links to a specific board so the user lands on the draft', () => {
    expect(buildBoardReviewUrl('42', '7')).toBe('/moach/42/create?board=7');
  });

  it('treats a missing board id as "no deep link"', () => {
    expect(buildBoardReviewUrl('42', null)).toBe('/moach/42/create');
    expect(buildBoardReviewUrl('42', undefined)).toBe('/moach/42/create');
  });

  it('encodes ids so a stray value cannot break out of the query string', () => {
    expect(buildBoardReviewUrl('42', 'a&b=c')).toBe('/moach/42/create?board=a%26b%3Dc');
  });
});

describe('planning tool contracts', () => {
  const tools = [planProjectWorkTool, scanProjectDirectionsTool];

  it('both require a projectId', () => {
    for (const tool of tools) {
      const shape = (tool.inputSchema as any).shape;
      expect(shape.projectId, tool.id).toBeDefined();
      expect(shape.projectId.isOptional?.(), tool.id).toBeFalsy();
    }
  });

  it('describe themselves as drafting proposals, not creating entities', () => {
    for (const tool of tools) {
      expect(tool.description, tool.id).toMatch(/nothing is created|never create|approve/i);
    }
  });

  it('fail closed without an authenticated context', async () => {
    for (const tool of tools) {
      const res: any = await (tool as any).execute({ projectId: '42', text: 'x'.repeat(30) });
      expect(res.success, tool.id).toBe(false);
      expect(res.message, tool.id).toMatch(/context|auth/i);
      // Nothing leaks out when unauthenticated.
      expect(res.boardId, tool.id).toBeUndefined();
      expect(res.reviewUrl, tool.id).toBeUndefined();
    }
  });
});
