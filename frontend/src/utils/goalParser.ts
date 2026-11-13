import type { GoalData } from '../types/chat';

export interface ParsedMessageContent {
  cleanedText: string;
  goalData?: GoalData;
}

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

  // Look for ```goal_card ... ``` block
  const goalCardRegex = /```(?:goal_card|json)?\s*(\{[\s\S]*?"tasks"[\s\S]*?\})\s*```/i;
  const match = text.match(goalCardRegex);

  if (!match) {
    return { cleanedText: text };
  }

  try {
    const rawJsonStr = match[1].trim();
    let parsed: GoalData | null = null;

    try {
      parsed = JSON.parse(rawJsonStr);
    } catch {
      // Try sanitized version with escaped backslashes and trimmed trailing commas
      const sanitized = sanitizeJsonString(rawJsonStr);
      parsed = JSON.parse(sanitized);
    }

    if (parsed && parsed.title && Array.isArray(parsed.tasks)) {
      // Ensure each task has id, title, completed boolean, day, topic
      parsed.tasks = parsed.tasks.map((t, idx) => ({
        id: t.id || `task-${idx + 1}`,
        title: t.title || `Task ${idx + 1}`,
        estimatedTime: t.estimatedTime,
        outcome: t.outcome,
        day: t.day,
        topic: t.topic,
        completed: Boolean(t.completed),
      }));

      // Clean up the code block from the displayed markdown prose
      const cleanedText = text.replace(goalCardRegex, '').trim();
      return {
        cleanedText,
        goalData: parsed,
      };
    }
  } catch (err) {
    console.warn('Could not parse goal_card JSON block:', err);
  }

  return { cleanedText: text };
}
