/**
 * Action Configuration Index
 * 
 * This file imports and registers all action configurations.
 * Actions are registered at module load time.
 */

import { registerAction } from '../registry.js';
import { updateTaskAction } from './updateTask.js';
import { approveHalukaConfig } from './approveHaluka.js';
import { createHalukaConfig } from './createHaluka.js';
import { createTosplitConfig } from './createTosplit.js';
import { createSheirutpendConfig } from './createSheirutpend.js';
import { createNewMeetingConfig } from './createNewMeeting.js';
import { approveMeetingConfig } from './approveMeeting.js';
import { toggleOnlineConfig } from './toggleOnline.js';
import { startMeetingConfig } from './startMeeting.js';
import { joinMeetingConfig } from './joinMeeting.js';
import { sendMeetingMessageConfig } from './sendMeetingMessage.js';
import { sendAskMessageConfig } from './sendAskMessage.js';
import { timerStartConfig } from './timerStart.js';
import { timerStopConfig } from './timerStop.js';
import { timerSaveConfig } from './timerSave.js';
import { approveSheirutpendConfig } from './approveSheirutpend.js';
import { rejectSheirutpendConfig } from './rejectSheirutpend.js';
import { addVoteConfig } from './addVote.js';

/**
 * Register all actions
 * 
 * This function is called automatically when the module is imported.
 * It registers all action configurations with the action registry.
 */
export function registerAllActions(): void {
  // Register all actions
  registerAction(updateTaskAction);
  registerAction(approveHalukaConfig);
  registerAction(createHalukaConfig);
  registerAction(createTosplitConfig);
  registerAction(createSheirutpendConfig);
  registerAction(createNewMeetingConfig);
  registerAction(approveMeetingConfig);
  registerAction(toggleOnlineConfig);
  registerAction(startMeetingConfig);
  registerAction(joinMeetingConfig);
  registerAction(sendMeetingMessageConfig);
  registerAction(sendAskMessageConfig);

  // Timer actions
  registerAction(timerStartConfig);
  registerAction(timerStopConfig);
  registerAction(timerSaveConfig);

  // Sheirutpend actions
  registerAction(approveSheirutpendConfig);
  registerAction(rejectSheirutpendConfig);
  registerAction(addVoteConfig);

  // Future actions will be registered here
  // registerAction(createTaskAction);
  // etc.
}

// Auto-register actions when module is imported
registerAllActions();

// Export individual actions for testing
export {
  updateTaskAction,
  approveHalukaConfig,
  createHalukaConfig,
  createTosplitConfig,
  approveMeetingConfig,
  toggleOnlineConfig,
  startMeetingConfig,
  joinMeetingConfig,
  sendMeetingMessageConfig,
  sendAskMessageConfig,
  timerStartConfig,
  timerStopConfig,
  timerSaveConfig,
  approveSheirutpendConfig,
  rejectSheirutpendConfig,
  addVoteConfig
};
