/**
 * ActionError lives in its own module so an action config can throw one.
 *
 * It used to be declared in ActionService.ts, which imports `./configs/index.js`
 * to register every action — so a config importing it from there was a cycle,
 * and configs threw plain `Error`s instead. ActionService turns a plain error
 * into `INTERNAL_ERROR` / "An unexpected error occurred" (the message survives
 * only in development), which is right for a crash and wrong for an answer the
 * client is meant to act on, like "the terms moved while you were reading".
 */

import type { ActionError as ActionErrorType } from './types.js';

export class ActionError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ActionError';
  }

  /**
   * Convert to ActionErrorType for response
   */
  toErrorObject(): ActionErrorType {
    return {
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}
