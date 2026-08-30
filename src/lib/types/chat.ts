export type Role = 'user' | 'assistant';

export interface VotingProps {
  proposal: string;
  options: string[];
  deadline: string;
  partnership: string;
}

export interface PartnershipData {
  name: string;
  stake: string;
  value: string;
  trend: 'up' | 'down';
  change: string;
  members: number;
}

export interface MissionInfo {
  id: string;
  name: string;
  projectName: string;
  action: 'start_timer' | 'stop_timer';
}

export interface TimerEditProps {
  missionId: string;
  missionName: string;
  timerId: string;
  projectId: string;
  intervals: { start: string; stop?: string | null }[];
}

export interface ChatComponent {
  // `timer_edit` and `product_list` were rendered by MessageRenderer but were
  // missing from this union, so the type said the timer card could not exist.
  type: 'voting' | 'summary' | 'proposal' | 'mission_list' | 'timer_edit' | 'product_list';
  props:
    | VotingProps
    | { partnerships: PartnershipData[] }
    | { missions: MissionInfo[] }
    | TimerEditProps
    | Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  time: string;
  components?: ChatComponent[];
}
