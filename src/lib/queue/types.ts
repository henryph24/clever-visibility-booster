import { LLMProvider } from '../llm/types';

export interface LLMQueryJobData {
  brandId: string;
  promptIds: string[];
  providers: LLMProvider[];
}

export interface MetricsJobData {
  brandId: string;
  date: string;
}

export interface JobStatus {
  id: string;
  status: string;
  progress: number;
  failedReason?: string;
  completedAt?: Date;
}
