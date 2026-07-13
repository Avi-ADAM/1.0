import type { ConsentEvent } from '../event';
import type { ProjectState } from '../projection';
import { tosplitCreate } from './tosplitCreate';
import { tosplitVote } from './tosplitVote';
import { projectJoin } from './projectJoin';
import { projectLeave } from './projectLeave';
import { proposalCounter } from './proposalCounter';
import { consensusTimeout } from './consensusTimeout';
import { missionApprove } from './missionApprove';
import { snapshotCommit } from './snapshotCommit';
import { saleRecord } from './saleRecord';
import { decisionVote } from './decisionVote';
import { missionCreate } from './missionCreate';
import { missionComplete } from './missionComplete';
import { stageVote } from './stageVote';
import { halukaCreate, halukaApprove, halukaConfirm } from './haluka';
import { decisionCreate } from './decisionCreate';
import { timeTick } from './timeTick';
import { forumCreate, messagePost } from './forum';
import { payloadRedact } from './payloadRedact';
import { meetingCreate, meetingApprove } from './meeting';
import { projectCreate, projectAmend, memberAway } from './projectMeta';

export type Reducer = (state: ProjectState, ev: ConsentEvent) => ProjectState;

// S2b (HANDOFF T4): every category-A action has a reducer. `epoch.rotate`
// deliberately has none — epochs are transport-layer state, not ProjectState.
export const reducers: Record<string, Reducer> = {
  'tosplit.create':       tosplitCreate,
  'tosplit.vote':         tosplitVote,
  'project.create':       projectCreate,
  'project.join':         projectJoin,
  'project.leave':        projectLeave,
  'project.amend':        projectAmend,
  'member.away':          memberAway,
  'proposal.counter':     proposalCounter,
  'consensus.timeout':    consensusTimeout,
  'mission.create':       missionCreate,
  'mission.complete':     missionComplete,
  'mission.approve':      missionApprove,
  'mission.approve.vote': stageVote,
  'pendm.vote':           stageVote,
  'sheirutpend.vote':     stageVote,
  'ask.vote':             stageVote,
  'haluka.create':        halukaCreate,
  'haluka.approve':       halukaApprove,
  'haluka.confirm':       halukaConfirm,
  'decision.create':      decisionCreate,
  'decision.vote':        decisionVote,
  'time.tick':            timeTick,
  'forum.create':         forumCreate,
  'message.post':         messagePost,
  'payload.redact':       payloadRedact,
  'pgisha.create':        meetingCreate,
  'pgisha.approve':       meetingApprove,
  'snapshot.commit':      snapshotCommit,
  // T10: snapshot maturation rides the generic stage tally (unanimity) and
  // the rounds machinery (consensus.timeout for silence-is-consent).
  'snapshot.vote':        stageVote,
  'sale.record':          saleRecord
};
