import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { readable } from 'svelte/store';

/**
 * "Changed while you were editing": the rikma's details change under the open
 * form (the moach realtime adapter re-reads `projectBase`). What the member did
 * not touch follows quietly; what both sides changed is put to them.
 */

vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));
vi.mock('$app/state', () => ({ page: { params: {} } }));
vi.mock('$lib/translations', () => ({
  t: readable((key: string, vars?: Record<string, unknown>) => (vars ? `${key} ${JSON.stringify(vars)}` : key)),
  isRtl: readable(true)
}));
vi.mock('$lib/stores/lang.js', () => ({ lang: readable('en') }));
vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer: vi.fn(async () => ({ data: { vallues: { data: [] } } })) }));
vi.mock('$lib/client/actionClient.js', () => ({ executeAction: vi.fn(async () => ({ success: true, data: {} })) }));
vi.mock('svelte-multiselect', () => ({ default: () => {} }));
vi.mock('$lib/celim/ui/richText.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/userPr/uploadPic.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/money/CurrencyPicker.svelte', () => ({ default: () => {} }));

const EditProjectDetails = (await import('./EditProjectDetails.svelte')).default;

const base = {
  projectName: 'Bakery',
  linkToWebsite: 'https://bake.example',
  githublink: '',
  restime: 'feh',
  vallues: { data: [] }
};

async function open() {
  const view = render(EditProjectDetails as any, { props: { projectBase: base, projectId: '7', memberCount: 1 } });
  await tick();
  const name = view.container.querySelector('#epd-name') as HTMLInputElement;
  const site = view.container.querySelector('#epd-website') as HTMLInputElement;
  return { view, name, site };
}

describe('EditProjectDetails — changed while you were editing', () => {
  it('takes a change to a field the member did not touch, and says so', async () => {
    const { view, name, site } = await open();
    await fireEvent.input(name, { target: { value: 'My bakery' } });
    await view.rerender({ projectBase: { ...base, linkToWebsite: 'https://new.example' } });
    await tick();
    expect(site.value).toBe('https://new.example');
    expect(name.value).toBe('My bakery');
    expect(view.container.textContent).toContain('project.editDetails.updatedQuietly');
    expect(view.container.querySelector('[role="alert"]')).toBeNull();
  });

  it('puts a field both sides changed to the member — and "load the new version" takes theirs', async () => {
    const { view, name } = await open();
    await fireEvent.input(name, { target: { value: 'My bakery' } });
    await view.rerender({ projectBase: { ...base, projectName: 'Their bakery' } });
    await tick();
    const alert = view.container.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('project.editDetails.changedTitle');
    expect(alert.textContent).toContain('project.editDetails.name');
    expect(name.value).toBe('My bakery');
    await fireEvent.click(view.getByText('project.editDetails.takeTheirs'));
    await tick();
    expect(name.value).toBe('Their bakery');
    expect(view.container.querySelector('[role="alert"]')).toBeNull();
  });

  it('"keep mine" keeps the member\'s text', async () => {
    const { view, name } = await open();
    await fireEvent.input(name, { target: { value: 'My bakery' } });
    await view.rerender({ projectBase: { ...base, projectName: 'Their bakery' } });
    await tick();
    await fireEvent.click(view.getByText('project.editDetails.keepMine'));
    await tick();
    expect(name.value).toBe('My bakery');
    expect(view.container.querySelector('[role="alert"]')).toBeNull();
  });

  it('a re-read with nothing new says nothing', async () => {
    const { view } = await open();
    await view.rerender({ projectBase: { ...base } });
    await tick();
    expect(view.container.querySelector('[role="alert"]')).toBeNull();
    expect(view.container.querySelector('[role="status"]')).toBeNull();
  });
});
