/**
 * The moach guide points at real menu elements, so it is tested for the ways
 * it used to drift from the menu: a step whose element is gone, and a second
 * run (the ? button) that starts where the first one ended.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import { flushSync } from 'svelte';

vi.mock('$lib/translations', () => ({
  t: readable((key: string, payload?: Record<string, unknown>) =>
    payload ? `${key}:${Object.values(payload).join(',')}` : key
  ),
  isRtl: readable(true)
}));

import MoachTour from './MoachTour.svelte';

const steps = [
  { id: 'create', key: 'moach.tour.create' },
  { id: 'missing', key: 'moach.tour.missing' },
  { id: 'group-work', key: 'moach.tour.group.work' },
  { id: 'help', key: 'moach.tour.help' }
];

function mountTargets(ids: string[]) {
  for (const id of ids) {
    const el = document.createElement('a');
    el.dataset.moachTour = id;
    el.scrollIntoView = () => {};
    document.body.appendChild(el);
  }
}

const dialogText = () => document.querySelector('[role="dialog"] p')?.textContent?.trim();
const button = (label: string) =>
  [...document.querySelectorAll('[role="dialog"] button')].find(
    (b) => b.textContent?.trim() === label
  ) as HTMLButtonElement;

beforeEach(() => mountTargets(['create', 'group-work', 'help']));
afterEach(() => {
  document.body.innerHTML = '';
});

describe('MoachTour', () => {
  it('stays closed until opened', () => {
    render(MoachTour, { props: { steps, open: false } });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('walks only the steps whose element is on the page', async () => {
    render(MoachTour, { props: { steps, open: true } });
    flushSync();
    expect(dialogText()).toBe('moach.tour.create');
    expect(document.body.textContent).toContain('moach.tour.stepOf:1,3');

    await fireEvent.click(button('moach.tour.next'));
    expect(dialogText()).toBe('moach.tour.group.work');

    await fireEvent.click(button('moach.tour.back'));
    expect(dialogText()).toBe('moach.tour.create');

    await fireEvent.click(button('moach.tour.next'));
    await fireEvent.click(button('moach.tour.next'));
    expect(dialogText()).toBe('moach.tour.help');
    await fireEvent.click(button('moach.tour.done'));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('starts from the first step again when reopened', async () => {
    const view = render(MoachTour, { props: { steps, open: true } });
    flushSync();
    await fireEvent.click(button('moach.tour.next'));
    await fireEvent.click(button('moach.tour.skip'));
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await view.rerender({ steps, open: false });
    await view.rerender({ steps, open: true });
    flushSync();
    expect(dialogText()).toBe('moach.tour.create');
  });

  it('closes on Escape', async () => {
    render(MoachTour, { props: { steps, open: true } });
    flushSync();
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
