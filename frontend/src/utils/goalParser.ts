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

export function sanitizeJsonString(raw: string): string {
  let s = raw.trim();
  // Strip opening/closing code fence markers if passed with value
  s = s.replace(/^```+[a-zA-Z0-9_-]*\s*/, '').replace(/\s*```+$/, '');
  // Remove trailing commas before closing braces/brackets
  s = s.replace(/,\s*([}\]])/g, '$1');
  // Strip single-line JS comments (e.g. // comment)
  s = s.replace(/\/\/.*$/gm, '');
  // Fix unescaped backslashes (e.g. \Delta, \text, \lambda, etc.)
  s = s.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
  return s;
}

/**
 * Robustly parses a JSON string or raw text snippet into WeeklyTimetableData.
 * Returns null if the string cannot be parsed into a valid timetable.
 */
export function parseTimetableJson(rawJson: string): WeeklyTimetableData | null {
  if (!rawJson) return null;

  let parsed: any = null;
  const cleaned = sanitizeJsonString(rawJson);

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // If direct parse fails, try extracting the outermost JSON object
    const braceMatch = cleaned.match(/(\{[\s\S]*\})/);
    if (braceMatch) {
      try {
        parsed = JSON.parse(braceMatch[1]);
      } catch {
        try {
          parsed = JSON.parse(sanitizeJsonString(braceMatch[1]));
        } catch {
          return null;
        }
      }
    } else {
      return null;
    }
  }

  if (!parsed || !Array.isArray(parsed.schedule)) {
    return null;
  }

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

  return {
    title: parsed.title || '7-Day Multi-Goal Study Timetable',
    weekRange: parsed.weekRange || 'Monday – Sunday',
    totalDailyTime: parsed.totalDailyTime || parsed.dailyTime,
    goals: normalizedGoals,
    schedule: normalizedSchedule,
  };
}

/**
 * Robustly parses a JSON string or raw text snippet into GoalData.
 * Returns null if the string cannot be parsed into a valid single-goal plan.
 */
export function parseGoalCardJson(rawJson: string): GoalData | null {
  if (!rawJson) return null;

  let parsed: any = null;
  const cleaned = sanitizeJsonString(rawJson);

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const braceMatch = cleaned.match(/(\{[\s\S]*\})/);
    if (braceMatch) {
      try {
        parsed = JSON.parse(braceMatch[1]);
      } catch {
        try {
          parsed = JSON.parse(sanitizeJsonString(braceMatch[1]));
        } catch {
          return null;
        }
      }
    } else {
      return null;
    }
  }

  if (!parsed || !parsed.title || !Array.isArray(parsed.tasks)) {
    return null;
  }

  return {
    title: parsed.title,
    deadline: parsed.deadline,
    dailyTime: parsed.dailyTime,
    currentLevel: parsed.currentLevel,
    tasks: parsed.tasks.map((t: any, idx: number) => ({
      id: t.id || `task-${idx + 1}`,
      title: t.title || `Task ${idx + 1}`,
      estimatedTime: t.estimatedTime,
      outcome: t.outcome,
      day: t.day,
      topic: t.topic,
      completed: Boolean(t.completed),
    })),
  };
}

export function extractGoalData(text: string): ParsedMessageContent {
  if (!text) {
    return { cleanedText: '' };
  }

  let cleanedText = text;
  let extractedGoal: GoalData | undefined;
  let extractedTimetable: WeeklyTimetableData | undefined;

  // 1. TIMETABLE PARSING
  // Match standard ```timetable ... ```, multi-backtick, unclosed fences, or TIMETABLE header text
  const timetablePatterns = [
    // Standard or multi-backtick block with closing backticks
    /```+(?:timetable|weekly_timetable|schedule|json)?\s*(\{[\s\S]*?"schedule"[\s\S]*?\})\s*```+/i,
    // Unclosed timetable code block
    /```+(?:timetable|weekly_timetable|schedule)\s*(\{[\s\S]*?"schedule"[\s\S]*?\})(?:\s*```+|\s*$)/i,
    // UI-copied text: "TIMETABLE\n\nCopy\n{..."
    /(?:TIMETABLE\s+(?:Copy\s+)?)(\{[\s\S]*?"schedule"[\s\S]*?\})(?:\s*```+|\s*(?=\n\n\S|\n[A-Z💡🚀]|$))/i,
  ];

  for (const pattern of timetablePatterns) {
    const match = cleanedText.match(pattern);
    if (match) {
      const timetableData = parseTimetableJson(match[1]);
      if (timetableData) {
        extractedTimetable = timetableData;
        cleanedText = cleanedText.replace(match[0], '').trim();
        break;
      }
    }
  }

  // 2. GOAL_CARD PARSING
  const goalCardPatterns = [
    // Standard or multi-backtick block with closing backticks
    /```+(?:goal_card|goal|study_plan|json)?\s*(\{[\s\S]*?"tasks"[\s\S]*?\})\s*```+/i,
    // Unclosed goal_card code block
    /```+(?:goal_card|goal|study_plan)\s*(\{[\s\S]*?"tasks"[\s\S]*?\})(?:\s*```+|\s*$)/i,
  ];

  for (const pattern of goalCardPatterns) {
    const match = cleanedText.match(pattern);
    if (match) {
      const goalData = parseGoalCardJson(match[1]);
      if (goalData) {
        extractedGoal = goalData;
        cleanedText = cleanedText.replace(match[0], '').trim();
        break;
      }
    }
  }

  return {
    cleanedText,
    goalData: extractedGoal,
    timetableData: extractedTimetable,
  };
}
