import { describe, it, expect } from 'vitest';
import {
  addressLine,
  addressOf,
  bannerOf,
  csvCell,
  defaultOrderFilter,
  filterOrders,
  filterSales,
  filterStock,
  handleOf,
  itemCountOf,
  matchesOrder,
  mayCancel,
  mayConfirmPayment,
  whatsappHref,
  whatsappNumberOf,
  nextStock,
  orderCounts,
  orderTaskOf,
  primaryActionOf,
  priceRangeOfRow,
  salesInSplit,
  salesSummary,
  shopifyCsvRows,
  shortUnitsOf,
  sortOrders,
  splitStateOf,
  stockRowsOf,
  stockStateOf,
  stockTotalOfRow,
  stockWouldChange,
  toCsv,
  type ShopOrder,
  type ShopProductRow,
  type ShopSaleRow
} from './manage';

function order(over: Partial<ShopOrder> = {}): ShopOrder {
  return {
    id: '1',
    ref: '57:pi_1',
    number: '1042',
    status: 'paid',
    oversold: false,
    total: 660,
    currency: 'ILS',
    source: 'api',
    paidAt: '2026-10-18T09:00:00Z',
    shippedAt: null,
    fulfilledAt: null,
    expiresAt: null,
    createdAt: '2026-10-18T09:00:00Z',
    buyer: { name: 'דנה כהן', email: 'dana@example.com', phone: '050-123 4567' },
    delivery: { preference: 'delivery', address: { city: 'נתניה', street: 'הרצל 1', zip: null, notes: null } },
    note: null,
    paymentRef: 'pi_1',
    paymentMethod: 'card',
    holderId: '7',
    holderName: 'נועה',
    lines: [
      { productId: '10', variantId: '77', name: 'שרפרף', optionLabel: 'M', sku: 'STL-M', imageUrl: null, quantity: 2, unitPrice: 310, lineTotal: 620 }
    ],
    sales: [],
    shortUnits: 0,
    fulfillmentPending: false,
    ...over
  };
}

describe('the order task — what is left to do', () => {
  it('a paid parcel is to ship; pickup, digital and contact are to hand over', () => {
    expect(orderTaskOf(order())).toBe('toShip');
    for (const preference of ['pickup', 'digital', 'contact'] as const) {
      expect(orderTaskOf(order({ delivery: { preference, address: null } }))).toBe('toHandOver');
    }
    expect(orderTaskOf(order({ status: 'shipped' }))).toBe('shipped');
    expect(orderTaskOf(order({ status: 'fulfilled' }))).toBe('done');
    expect(orderTaskOf(order({ status: 'cancelled' }))).toBe('cancelled');
  });

  it('one primary action by delivery kind, none when finished', () => {
    expect(primaryActionOf(order())).toMatchObject({ action: 'markOrderShipped', label: 'markShipped', next: 'shipped' });
    expect(primaryActionOf(order({ status: 'shipped' }))).toMatchObject({ action: 'markOrderFulfilled', label: 'markDelivered' });
    expect(primaryActionOf(order({ delivery: { preference: 'pickup', address: null } }))).toMatchObject({ label: 'markPickedUp', next: 'fulfilled' });
    expect(primaryActionOf(order({ delivery: { preference: 'digital', address: null } }))).toMatchObject({ label: 'markDelivered' });
    expect(primaryActionOf(order({ status: 'fulfilled' }))).toBeNull();
    expect(primaryActionOf(order({ status: 'cancelled' }))).toBeNull();
  });

  it('items count units, and lines when a quantity is not whole', () => {
    expect(itemCountOf([{ quantity: 2 }, { quantity: 1 }])).toBe(3);
    expect(itemCountOf([{ quantity: 1.5 }, { quantity: 1 }])).toBe(2);
  });
});

describe('short on stock — measured against the stock now', () => {
  const short = order({ oversold: true });
  it('counts the units below zero — a count of -1 is one unit short', () => {
    expect(shortUnitsOf(short, new Map([['v:77', -3]]))).toBe(2); // capped by the line
    expect(shortUnitsOf(short, new Map([['v:77', -2]]))).toBe(2);
    // The 0 − 1 case: one unit oversold is one unit short, never "unlimited" (§2.5).
    expect(shortUnitsOf(short, new Map([['v:77', -1]]))).toBe(1);
    // An unlimited row is not in the map at all: never short.
    expect(shortUnitsOf(short, new Map())).toBe(0);
    expect(shortUnitsOf(short, new Map([['v:77', 4]]))).toBe(0); // restocked
  });
  it('a shipped-on or not-oversold order is never short', () => {
    expect(shortUnitsOf(order(), new Map([['v:77', -5]]))).toBe(0);
    expect(shortUnitsOf({ ...short, status: 'fulfilled' }, new Map([['v:77', -5]]))).toBe(0);
  });
  it('a line without a variant reads the product stock', () => {
    const o = order({ oversold: true, lines: [{ ...order().lines[0], variantId: null, quantity: 3 }] });
    expect(shortUnitsOf(o, new Map([['p:10', -2]]))).toBe(2);
  });
});

describe('the order list', () => {
  const list = [
    order({ id: '1', paidAt: '2026-10-18T09:00:00Z' }),
    order({ id: '2', paidAt: '2026-10-17T09:00:00Z' }),
    order({ id: '3', delivery: { preference: 'pickup', address: null } }),
    order({ id: '4', status: 'fulfilled' }),
    order({ id: '5', status: 'cancelled' })
  ];
  it('counts and opens on "to ship" when there is any', () => {
    const c = orderCounts(list);
    expect(c).toMatchObject({ toShip: 2, toHandOver: 1, done: 1, cancelled: 1, all: 5 });
    expect(defaultOrderFilter(c)).toBe('toShip');
    expect(defaultOrderFilter(orderCounts([list[2]]))).toBe('toHandOver');
    expect(defaultOrderFilter(orderCounts([list[3]]))).toBe('all');
  });
  it('waiting orders oldest first, the rest newest first', () => {
    expect(sortOrders(filterOrders(list, 'toShip'), 'toShip').map((o) => o.id)).toEqual(['2', '1']);
    expect(sortOrders(list.slice(0, 2), 'all').map((o) => o.id)).toEqual(['1', '2']);
  });
  it('searches by number, name, phone digits and product', () => {
    const o = order();
    expect(matchesOrder(o, '1042')).toBe(true);
    expect(matchesOrder(o, 'דנה')).toBe(true);
    expect(matchesOrder(o, '0501234567')).toBe(true);
    expect(matchesOrder(o, 'STL')).toBe(true);
    expect(matchesOrder(o, 'zzz')).toBe(false);
  });
  it('the banner: short wins over waiting', () => {
    expect(bannerOf([order(), order({ id: '2' })])).toEqual({ kind: 'toShip', count: 2 });
    expect(bannerOf([order(), order({ id: '2', shortUnits: 2 })])).toEqual({ kind: 'short', count: 1 });
    expect(bannerOf([order({ status: 'fulfilled' })])).toBeNull();
  });
});

describe('cancel — the holder only', () => {
  it('only the holder may cancel, and never twice', () => {
    expect(mayCancel(order(), '7')).toBe(true);
    expect(mayCancel(order(), '8')).toBe(false);
    expect(mayCancel(order(), null)).toBe(false);
    expect(mayCancel(order({ status: 'cancelled' }), '7')).toBe(false);
  });
  it('counts sales already in a split, not the reset ones', () => {
    const o = order({
      sales: [
        { id: 'a', holderId: '7', holderStatus: 'self', inSplit: true, amount: 620 },
        { id: 'b', holderId: '7', holderStatus: 'self', inSplit: true, amount: 0 },
        { id: 'c', holderId: '7', holderStatus: 'self', inSplit: false, amount: 40 }
      ]
    });
    expect(salesInSplit(o)).toBe(1);
  });
});

describe('address', () => {
  it('reads the stored json and writes one line', () => {
    const a = addressOf({ city: ' נתניה ', street: 'הרצל 1', zip: '42500' });
    expect(a).toEqual({
      city: 'נתניה',
      street: 'הרצל 1',
      zip: '42500',
      notes: null,
      house: null,
      apartment: null,
      floor: null,
      entrance: null,
      country: null
    });
    expect(addressLine(a)).toBe('הרצל 1, נתניה 42500');
    expect(addressOf({})).toBeNull();
    expect(addressOf('x')).toBeNull();
  });
});

describe('stock', () => {
  it('reads one number as the seller should', () => {
    expect(stockStateOf(null)).toBe('unlimited');
    expect(stockStateOf(-3)).toBe('short');
    expect(stockStateOf(-1)).toBe('short'); // a queue of one, not "unlimited"
    expect(stockStateOf(0)).toBe('out');
    expect(stockStateOf(2, 3)).toBe('low');
    expect(stockStateOf(2)).toBe('ok'); // no threshold = never low
  });

  it('set replaces, add adds a delivery, unlimited is the flag', () => {
    expect(nextStock(4, 'set', 7)).toEqual({ quant: 7, unlimited: false });
    expect(nextStock(4, 'set', -1)).toBeNull();
    expect(nextStock(4, 'add', 3)).toEqual({ quant: 7, unlimited: false });
    expect(nextStock(-2, 'add', 5)).toEqual({ quant: 3, unlimited: false }); // fills the production queue first
    expect(nextStock(-1, 'add', 1)).toEqual({ quant: 0, unlimited: false }); // -1 is a count
    expect(nextStock(null, 'add', 3)).toBeNull(); // nothing to add to an unlimited stock
    expect(nextStock(4, 'add', 0)).toBeNull();
    expect(nextStock(4, 'set', 0, true)).toEqual({ quant: -1, unlimited: true });
  });

  it('a write changes the stock unless it says what is already there', () => {
    expect(stockWouldChange(4, { quant: 4, unlimited: false })).toBe(false);
    expect(stockWouldChange(-1, { quant: -1, unlimited: true })).toBe(true); // a queue of one → unlimited
    expect(stockWouldChange(null, { quant: -1, unlimited: true })).toBe(false);
    expect(stockWouldChange(null, { quant: -1, unlimited: false })).toBe(true);
  });

  const products: ShopProductRow[] = [
    {
      id: '10', name: 'שרפרף', imageUrl: null, price: 480, pricingMode: 'fixed', status: 'published', kindOf: 'total', quant: 0, lowStockAt: 2,
      variants: [
        { id: '77', sku: 'S-65', label: 'גובה 65', price: 480, quant: 4, active: true },
        { id: '78', sku: 'S-75', label: 'גובה 75', price: 540, quant: -2, active: true },
        { id: '79', sku: 'S-85', label: 'גובה 85', price: null, quant: 1, active: true },
        { id: '80', sku: 'S-95', label: 'גובה 95', price: 900, quant: 9, active: false }
      ]
    },
    { id: '11', name: 'כפות', imageUrl: null, price: 95, pricingMode: 'fixed', status: 'published', kindOf: 'unlimited', quant: 0, lowStockAt: null, variants: [] },
    { id: '12', name: 'ישן', imageUrl: null, price: 1, pricingMode: 'fixed', status: 'archived', kindOf: 'total', quant: 3, lowStockAt: null, variants: [] }
  ];

  it('one row per active variant, or per product; archived products are gone', () => {
    const rows = stockRowsOf(products);
    expect(rows.map((r) => r.key)).toEqual(['v:77', 'v:78', 'v:79', 'p:11']);
    expect(rows.find((r) => r.key === 'v:79')?.state).toBe('low');
    expect(rows.find((r) => r.key === 'p:11')?.state).toBe('unlimited');
  });

  it('"needs attention" first: short, out, low', () => {
    const rows = stockRowsOf(products);
    expect(filterStock(rows, 'attention').map((r) => r.key)).toEqual(['v:78', 'v:79']);
    expect(filterStock(rows, 'all', 's-85').map((r) => r.key)).toEqual(['v:79']);
  });

  it('price range from active variants, falling back to the product price', () => {
    expect(priceRangeOfRow(products[0])).toEqual({ min: 480, max: 540 });
    expect(priceRangeOfRow(products[1])).toEqual({ min: 95, max: 95 });
  });

  it('total stock never counts a production queue as stock', () => {
    expect(stockTotalOfRow(products[0])).toBe(5);
    expect(stockTotalOfRow(products[1])).toBeNull(); // unlimited
  });
});

describe('sales', () => {
  const now = Date.parse('2026-10-18T12:00:00Z');
  const sale = (over: Partial<ShopSaleRow>): ShopSaleRow => ({
    id: 's', date: '2026-10-17T10:00:00Z', amount: 100, units: 1, productId: '10', productName: 'שרפרף',
    variantLabel: null, orderId: null, source: 'ui', holderId: '7', holderName: 'נועה', holderStatus: 'self',
    splited: false, inSplit: false, ...over
  });

  it('where a sale stands with the split', () => {
    expect(splitStateOf(sale({}))).toBe('waiting');
    expect(splitStateOf(sale({ inSplit: true }))).toBe('inSplit');
    expect(splitStateOf(sale({ splited: true }))).toBe('split');
    expect(splitStateOf(sale({ holderStatus: 'open' }))).toBe('claimOpen');
  });

  it('filters by range and source, newest first', () => {
    const list = [
      sale({ id: 'a', date: '2026-10-17T10:00:00Z', source: 'api' }),
      sale({ id: 'b', date: '2026-09-01T10:00:00Z' }),
      sale({ id: 'c', date: '2026-10-18T10:00:00Z' })
    ];
    expect(filterSales(list, { range: '30', source: 'all', now }).map((s) => s.id)).toEqual(['c', 'a']);
    expect(filterSales(list, { range: 'all', source: 'api', now }).map((s) => s.id)).toEqual(['a']);
  });

  it('the KPI strip: waiting money and the last 30 days', () => {
    const s = salesSummary(
      [
        sale({ id: 'a', amount: 100, source: 'api' }),
        sale({ id: 'b', amount: 50, inSplit: true }),
        sale({ id: 'c', amount: 30, holderStatus: 'open' }),
        sale({ id: 'd', amount: 20, date: '2026-01-01T00:00:00Z' })
      ],
      now
    );
    expect(s.awaiting).toBe(120);
    expect(s.recent).toBe(180);
    expect(s.recentCount).toBe(3);
    expect(s.siteShare).toBe(33);
  });
});

describe('CSV', () => {
  it('quotes and defuses formulas', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell(-5)).toBe('-5');
    expect(csvCell(null)).toBe('');
    expect(toCsv([['a', 1]])).toBe('﻿a,1\r\n');
  });

  it('a readable, unique Shopify handle', () => {
    expect(handleOf('סדנת קרמיקה', '1842')).toBe('סדנת-קרמיקה-1842');
    expect(handleOf('!!!', '9')).toBe('product-9');
  });

  it('Shopify rows: one per variant, product columns on the first row only', () => {
    const rows = shopifyCsvRows([
      {
        id: '10', name: 'שרפרף', imageUrl: 'https://x/1.jpg', price: 480, pricingMode: 'fixed', status: 'published', kindOf: 'total', quant: 0, lowStockAt: null,
        options: [{ name: 'גובה', values: [] }],
        variants: [
          { id: '77', sku: 'S-65', label: '65', price: null, quant: 4, active: true },
          { id: '78', sku: 'S-75', label: '75', price: 540, quant: null, active: true }
        ]
      },
      { id: '11', name: 'כפות', imageUrl: null, price: 95, pricingMode: 'fixed', status: 'draft', kindOf: 'total', quant: 3, lowStockAt: null, variants: [] }
    ]);
    expect(rows[0][0]).toBe('Handle');
    expect(rows[1]).toEqual(['שרפרף-10', 'שרפרף', 'active', 'גובה', '65', '', '', '', '', 'S-65', 480, 'shopify', 4, 'https://x/1.jpg']);
    expect(rows[2]).toEqual(['שרפרף-10', '', '', '', '75', '', '', '', '', 'S-75', 540, '', '', '']);
    expect(rows[3]).toEqual(['כפות-11', 'כפות', 'draft', 'Title', 'Default Title', '', '', '', '', '', 95, 'shopify', 3, '']);
  });
});

describe('payment by arrangement (PLAN_SHOP_OPERATIONS §5)', () => {
  const waiting = (over: Partial<ShopOrder> = {}) =>
    order({ status: 'pendingPayment', holderId: null, holderName: null, paidAt: null, ...over });

  it('a waiting order is "to collect" — nothing to pack, no ship button', () => {
    expect(orderTaskOf(waiting())).toBe('toCollect');
    expect(primaryActionOf(waiting())).toBeNull();
    expect(orderCounts([waiting(), order()])).toMatchObject({ toCollect: 1, toShip: 1 });
  });

  it('opens on "to collect" only when nothing waits to be sent', () => {
    expect(defaultOrderFilter(orderCounts([waiting(), order()]))).toBe('toShip');
    expect(defaultOrderFilter(orderCounts([waiting()]))).toBe('toCollect');
  });

  it('any member confirms or calls it off — until one started recording it as theirs', () => {
    expect(mayConfirmPayment(waiting(), '8')).toBe(true);
    expect(mayCancel(waiting(), '8')).toBe(true);
    expect(mayConfirmPayment(waiting({ holderId: '7' }), '8')).toBe(false);
    expect(mayConfirmPayment(waiting({ holderId: '7' }), '7')).toBe(true);
    expect(mayCancel(waiting({ holderId: '7' }), '8')).toBe(false);
    expect(mayConfirmPayment(order(), '7')).toBe(false);
    expect(mayConfirmPayment(waiting(), null)).toBe(false);
  });

  it('a phone becomes a wa.me number', () => {
    expect(whatsappNumberOf('050-123 4567')).toBe('972501234567');
    expect(whatsappNumberOf('+1 (415) 555-0100')).toBe('14155550100');
    expect(whatsappNumberOf('00972501234567')).toBe('972501234567');
    expect(whatsappNumberOf('123')).toBeNull();
    expect(whatsappHref('0501234567', 'שלום')).toBe('https://wa.me/972501234567?text=%D7%A9%D7%9C%D7%95%D7%9D');
  });
});
