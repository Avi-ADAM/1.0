export interface ProcessContext {
  processId: string;
  mainForumId: string;
  projectId: string;
  name: string;
  description?: string;
}

export interface ProcessTimelineItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt?: string | null;
  meta?: Record<string, any>;
}

export interface ProcessStageGroup {
  key: string;
  label: string;
  items: ProcessTimelineItem[];
}

export interface ProcessViewModel {
  id: string;
  projectId: string;
  title: string;
  description: string;
  mainForumId: string;
  updatedAt?: string | null;
  stageCounts: Record<string, number>;
  stages: ProcessStageGroup[];
  nextExpectedStage: string;
}
