import { describe, expect, it } from 'vitest';
import {
  buildBoardReviewUrl,
  createPlanBoardTool,
  describeActionFailure,
  planProjectWorkTool,
  scanProjectDirectionsTool,
  toRowOutput
} from './planningTools';

describe('describeActionFailure', () => {
  const strapi = (extensions: Record<string, unknown>, message = 'x') => ({
    code: 'STRAPI_ERROR',
    message: 'Database operation failed',
    details: [{ message, extensions }]
  });

  it('names a Strapi permission denial as a server problem that retrying cannot fix', () => {
    const f = describeActionFailure(strapi({ code: 'FORBIDDEN' }, 'Forbidden access'), 'r1');
    expect(f).toMatchObject({ code: 'SERVER_PERMISSION_DENIED', retryable: false, requestId: 'r1' });
    expect(f.hint).toMatch(/not your input/);
  });

  it('treats an HTTP 403 from Strapi the same way', () => {
    expect(describeActionFailure(strapi({ code: 'HTTP_ERROR', status: 403 }), 'r').code).toBe(
      'SERVER_PERMISSION_DENIED'
    );
  });

  it('marks network and 5xx failures retryable', () => {
    expect(describeActionFailure(strapi({ code: 'NETWORK_ERROR' }), 'r').retryable).toBe(true);
    expect(describeActionFailure(strapi({ code: 'HTTP_ERROR', status: 502 }), 'r').retryable).toBe(true);
  });

  it('keeps any other Strapi rejection non-retryable', () => {
    expect(describeActionFailure(strapi({ code: 'BAD_USER_INPUT' }), 'r')).toMatchObject({
      code: 'PLAN_SAVE_FAILED',
      retryable: false
    });
  });

  it('passes the membership reason through', () => {
    const f = describeActionFailure({ code: 'UNAUTHORIZED', message: 'You must be a member of this project to plan it' }, 'r');
    expect(f.code).toBe('NOT_ALLOWED');
    expect(f.hint).toMatch(/member of this project/);
  });

  it('never throws on a missing error', () => {
    expect(describeActionFailure(undefined, 'r')).toMatchObject({ code: 'INTERNAL_ERROR', retryable: false });
  });
});

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

describe('toRowOutput', () => {
  it('names the kind `type` and exposes a duplicate as alreadyExists', () => {
    const out = toRowOutput({
      id: 12,
      kind: 'mission',
      name: 'Logo',
      descrip: '<p>x</p>',
      imp: 'must',
      rationale: 'r',
      existingRef: { type: 'openMission', id: 5, name: 'Design logo', similarity: 0.9 }
    });
    expect(out).toEqual({
      id: '12',
      type: 'mission',
      name: 'Logo',
      descrip: '<p>x</p>',
      imp: 'must',
      rationale: 'r',
      alreadyExists: { type: 'openMission', id: '5', name: 'Design logo' }
    });
  });

  it('tolerates a row with nothing saved', () => {
    expect(toRowOutput({ kind: 'note', name: 'n' })).toMatchObject({ id: null, imp: 'nice', alreadyExists: null });
  });
});

describe('createPlanBoardTool', () => {
  it('insists on a description for every row, in its schema', () => {
    const row = (createPlanBoardTool.inputSchema as any).shape.items.element.shape;
    expect(row.descrip.isOptional?.()).toBeFalsy();
    expect(row.name.isOptional?.()).toBeFalsy();
  });
});

describe('planning tool contracts', () => {
  const tools = [planProjectWorkTool, createPlanBoardTool, scanProjectDirectionsTool];

  it('all require a projectId', () => {
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
      // Valid for every tool's schema, so the call reaches the auth check
      // instead of being stopped by input validation.
      const res: any = await (tool as any).execute({
        projectId: '42',
        text: 'x'.repeat(30),
        title: 'Board',
        items: [{ type: 'mission', name: 'n', descrip: 'd' }]
      });
      expect(res.success, tool.id).toBe(false);
      expect(res.message, tool.id).toMatch(/context|auth/i);
      // Nothing leaks out when unauthenticated.
      expect(res.boardId, tool.id).toBeUndefined();
      expect(res.reviewUrl, tool.id).toBeUndefined();
    }
  });
});
