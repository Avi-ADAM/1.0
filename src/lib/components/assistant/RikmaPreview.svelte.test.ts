import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { readable } from 'svelte/store';

vi.mock('$lib/translations', () => ({
  t: readable((key: string, payload?: Record<string, unknown>) =>
    payload ? `${key}:${Object.values(payload).join(',')}` : key
  ),
  locale: readable('he'),
  isRtl: readable(true)
}));

import RikmaPreview from './RikmaPreview.svelte';
import { blueprintToRikmaView } from '$lib/assistant/rikmaView';

describe('RikmaPreview — rich public rikma presentation', () => {
  it('renders doors, about & looking-for, partner rings, rich missions with hours × rate = value, resources and split', () => {
    const view = blueprintToRikmaView({
      fields: {
        track: 'partnership',
        name: 'בית המלאכה',
        publicDescription: 'נגרייה שיתופית לעיצוב מקומי',
        descripFor: 'נגרית ומעצב תעשייתי',
        linkToWebsite: 'https://workshop.example.org',
        vals: ['קיימות', 'יצירה'],
        location: { hint: 'חיפה', isOnline: true },
        currency: 'ILS',
        restime: 'sth'
      },
      items: [
        {
          key: 'i1',
          group: 'products',
          label: 'שולחן אלון מלא',
          status: 'proposed',
          origin: 'agent',
          spec: { desc: 'עבודת יד בהזמנה אישית', price: 3200, categories: ['ריהוט', 'עיצוב'], isOnline: true }
        },
        {
          key: 'i2',
          group: 'rikmaMissions',
          label: 'ייצור והרכבה',
          status: 'proposed',
          origin: 'agent',
          spec: {
            descrip: '<p>חיתוך, הקצעה ו<strong>גימור שמן</strong></p>',
            holder: 'me',
            hours: 20,
            ratePerHour: 150,
            roles: ['נגר'],
            skills: ['עץ מלא']
          }
        },
        {
          key: 'i3',
          group: 'partners',
          label: 'תמר',
          status: 'proposed',
          origin: 'agent',
          spec: { email: 'tamar@secret.org' }
        },
        {
          key: 'i4',
          group: 'rikmaResources',
          label: 'חלל הנגרייה',
          status: 'proposed',
          origin: 'agent',
          spec: { descrip: 'כולל מסור שולחן ושאיבה', holder: 'partner', partnerKey: 'i3', kindOf: 'monthly', price: 2000 }
        }
      ]
    });

    const { getByText, getAllByText, container } = render(RikmaPreview, { props: { view } });

    // Rich doors like RikmaPage
    expect(getByText('rikmaImport.preview.supportDoorTitle')).toBeTruthy();
    expect(getByText('rikmaImport.preview.joinDoorTitle')).toBeTruthy();

    // About + looking-for + stripped rich description on mission
    expect(getByText('נגרייה שיתופית לעיצוב מקומי')).toBeTruthy();
    expect(getByText('נגרית ומעצב תעשייתי')).toBeTruthy();
    expect(getByText('חיתוך, הקצעה וגימור שמן')).toBeTruthy();

    // Mission hours, rate, skills & roles visible directly on the public page
    expect(getByText(/rikmaImport\.preview\.hoursBadge:20/)).toBeTruthy();
    expect(getByText('נגר')).toBeTruthy();
    expect(getByText('עץ מלא')).toBeTruthy();

    // Partner avatar, resource holder & split all render; secret email never rendered anywhere
    expect(getAllByText('תמר')).toHaveLength(3);
    expect(getByText('60%')).toBeTruthy();
    expect(getByText('40%')).toBeTruthy();
    expect(container.innerHTML).not.toContain('tamar@secret.org');
  });
});
