/**
 * Every shift action, in one list (docs/PLAN_SHIFTS.md §8).
 *
 * Registered together from index.ts so adding a shift action touches this
 * file and its own, never the shared registration list.
 */

import type { ActionConfig } from '../types.js';
import { declareShiftAvailabilityConfig } from './declareShiftAvailability.js';
import {
  claimShiftHoleConfig,
  getShiftWorkConfig,
  releaseShiftAssignmentConfig,
  reopenForShiftHoleConfig
} from './shiftCardActions.js';
import { decideShiftSwapConfig, proposeShiftSwapConfig } from './shiftSwapActions.js';
import { linkShiftTimerConfig, logShiftHoursConfig } from './shiftHoursActions.js';

export const shiftActionConfigs: ActionConfig[] = [
  declareShiftAvailabilityConfig,
  getShiftWorkConfig,
  releaseShiftAssignmentConfig,
  claimShiftHoleConfig,
  reopenForShiftHoleConfig,
  proposeShiftSwapConfig,
  decideShiftSwapConfig,
  linkShiftTimerConfig,
  logShiftHoursConfig
];
