import { describe, expect, it } from 'vitest';
import { hoursAlreadyFiled, hoursStillToFile } from './unfiledHours.js';

const row = (noofhours: number, archived?: boolean) => ({ attributes: { noofhours, archived } });

describe('hoursStillToFile — completion carries only what the timers did not file', () => {
  it('a timer save already filed the whole total → nothing left (the C-13 double count)', () => {
    const mission = { finiapruvals: { data: [row(0.119, false)] } };
    expect(hoursStillToFile(0.119, mission)).toBe(0);
  });

  it('a rikma of one: the straight-to-row save counts as filed too', () => {
    const mission = { finnished_missions: { data: [row(5.005)] } };
    expect(hoursStillToFile(5.005, mission)).toBe(0);
  });

  it('only the unfiled remainder is carried', () => {
    const mission = {
      finnished_missions: { data: [row(2)] },
      finiapruvals: { data: [row(1, false)] }
    };
    expect(hoursStillToFile(4, mission)).toBe(1);
  });

  it('a closed approval is not counted twice — it already became a row', () => {
    const mission = {
      finnished_missions: { data: [row(3)] },
      finiapruvals: { data: [row(3, true)] }
    };
    expect(hoursAlreadyFiled(mission)).toBe(3);
    expect(hoursStillToFile(3, mission)).toBe(0);
  });

  it('nothing filed yet (legacy: hours only on the mission) → carries it all', () => {
    expect(hoursStillToFile(7.5, {})).toBe(7.5);
    expect(hoursStillToFile(7.5, null)).toBe(7.5);
  });

  it('never negative, and float noise is not a phantom approval', () => {
    const mission = { finiapruvals: { data: [row(0.1, false), row(0.2, false)] } };
    expect(hoursStillToFile(0.3, mission)).toBe(0);
    expect(hoursStillToFile(0.1, mission)).toBe(0);
  });
});
