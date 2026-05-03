import { describe, expect, it } from 'vitest';
import { mapProjectProcesses } from './processes';

describe('mapProjectProcesses', () => {
  it('builds a process view model from process and mapping forums', () => {
    const result = mapProjectProcesses('42', {
      forums: {
        data: [
          {
            id: '10',
            attributes: {
              subject: 'PROCESS::77::Launch onboarding',
              updatedAt: '2026-04-27T10:00:00.000Z',
              messages: {
                data: [
                  {
                    id: '1',
                    attributes: {
                      content: 'Need a clear onboarding flow'
                    }
                  }
                ]
              }
            }
          },
          {
            id: '11',
            attributes: {
              subject: 'PROCESS_ENTITY::pendm::77::501::Define first flow'
            }
          }
        ]
      },
      pendms: {
        data: [
          {
            id: '501',
            attributes: {
              name: 'Define first flow',
              descrip: 'Create the first pending mission',
              createdAt: '2026-04-27T10:05:00.000Z'
            }
          }
        ]
      },
      pmashes: { data: [] },
      open_missions: { data: [] },
      open_mashaabims: { data: [] },
      mesimabetahaliches: { data: [] }
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Launch onboarding');
    expect(result[0].description).toContain('onboarding');
    expect(result[0].stageCounts.pending).toBe(1);
  });
});
