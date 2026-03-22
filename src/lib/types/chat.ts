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

export interface ChatComponent {
  type: 'voting' | 'summary' | 'proposal';
  props: VotingProps | { partnerships: PartnershipData[] } | Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  time: string;
  components?: ChatComponent[];
}
