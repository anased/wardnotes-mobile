// Type definitions for Learning Questions feature
// Mirrors the web app's API types

export interface LearningQuestionsRequest {
  clinicalContext: string;
  questions: string[];
}

export interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface LearningQuestionsResponse {
  answers: QuestionAnswer[];
  metadata: {
    generationTime: number;
    questionCount: number;
  };
  quota: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export type LearningQuestionsStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LearningQuestionsError {
  message: string;
  type: 'network' | 'quota_exceeded' | 'validation' | 'api' | 'unknown';
  retryable: boolean;
  status?: number;
  quota?: {
    used: number;
    limit: number;
    remaining: number;
  };
}
