import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendToSer = vi.fn();
vi.mock('$lib/send/sendToSer.js', () => ({
  sendToSer: (...args: unknown[]) => sendToSer(...args)
}));

const { GET } = await import('./+server');

function event(uid: string | false) {
  return {
    locals: { uid },
    fetch: vi.fn()
  } as any;
}

beforeEach(() => {
  sendToSer.mockReset();
});

describe('GET /api/quick-create/projects', () => {
  it('requires a signed-in member', async () => {
    await expect(GET(event(false))).rejects.toMatchObject({ status: 401 });
    expect(sendToSer).not.toHaveBeenCalled();
  });

  it('uses locals.uid and returns only the picker fields without caching', async () => {
    sendToSer.mockResolvedValue({
      data: {
        usersPermissionsUser: {
          data: {
            attributes: {
              projects_1s: {
                data: [
                  {
                    id: 17,
                    attributes: {
                      projectName: 'Central rikma',
                      profilePic: {
                        data: {
                          attributes: {
                            formats: {
                              thumbnail: { url: '/uploads/central-thumb.png' }
                            },
                            url: '/uploads/central.png'
                          }
                        }
                      },
                      confidentialField: 'must not leave the endpoint'
                    }
                  },
                  { id: '18', attributes: {} }
                ]
              }
            }
          }
        }
      }
    });

    const response = await GET(event('7'));
    expect(sendToSer).toHaveBeenCalledWith(
      { uid: '7' },
      '64getUserProjectList',
      null,
      null,
      false,
      expect.any(Function),
      { silent: true }
    );
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    await expect(response.json()).resolves.toEqual({
      projects: [
        {
          id: '17',
          projectName: 'Central rikma',
          profilePic: '/uploads/central-thumb.png'
        }
      ]
    });
  });

  it('fails closed if the member project list cannot be loaded', async () => {
    sendToSer.mockRejectedValue(new Error('upstream unavailable'));
    await expect(GET(event('7'))).rejects.toMatchObject({ status: 503 });
  });
});
