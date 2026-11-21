import type { GoalData, WeeklyTimetableData, TimetableSlot, TimetableGoalSummary } from '../types/chat';

export interface ParsedMessageContent {
  cleanedText: string;
  goalData?: GoalData;
  timetableData?: WeeklyTimetableData;
}

const DEFAULT_GOAL_COLORS = [
  '#7C3AED', // Vivid Purple
  '#2563EB', // Royal Blue
  '#059669', // Emerald Green
  '#D97706', // Warm Amber
  '#DB2777', // Rose Pink
  '#0891B2', // Cyan
  '#4F46E5', // Indigo
];

function sanitizeJsonString(raw: string): string {
  // Remove trailing commas before closing braces/brackets
  let s = raw.replace(/,\s*([}\]])/g, '$1');
  // Fix unescaped backslashes (e.g. \Delta, \text, etc. common in study topics)
  s = s.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
  return s;
}

export function extractGoalData(text: string): ParsedMessageContent {
  if (!text) {
    return { cleanedText: '' };
  }

  let cleanedText = text;
  let extractedGoal: GoalData | undefined;
  let extractedTimetable: WeeklyTimetableData | undefined;

  // 1. Look for ```timetable ... ``` or ```weekly_timetable ... ``` block
  const timetableRegex = /```(?:timetable|weekly_timetable|json)?\s*(\{[\s\S]*?"schedule"[\s\S]*?\})\s*```/i;
  const timetableMatch = cleanedText.match(timetableRegex);

  if (timetableMatch) {
    try {
      const rawJson = timetableMatch[1].trim();
      let parsed: any = null;
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        parsed = JSON.parse(sanitizeJsonString(rawJson));
      }

      if (parsed && Array.isArray(parsed.schedule)) {
        // Map of goal names to colors
        const goalColorMap = new Map<string, string>();

        const normalizedGoals: TimetableGoalSummary[] = Array.isArray(parsed.goals)
          ? parsed.goals.map((g: any, idx: number) => {
              const name = String(g.name || g.title || `Goal ${idx + 1}`);
              const color = g.color || DEFAULT_GOAL_COLORS[idx % DEFAULT_GOAL_COLORS.length];
              goalColorMap.set(name.toLowerCase(), color);
              return {
                id: String(g.id || `g-${idx + 1}`),
                name,
                color,
                weeklyTarget: g.weeklyTarget || g.targetHours,
              };
            })
          : [];

        // Build goals list from schedule if missing
        if (normalizedGoals.length === 0) {
          const uniqueGoals = Array.from(new Set(parsed.schedule.map((s: any) => s.goalTitle || s.goal || 'General')));
          uniqueGoals.forEach((name, idx) => {
            const color = DEFAULT_GOAL_COLORS[idx % DEFAULT_GOAL_COLORS.length];
            goalColorMap.set(String(name).toLowerCase(), color);
            normalizedGoals.push({
              id: `g-${idx + 1}`,
              name: String(name),
              color,
            });
          });
        }

        const normalizedSchedule: TimetableSlot[] = parsed.schedule.map((s: any, idx: number) => {
          const goalTitle = String(s.goalTitle || s.goal || 'General');
          const matchedColor = goalColorMap.get(goalTitle.toLowerCase()) || DEFAULT_GOAL_COLORS[idx % DEFAULT_GOAL_COLORS.length];
          return {
            id: String(s.id || `slot-${idx + 1}`),
            day: String(s.day || 'Monday'),
            timeSlot: String(s.timeSlot || s.time || 'Morning'),
            goalTitle,
            goalColor: s.goalColor || matchedColor,
            taskTitle: String(s.taskTitle || s.title || `Task ${idx + 1}`),
            duration: s.duration || s.estimatedTime || '30 mins',
            outcome: s.outcome,
            completed: Boolean(s.completed),
          };
        });

        extractedTimetable = {
          title: parsed.title || '7-Day Multi-Goal Study Timetable',
          weekRange: parsed.weekRange || 'Monday – Sunday',
          totalDailyTime: parsed.totalDailyTime || parsed.dailyTime,
          goals: normalizedGoals,
          schedule: normalizedSchedule,
        };

        cleanedText = cleanedText.replace(timetableRegex, '').trim();
      }
    } catch (err) {
      console.warn('Could not parse timetable JSON block:', err);
    }
  }

  // 2. Look for ```goal_card ... ``` block
  const goalCardRegex = /```(?:goal_card|json)?\s*(\{[\s\S]*?"tasks"[\s\S]*?\})\s*```/i;
  const goalMatch = cleanedText.match(goalCardRegex);

  if (goalMatch) {
    try {
      const rawJsonStr = goalMatch[1].trim();
      let parsed: GoalData | null = null;

      try {
        parsed = JSON.parse(rawJsonStr);
      } catch {
        parsed = JSON.parse(sanitizeJsonString(rawJsonStr));
      }

      if (parsed && parsed.title && Array.isArray(parsed.tasks)) {
        parsed.tasks = parsed.tasks.map((t, idx) => ({
          id: t.id || `task-${idx + 1}`,
          title: t.title || `Task ${idx + 1}`,
          estimatedTime: t.estimatedTime,
          outcome: t.outcome,
          day: t.day,
          topic: t.topic,
          completed: Boolean(t.completed),
        }));

        cleanedText = cleanedText.replace(goalCardRegex, '').trim();
        extractedGoal = parsed;
      }
    } catch (err) {
      console.warn('Could not parse goal_card JSON block:', err);
    }
  }

  return {
    cleanedText,
    goalData: extractedGoal,
    timetableData: extractedTimetable,
  };
}
