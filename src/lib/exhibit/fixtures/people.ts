/**
 * Nine invented people who could join a visitor's idea. Names and one-line
 * descriptions are in `exhibit.people.<id>.*`; nobody here is a real member.
 * Every part of every template can be taken by at least two of them (the
 * sandbox test holds this), so the Connection step always has a choice.
 */
import type { ExhibitPerson } from '../types';

export const PEOPLE: readonly ExhibitPerson[] = [
  { id: 'noa', skills: ['ceramics', 'teaching', 'painting'], hue: 18 },
  { id: 'amir', skills: ['photo', 'video', 'tech', 'fixing'], hue: 205 },
  { id: 'lior', skills: ['community', 'events', 'writing', 'carpentry'], hue: 140 },
  { id: 'dana', skills: ['illustration', 'painting', 'design', 'sewing'], hue: 330 },
  { id: 'yossi', skills: ['carpentry', 'fixing', 'tech', 'teaching'], hue: 32 },
  { id: 'rana', skills: ['cooking', 'events', 'music'], hue: 8 },
  { id: 'tom', skills: ['music', 'video', 'community', 'marketing'], hue: 265 },
  { id: 'shira', skills: ['writing', 'marketing', 'cooking'], hue: 45 },
  { id: 'michal', skills: ['sewing', 'design', 'ceramics', 'photo'], hue: 300 }
];

export function personById(id: string): ExhibitPerson | undefined {
  return PEOPLE.find((p) => p.id === id);
}
