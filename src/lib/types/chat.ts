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

export interface ChatComponent {
  type: 'voting' | 'summary' | 'proposal' | 'mission_list';
  props: VotingProps | { partnerships: PartnershipData[] } | { missions: MissionInfo[] } | Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  time: string;
  components?: ChatComponent[];
}
