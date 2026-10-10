import { describe, expect, it } from 'vitest';
import { VIDEO_CONCIERGE, VIDEO_HOW_IT_WORKS, videoFor } from './videos.js';

describe('videoFor', () => {
  it('offers a video to readers of the language it is recorded in', () => {
    expect(videoFor(VIDEO_CONCIERGE, 'he')).toBe(VIDEO_CONCIERGE);
    expect(videoFor(VIDEO_HOW_IT_WORKS, 'he')).toBe(VIDEO_HOW_IT_WORKS);
  });

  it('offers nothing to the others — a Hebrew voice-over is not their help', () => {
    for (const l of ['en', 'ar', 'ru', 'es', '', null, undefined]) expect(videoFor(VIDEO_CONCIERGE, l)).toBeNull();
  });

  it('an unknown id is never played', () => {
    expect(videoFor('nope', 'he')).toBeNull();
  });
});
