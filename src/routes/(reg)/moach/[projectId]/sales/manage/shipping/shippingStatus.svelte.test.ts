/**
 * The shipping page's go-live switch. Methods that are set up but switched off
 * reach no buyer, so that state has to be said out loud.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import { normalizeShippingConfig } from '$lib/shop/shipping';

const h = vi.hoisted(() => ({
  executeAction: vi.fn(async (..._a: unknown[]) => ({ success: true })),
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() }
}));

vi.mock('$app/state', () => ({ page: { params: { projectId: '87' } } }));
vi.mock('$app/navigation', () => ({ invalidate: vi.fn(async () => {}), goto: vi.fn() }));
vi.mock('svelte-sonner', () => ({ toast: h.toast }));
vi.mock('$lib/client/actionClient', () => ({
  executeAction: h.executeAction,
  actionErrorText: () => 'error'
}));
vi.mock('$lib/translations', () => ({
  t: readable((key: string) => key),
  locale: readable('he')
}));

const { default: Page } = await import('./+page.svelte');

const zone = {
  id: 'z1',
  name: 'North',
  everywhere: true,
  methods: [{ id: 'm1', name: 'Courier', fee: 30 }]
};

function show(config: Record<string, unknown>) {
  const shipping = {
    ready: true,
    config: normalizeShippingConfig(config),
    currency: 'ILS',
    products: [],
    districts: [],
    rules: [],
    updatedByName: null
  };
  return render(Page, { props: { data: { shipping } } as never });
}

const WARNING = 'shop.ship.offWarnTitle';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('shipping go-live status', () => {
  it('warns when methods exist and the switch is off', () => {
    show({ enabled: false, zones: [zone] });
    expect(screen.getByText(WARNING)).toBeTruthy();
    expect(screen.getByText('shop.ship.statusOff')).toBeTruthy();
    expect(screen.getByText('shop.ship.barOff')).toBeTruthy();
  });

  it('counts a pickup point as something to offer', () => {
    show({ enabled: false, pickupPoints: [{ id: 'p1', name: 'Shop' }] });
    expect(screen.getByText(WARNING)).toBeTruthy();
  });

  it('stays quiet when nothing is set up yet', () => {
    show({ enabled: false });
    expect(screen.queryByText(WARNING)).toBeNull();
    expect(screen.queryByText('shop.ship.barOff')).toBeNull();
  });

  it('stays quiet when delivery is on', () => {
    show({ enabled: true, zones: [zone] });
    expect(screen.queryByText(WARNING)).toBeNull();
    expect(screen.getByText('shop.ship.statusOn')).toBeTruthy();
  });

  it('keeps the saved state in the chip until the switch is saved', async () => {
    show({ enabled: false, zones: [zone] });
    await fireEvent.click(screen.getByRole('checkbox', { name: /shop\.ship\.enabled/ }));
    expect(screen.queryByText(WARNING)).toBeNull();
    expect(screen.getByText('shop.ship.statusOff')).toBeTruthy();
    expect(screen.getByText('shop.ship.statusPending')).toBeTruthy();
  });

  it('turns delivery on and saves from the warning', async () => {
    show({ enabled: false, zones: [zone] });
    await fireEvent.click(screen.getByText('shop.ship.offWarnAction'));
    await waitFor(() => expect(h.executeAction).toHaveBeenCalledTimes(1));
    const [action, params] = h.executeAction.mock.calls[0] as [string, { projectId: string; config: { enabled: boolean } }];
    expect(action).toBe('saveShippingConfig');
    expect(params.projectId).toBe('87');
    expect(params.config.enabled).toBe(true);
    await waitFor(() => expect(h.toast.success).toHaveBeenCalledWith('shop.ship.saved'));
    expect(h.toast.warning).not.toHaveBeenCalled();
  });

  it('says a save left delivery off', async () => {
    show({ enabled: false, zones: [zone] });
    await fireEvent.click(screen.getByRole('checkbox', { name: /shop\.ship\.hideSentVia/ }));
    await fireEvent.click(screen.getByText('shop.ship.save'));
    await waitFor(() => expect(h.toast.warning).toHaveBeenCalledWith('shop.ship.savedButOff'));
    expect(h.toast.success).not.toHaveBeenCalled();
  });

  it('does not save when a zone is incomplete, and shows why', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    show({ enabled: false, zones: [{ ...zone, name: '' }] });
    await fireEvent.click(screen.getByText('shop.ship.offWarnAction'));
    await waitFor(() => expect(screen.getByText('shop.ship.problems')).toBeTruthy());
    expect(h.executeAction).not.toHaveBeenCalled();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
