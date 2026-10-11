import { it, expect } from 'vitest';
import { moachBaseKey } from './moachRealtime.js';

it('moachBaseKey is a scheme-prefixed kit dependency', () => {
  expect(moachBaseKey(5)).toBe('app:moach:5');
});
