import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { readable } from 'svelte/store';

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  replaceState: vi.fn()
}));
vi.mock('svelte-sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  })
}));
vi.mock('$lib/translations', () => ({
  t: readable((key: string, vars?: Record<string, unknown>) =>
    vars ? `${key} ${JSON.stringify(vars)}` : key
  ),
  isRtl: readable(true),
  locale: readable('he')
}));
vi.mock('$lib/money/context.svelte', () => ({
  useFormatMoney: () => (n: number) => `₪${n}`,
  useRikmaCurrency: () => () => 'ILS'
}));
vi.mock('$lib/stores/uPic.js', () => ({
  uPic: readable(null)
}));
vi.mock('$lib/celim/icons/EntityIcon.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/concierge/ConciergeBell.svelte', () => ({
  default: () => {}
}));
vi.mock('$lib/components/location/LocationPicker.svelte', () => ({
  default: () => {}
}));

const WishForm = (await import('./WishForm.svelte')).default;

describe('WishForm — readiness & required fields checklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows both required fields (title and description) as missing when form is empty', () => {
    const { container } = render(WishForm as any, { props: { data: {} } });

    const progress = container.querySelector('.pub-ready-track');
    expect(progress?.getAttribute('aria-valuenow')).toBe('0');
    expect(container.textContent).toContain(
      'concierge.new.readiness.ofRequired {"done":0,"total":2}'
    );

    const items = container.querySelectorAll('.pub-ready-item');
    expect(items.length).toBe(2);
    expect(items[0].classList.contains('pub-ready-item-missing')).toBe(true);
    expect(items[1].classList.contains('pub-ready-item-missing')).toBe(true);
    expect(items[0].textContent).toContain('concierge.new.readiness.ckTitle');
    expect(items[0].textContent).toContain('concierge.new.readiness.required');
    expect(items[1].textContent).toContain('concierge.new.readiness.ckBody');
    expect(items[1].textContent).toContain('concierge.new.readiness.required');

    const pubBtn = container.querySelector('.pub-btn') as HTMLButtonElement;
    expect(pubBtn.disabled).toBe(true);
  });

  it('shows remaining characters when title is too short, and marks title ready when >= 7 chars', async () => {
    const { container } = render(WishForm as any, { props: { data: {} } });
    const titleInput = container.querySelector(
      '#wish-title-inp'
    ) as HTMLInputElement;

    await fireEvent.input(titleInput, { target: { value: 'שולחן' } }); // 5 chars, needs 2 more
    await tick();

    const items = container.querySelectorAll('.pub-ready-item');
    expect(items[0].textContent).toContain(
      'concierge.new.readiness.moreChars {"remain":2}'
    );

    await fireEvent.input(titleInput, { target: { value: 'שולחן עץ אלון' } }); // >= 7 chars
    await tick();

    expect(items[0].classList.contains('pub-ready-item-ok')).toBe(true);
    expect(items[0].textContent).toContain('concierge.new.readiness.done');
    expect(container.textContent).toContain(
      'concierge.new.readiness.ofRequired {"done":1,"total":2}'
    );
    // Publish hint now specifically points to the missing description
    expect(container.querySelector('.pub-hint')?.textContent).toContain(
      'concierge.new.readiness.needBody'
    );
  });

  it('enables the publish button and marks 2 of 2 ready when draft has valid title and description', () => {
    const { container } = render(WishForm as any, {
      props: {
        data: {
          draft: {
            id: '10',
            title: 'שולחן עץ אלון לפינת העבודה',
            body: '<p>אני מחפש נגר שיבנה שולחן עץ אלון מלא בגודל מטר וחצי לפינת העבודה הביתית שלי</p>',
            startDate: null,
            finnishDate: null,
            budgetAmount: null,
            whoCanOffer: true,
            whoCanSee: 'personal',
            location: {
              location_mode: 'unspecified',
              isOnline: false,
              lat: null,
              lng: null,
              radius: 15,
              location_hint: ''
            },
            extractedMissions: [],
            extractedResources: [],
            aiMeta: null
          }
        }
      }
    });

    const progress = container.querySelector('.pub-ready-track');
    expect(progress?.getAttribute('aria-valuenow')).toBe('100');
    expect(container.textContent).toContain(
      'concierge.new.readiness.ofRequired {"done":2,"total":2}'
    );

    const items = container.querySelectorAll('.pub-ready-item');
    expect(items[0].classList.contains('pub-ready-item-ok')).toBe(true);
    expect(items[1].classList.contains('pub-ready-item-ok')).toBe(true);

    const pubBtn = container.querySelector('.pub-btn') as HTMLButtonElement;
    expect(pubBtn.disabled).toBe(false);
  });
});
