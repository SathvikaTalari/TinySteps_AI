import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { MermaidDiagram } from './MermaidDiagram';
import { WeeklyTimetable } from './WeeklyTimetable';
import { GoalCard } from './GoalCard';
import { parseTimetableJson, parseGoalCardJson } from '../utils/goalParser';

interface CodeBlockProps {
  language?: string;
  value: string;
  onToggleTimetableSlot?: (slotId: string) => void;
  onToggleTask?: (taskId: string) => void;
  onReportProgress?: (taskTitle: string) => void;
  onRequestAdjustment?: (context?: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  value,
  onToggleTimetableSlot,
  onToggleTask,
  onReportProgress,
  onRequestAdjustment,
}) => {
  const [copied, setCopied] = useState(false);
  const normalizedLang = (language || '').toLowerCase().trim();

  // 1. Mermaid diagram block
  if (normalizedLang === 'mermaid') {
    return <MermaidDiagram chart={value} />;
  }

  // 2. Weekly Timetable block (never show raw JSON code!)
  const isTimetableCandidate =
    normalizedLang === 'timetable' ||
    normalizedLang === 'weekly_timetable' ||
    normalizedLang === 'schedule' ||
    ((normalizedLang === 'json' || !normalizedLang) && value.includes('"schedule"'));

  if (isTimetableCandidate) {
    const timetableData = parseTimetableJson(value);
    if (timetableData) {
      return (
        <div className="timetable-codeblock-container my-4">
          <WeeklyTimetable
            timetable={timetableData}
            onToggleSlot={onToggleTimetableSlot}
            onReportProgress={onReportProgress}
            onRequestAdjustment={onRequestAdjustment}
          />
        </div>
      );
    }
  }

  // 3. Single-Goal Study Plan Card block
  const isGoalCandidate =
    normalizedLang === 'goal_card' ||
    normalizedLang === 'goal' ||
    normalizedLang === 'study_plan' ||
    ((normalizedLang === 'json' || !normalizedLang) && value.includes('"tasks"'));

  if (isGoalCandidate) {
    const goalData = parseGoalCardJson(value);
    if (goalData) {
      return (
        <div className="goalcard-codeblock-container my-4">
          <GoalCard
            goal={goalData}
            onToggleTask={onToggleTask}
            onReportProgress={onReportProgress}
            onRequestAdjustment={onRequestAdjustment}
          />
        </div>
      );
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const displayLang = language ? language.toUpperCase() : 'CODE';

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <div className="code-lang-tag">
          <Terminal size={12} className="code-terminal-icon" />
          <span>{displayLang}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="code-copy-btn"
          title="Copy code to clipboard"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="copy-icon-success" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-pre">
        <code>{value}</code>
      </pre>
    </div>
  );
};
