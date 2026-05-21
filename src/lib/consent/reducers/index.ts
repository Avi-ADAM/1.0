import type { ConsentEvent } from '../event';
import type { ProjectState } from '../projection';
import { tosplitCreate } from './tosplitCreate';
import { tosplitVote } from './tosplitVote';
import { projectJoin } from './projectJoin';
import { projectLeave } from './projectLeave';

export type Reducer = (state: ProjectState, ev: ConsentEvent) => ProjectState;

export const reducers: Record<string, Reducer> = {
  'tosplit.create': tosplitCreate,
  'tosplit.vote':   tosplitVote,
  'project.join':   projectJoin,
  'project.leave':  projectLeave
};
