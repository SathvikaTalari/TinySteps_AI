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

export interface TimetableSlot {
  id: string;
  day: string; // e.g. "Monday", "Tuesday", "Day 1"
  timeSlot: string; // e.g. "09:00 - 09:45 AM", "Morning", "Evening"
  goalTitle: string; // Target goal/subject (e.g. "Calculus", "Web Development")
  goalColor?: string; // Optional hex or CSS badge color
  taskTitle: string; // Specific micro-task
  duration?: string; // e.g. "45 mins"
  outcome?: string; // Clear deliverable
  completed: boolean;
}

export interface TimetableGoalSummary {
  id: string;
  name: string;
  color?: string;
  weeklyTarget?: string;
}

export interface WeeklyTimetableData {
  title: string; // e.g. "7-Day Multi-Goal Study Timetable"
  weekRange?: string; // e.g. "Monday – Sunday"
  totalDailyTime?: string; // e.g. "2.5 hrs/day"
  goals: TimetableGoalSummary[];
  schedule: TimetableSlot[];
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  goalData?: GoalData;
  timetableData?: WeeklyTimetableData;
}

export type SuggestedPrompt = string;
