import { describe, it, expect } from 'vitest';
import { missionOf, orderFactsOf, stepOf, whenOf, workItemOf } from './rows';

const rel = (id: string | number | null, attributes: Record<string, unknown> = {}) => ({ data: id == null ? null : { id, attributes } });
const rels = (...ids: (string | number)[]) => ({ data: ids.map((id) => ({ id })) });

describe('stepOf', () => {
  it('reads a step row into the planner shape', () => {
    const s = stepOf({
      id: 4,
      attributes: {
        name: ' משלוח ',
        position: 2,
        target: 'mission',
        per: 'order',
        scope: 'rikma',
        when: { event: 'order.paid', deliveryPreference: ['delivery', 'nonsense'] },
        dueHours: 24,
        effect: 'markShipped',
        consentState: 'active',
        mesimabetahalich: rel(10, { name: 'שליחויות' }),
        tafkidim: rel(null),
        member: rel(null),
        proposedBy: rel(3, { username: 'dana' }),
        consentedBy: rels(7, 3),
        matanots: rels(),
        product_variants: rels()
      }
    })!;
    expect(s).toMatchObject({
      id: '4',
      name: 'משלוח',
      target: 'mission',
      missionId: '10',
      missionName: 'שליחויות',
      roleId: null,
      when: { event: 'order.paid', deliveryPreference: ['delivery'] },
      consentedBy: ['7', '3'],
      proposedById: '3'
    });
  });

  it('falls back safely on unknown enums and missing relations', () => {
    const s = stepOf({ id: 1, attributes: { target: 'x', effect: 'y', consentState: 'z' } })!;
    expect(s.target).toBe('member');
    expect(s.effect).toBe('none');
    expect(s.consentState).toBe('proposed');
    expect(s.consentedBy).toEqual([]);
  });

  it('whenOf always answers order.paid', () => {
    expect(whenOf(null)).toEqual({ event: 'order.paid' });
  });
});

describe('missionOf', () => {
  it('treats finished, archived and released as closed; null lifecycle as active', () => {
    const base = { name: 'm', users_permissions_user: rel(7, { username: 'u' }), tafkidims: rels(3) };
    expect(missionOf({ id: 1, attributes: { ...base, lifecycle: null } })!.closed).toBe(false);
    expect(missionOf({ id: 1, attributes: { ...base, finnished: true } })!.closed).toBe(true);
    expect(missionOf({ id: 1, attributes: { ...base, lifecycle: 'released' } })!.closed).toBe(true);
    expect(missionOf({ id: 1, attributes: base })!.roleIds).toEqual(['3']);
  });
});

describe('orderFactsOf', () => {
  it('flattens the address and sorts the lines', () => {
    const o = orderFactsOf(
      {
        id: 9,
        attributes: {
          ref: '5:x',
          status: 'paid',
          deliveryPreference: 'delivery',
          deliveryAddress: { street: 'הרצל 1', city: 'נתניה' },
          lines: {
            data: [
              { id: 2, attributes: { position: 1, quantity: 1, nameSnapshot: 'ב', matanot: rel(5) } },
              { id: 1, attributes: { position: 0, quantity: 2, nameSnapshot: 'א', matanot: rel(4), variant: rel(8) } }
            ]
          }
        }
      },
      '#9'
    )!;
    expect(o.address).toBe('הרצל 1, נתניה');
    expect(o.lines.map((l) => l.name)).toEqual(['א', 'ב']);
    expect(o.lines[0]).toMatchObject({ productId: '4', variantId: '8', quantity: 2 });
  });
});

describe('workItemOf', () => {
  it('reads the order beside the act, and whether it is mine', () => {
    const w = workItemOf(
      {
        id: 50,
        attributes: {
          shem: 'משלוח · #9',
          des: '2 × א\n1 × ב',
          dateF: '2026-10-20T08:00:00.000Z',
          project: rel(5),
          my: rels(7),
          tafkidims: { data: [] },
          mesimabetahaliches: { data: [{ id: 10, attributes: { name: 'שליחויות' } }] },
          order: rel(9, { ref: '5:x', displayNumber: 'K7Q4XM', status: 'paid', deliveryPreference: 'delivery', buyerName: 'דנה', buyerPhone: '0501234567', deliveryAddress: { city: 'נתניה' } }),
          fulfillment_step: rel(4, { name: 'משלוח', effect: 'markShipped' })
        }
      },
      '7',
      (d) => String(d)
    )!;
    expect(w).toMatchObject({
      actId: '50',
      projectId: '5',
      mine: true,
      orderId: '9',
      orderNumber: 'K7Q4XM',
      effect: 'markShipped',
      missionName: 'שליחויות',
      address: 'נתניה',
      items: ['2 × א', '1 × ב']
    });
    expect(workItemOf({ id: 50, attributes: { my: rels(8) } }, '7', () => '')!.mine).toBe(false);
  });
});

describe('A2 rows', () => {
  it('whenOf keeps the A2 conditions and drops what is malformed', () => {
    expect(
      whenOf({
        event: 'order.paid',
        after: ['3', 3, 'x', '3'],
        shippingMethods: ['m:north:courier', 'p:shop', 'm:bad id:x'],
        pickupPoints: ['shopA', 'bad id'],
        categories: [12, '13', 'c'],
        resources: ['40']
      })
    ).toEqual({
      event: 'order.paid',
      after: ['3'],
      shippingMethods: ['m:north:courier'],
      pickupPoints: ['shopA'],
      categories: ['12', '13']
    });
    expect(whenOf({ event: 'stock.low', resources: ['40', 'x'], after: ['3'] })).toEqual({ event: 'stock.low', resources: ['40'] });
    expect(whenOf({ event: 'nope' })).toEqual({ event: 'order.paid' });
  });

  it('stepOf reads routing, batching and the wave hour', () => {
    const s = stepOf({ id: 1, attributes: { routing: 'roundRobin', batching: 'wave', waveAt: '16:00' } })!;
    expect(s).toMatchObject({ routing: 'roundRobin', batching: 'wave', waveAt: '16:00' });
    const d = stepOf({ id: 1, attributes: { routing: 'x', waveAt: '24:61' } })!;
    expect(d).toMatchObject({ routing: 'single', batching: 'perOrder', waveAt: null });
  });

  it('workItemOf tells a stock act from an order act, and an act open to everyone', () => {
    const w = workItemOf(
      { id: 60, attributes: { shem: 'רכש · צנצנות', externalId: 'stock:40:low:100:step:9', my: rels(), tafkidims: { data: [] }, fulfillment_step: rel(9, { name: 'רכש', batching: 'perOrder' }) } },
      '7',
      () => ''
    )!;
    expect(w).toMatchObject({ kind: 'stock', resourceId: '40', stepId: '9', mine: false, openToAll: true, orderId: null });
    const o = workItemOf({ id: 61, attributes: { externalId: 'order:5:x:step:4', my: rels(7), fulfillment_step: rel(4, { batching: 'wave', per: 'unit' }) } }, '7', () => '')!;
    expect(o).toMatchObject({ kind: 'order', batching: 'wave', per: 'unit', openToAll: false, stepId: '4' });
  });

  it('orderFactsOf reads line categories when they were asked for', () => {
    const o = orderFactsOf(
      {
        id: 1,
        attributes: {
          ref: 'r',
          status: 'paid',
          lines: { data: [{ id: 2, attributes: { position: 0, quantity: 1, matanot: rel(4, { categories: rels(12, 13) }) } }] }
        }
      },
      '#1'
    )!;
    expect(o.lines[0].categoryIds).toEqual(['12', '13']);
  });
});
