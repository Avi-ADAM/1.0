import { describe, expect, it, vi, beforeEach } from 'vitest';
import { normalizeShippingConfig } from '../../lib/shop/shipping';

const sendToSer = vi.fn();
const getMcpContext = vi.fn();
const readShippingConfig = vi.fn();
const quoteForRikma = vi.fn();

vi.mock('../../lib/send/sendToSer.js', () => ({ sendToSer: (...a: any[]) => sendToSer(...a) }));
vi.mock('../../lib/server/mcpContext.js', () => ({ getMcpContext: () => getMcpContext() }));
vi.mock('../../lib/server/shop/shippingConfig.js', () => ({ readShippingConfig: (...a: any[]) => readShippingConfig(...a) }));
vi.mock('../../lib/server/shop/shipping.js', () => ({ quoteForRikma: (...a: any[]) => quoteForRikma(...a) }));

const { getShippingConfigTool, quoteShippingTool, shopReadTools } = await import('./shopTools');
const { MCP_TOOL_MANIFEST } = await import('../../lib/server/mcp/toolManifest');

const run = (tool: any, input: any) => tool.execute(input, {});

const config = normalizeShippingConfig({
  enabled: true,
  zones: [
    {
      id: 'north',
      name: 'North',
      districts: ['חיפה'],
      methods: [{ id: 'courier', name: 'Courier', fee: 30, freeOver: 300, etaMinDays: 2, etaMaxDays: 4 }]
    }
  ],
  pickupPoints: [{ id: 'studio', name: 'Studio', city: 'Haifa' }]
});

/** moachShopProducts: one simple product (#5, ₪40) and one sold by variant (#6, variant #61 at ₪120). */
const productsRes = {
  data: {
    matanots: {
      data: [
        { id: '5', attributes: { name: 'Mug', price: 40, quant: 10 } },
        {
          id: '6',
          attributes: {
            name: 'Lamp',
            price: 100,
            hasVariants: true,
            variants: { data: [{ id: '61', attributes: { name: 'Large', price: 120, quant: 3 } }] }
          }
        }
      ]
    }
  }
};

beforeEach(() => {
  sendToSer.mockReset();
  readShippingConfig.mockReset();
  quoteForRikma.mockReset();
  getMcpContext.mockReset().mockReturnValue({ userId: '42', fetchInstance: vi.fn() });
});

describe('manifest', () => {
  it('registers both shipping tools as member-scoped reads with a title', () => {
    for (const key of ['getShippingConfigTool', 'quoteShippingTool'] as const) {
      expect(shopReadTools[key]).toBeDefined();
      expect(MCP_TOOL_MANIFEST[key]).toMatchObject({ tier: 'read', project: 'member' });
      expect(MCP_TOOL_MANIFEST[key].title).toBeTruthy();
    }
  });
});

describe('getShippingConfig', () => {
  it('says shipping is not set up while the columns are not deployed', async () => {
    readShippingConfig.mockResolvedValue({ live: false, config: normalizeShippingConfig(null), currency: 'ILS' });
    const res: any = await run(getShippingConfigTool, { projectId: '89' });
    expect(res).toMatchObject({ success: true, configured: false });
    expect(res.message).toMatch(/not set up/);
    expect(readShippingConfig.mock.calls[0][1]).toBe('89');
  });

  it('says shipping is not set up when the rikma switched it off', async () => {
    readShippingConfig.mockResolvedValue({ live: true, config: { ...config, enabled: false }, currency: 'ILS' });
    const res: any = await run(getShippingConfigTool, { projectId: '89' });
    expect(res).toMatchObject({ success: true, configured: false });
  });

  it('returns the zones, methods, pickup points and the lowest free-over', async () => {
    readShippingConfig.mockResolvedValue({ live: true, config, currency: 'ILS' });
    const res: any = await run(getShippingConfigTool, { projectId: '89' });
    expect(res).toMatchObject({ success: true, configured: true, currency: 'ILS', freeOver: 300, problems: [] });
    expect(res.shipping.zones[0].methods[0]).toMatchObject({ name: 'Courier', fee: 30 });
    expect(res.shipping.pickupPoints[0]).toMatchObject({ name: 'Studio' });
  });

  it('runs the probe through a runner that throws on a Strapi failure', async () => {
    readShippingConfig.mockImplementation(async (probe: any) => {
      sendToSer.mockResolvedValue({ errors: [{ message: 'Cannot query field "shipping"' }] });
      await expect(probe('rikmaApiShippingSchema', {})).rejects.toThrow(/Cannot query field/);
      return { live: false, config: normalizeShippingConfig(null), currency: 'ILS' };
    });
    const res: any = await run(getShippingConfigTool, { projectId: '89' });
    expect(res.configured).toBe(false);
  });

  it('refuses without an MCP user', async () => {
    getMcpContext.mockReturnValue(null);
    const res: any = await run(getShippingConfigTool, { projectId: '89' });
    expect(res.success).toBe(false);
    expect(readShippingConfig).not.toHaveBeenCalled();
  });
});

describe('quoteShipping', () => {
  const quote = {
    options: [{ id: 'm:north:courier', kind: 'delivery', name: 'Courier', fee: 30, free: false }],
    zone: { id: 'north', name: 'North' },
    needsAddress: false,
    outsideZones: false,
    noDeliveryProducts: [],
    weightUnknown: false,
    weightKg: 0,
    subtotal: 200
  };

  it('prices the lines from the catalog — variant price over product price', async () => {
    sendToSer.mockResolvedValue(productsRes);
    quoteForRikma.mockResolvedValue({ configured: true, currency: 'ILS', quote });
    const res: any = await run(quoteShippingTool, {
      projectId: '89',
      items: [
        { productId: '5', quantity: 2 },
        { productId: '6', variantId: '61', quantity: 1 }
      ],
      address: { city: 'Haifa' }
    });
    expect(sendToSer.mock.calls[0][1]).toBe('moachShopProducts');
    const [, pid, lines, address] = quoteForRikma.mock.calls[0];
    expect(pid).toBe('89');
    expect(lines).toEqual([
      { productId: '5', variantId: null, quantity: 2, unitPrice: 40 },
      { productId: '6', variantId: '61', quantity: 1, unitPrice: 120 }
    ]);
    expect(address).toEqual({ city: 'Haifa' });
    expect(res).toMatchObject({ success: true, configured: true, currency: 'ILS', zone: { id: 'north' } });
    expect(res.options[0].fee).toBe(30);
  });

  it('refuses a product of another rikma before quoting anything', async () => {
    sendToSer.mockResolvedValue(productsRes);
    const res: any = await run(quoteShippingTool, { projectId: '89', items: [{ productId: '999', quantity: 1 }] });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/not a product of rikma 89/);
    expect(quoteForRikma).not.toHaveBeenCalled();
  });

  it('asks for the variant of a product sold by variant', async () => {
    sendToSer.mockResolvedValue(productsRes);
    const res: any = await run(quoteShippingTool, { projectId: '89', items: [{ productId: '6', quantity: 1 }] });
    expect(res).toMatchObject({ success: false });
    expect(res.message).toMatch(/variantId/);
  });

  it('refuses a variant that belongs to another product', async () => {
    sendToSer.mockResolvedValue(productsRes);
    const res: any = await run(quoteShippingTool, {
      projectId: '89',
      items: [{ productId: '6', variantId: '77', quantity: 1 }]
    });
    expect(res.success).toBe(false);
    expect(quoteForRikma).not.toHaveBeenCalled();
  });

  it('says shipping is not set up instead of failing', async () => {
    sendToSer.mockResolvedValue(productsRes);
    quoteForRikma.mockResolvedValue({ configured: false, currency: 'ILS', quote: null });
    const res: any = await run(quoteShippingTool, { projectId: '89', items: [{ productId: '5', quantity: 1 }] });
    expect(res).toMatchObject({ success: true, configured: false });
    expect(res.message).toMatch(/not set up/);
  });

  it('reports a quote failure as a message', async () => {
    sendToSer.mockResolvedValue(productsRes);
    quoteForRikma.mockRejectedValue(new Error('boom'));
    const res: any = await run(quoteShippingTool, { projectId: '89', items: [{ productId: '5', quantity: 1 }] });
    expect(res.success).toBe(false);
    expect(res.message).not.toMatch(/boom/);
  });
});
