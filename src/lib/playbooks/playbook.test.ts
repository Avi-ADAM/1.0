import { describe, expect, it } from 'vitest';
import {
  bodyProblem,
  cleanBody,
  excerptOf,
  pickPlaybooks,
  playbookOf,
  playbookOutline,
  proposalOf,
  sameSlot,
  PLAYBOOK_MAX
} from './playbook';

const docNode = (id: number, over: Record<string, unknown> = {}) => ({
  id,
  attributes: {
    kind: 'playbook',
    name: 'Sales',
    body: 'net+30 for businesses',
    archived: false,
    updatedAt: '2026-11-20',
    project: { data: { id: 103 } },
    tafkidim: { data: { id: 5, attributes: { roleDescription: 'Sales' } } },
    uploadedBy: { data: { id: 271, attributes: { username: 'maya' } } },
    ...over
  }
});

describe('playbookOf', () => {
  it('reads a playbook row', () => {
    expect(playbookOf(docNode(9))).toEqual({
      docId: '9', projectId: '103', roleId: '5', roleName: 'Sales', title: 'Sales',
      body: 'net+30 for businesses', updatedAt: '2026-11-20', by: 'maya'
    });
  });
  it('drops other kinds and archived rows', () => {
    expect(playbookOf(docNode(9, { kind: 'file' }))).toBeNull();
    expect(playbookOf(docNode(9, { archived: true }))).toBeNull();
  });
});

describe('pickPlaybooks', () => {
  const a = playbookOf(docNode(1, { tafkidim: { data: null }, updatedAt: '2026-11-01' }))!;
  const b = playbookOf(docNode(2, { tafkidim: { data: null }, updatedAt: '2026-11-10' }))!;
  const r = playbookOf(docNode(3))!;
  it('newest rikma-wide, and the role one', () => {
    expect(pickPlaybooks([a, b, r], '5')).toEqual({ general: b, role: r });
    expect(pickPlaybooks([a, r], null)).toEqual({ general: a, role: null });
  });
});

describe('proposalOf / sameSlot', () => {
  const node = {
    id: 40,
    attributes: {
      decisionName: 'Sales', newPlaybook: 'new', createdAt: 'c',
      playbookDoc: { data: { id: 9 } },
      playbookRole: { data: null },
      timegrama: { data: { id: 77, attributes: { date: '2026-11-25', done: false } } },
      vots: [{ what: true, users_permissions_user: { data: { id: 271 } } }]
    }
  };
  it('reads the proposer, the clock and the slot', () => {
    expect(proposalOf(node)).toMatchObject({ decisionId: '40', docId: '9', roleId: null, deadline: '2026-11-25', timegramaId: '77', proposerId: '271', yes: ['271'] });
  });
  it('same doc, or same role when neither has a doc', () => {
    const p = proposalOf(node)!;
    expect(sameSlot(p, { docId: '9', roleId: null })).toBe(true);
    expect(sameSlot(p, { docId: '8', roleId: null })).toBe(false);
    expect(sameSlot({ ...p, docId: null }, { docId: null, roleId: null })).toBe(true);
    expect(sameSlot({ ...p, docId: null, roleId: '5' }, { docId: null, roleId: null })).toBe(false);
  });
});

describe('body', () => {
  it('cleans and bounds', () => {
    expect(cleanBody('  a\r\nb\n\n\n\n\nc  ')).toBe('a\nb\n\n\nc');
    expect(bodyProblem('')).toBe('empty');
    expect(bodyProblem('x'.repeat(PLAYBOOK_MAX + 1))).toBe('tooLong');
    expect(bodyProblem('ok')).toBeNull();
  });
  it('excerpt keeps text under memberWritten', () => {
    const p = playbookOf(docNode(1))!;
    expect(excerptOf(p)).toMatchObject({ docId: '1', truncated: false, memberWritten: { body: 'net+30 for businesses' } });
    expect(excerptOf(null)).toBeNull();
  });
});

describe('playbookOutline', () => {
  it('rikma-wide outline carries the clock and values', () => {
    const o = playbookOutline({ restimeLabel: '48 hours', values: ['care'] });
    expect(o.map((s) => s.heading)).toContain('How decisions are made here');
    expect(JSON.stringify(o)).toContain('48 hours');
    expect(JSON.stringify(o)).toContain('care');
  });
  it('role outline names the role and the products', () => {
    const o = playbookOutline({ roleName: 'Sales', products: [{ name: 'course', price: 100 }] });
    expect(o[0].heading).toBe('How Sales works here');
    expect(JSON.stringify(o)).toContain('course: 100');
  });
});
