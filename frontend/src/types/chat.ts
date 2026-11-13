export interface GoalTask {
  id: string;
  title: string;
  estimatedTime?: string;
  outcome?: string;
  completed: boolean;
  day?: string;
  topic?: string;
}

export interface GoalData {
  title: string;
  deadline?: string;
  dailyTime?: string;
  currentLevel?: string;
  tasks: GoalTask[];
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  goalData?: GoalData;
}

export type SuggestedPrompt = string;
