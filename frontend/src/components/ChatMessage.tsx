import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, User, Copy, Check } from 'lucide-react';
import type { Message } from '../types/chat';
import { GoalCard } from './GoalCard';
import { WeeklyTimetable } from './WeeklyTimetable';
import { CodeBlock } from './CodeBlock';
import { extractGoalData } from '../utils/goalParser';

interface ChatMessageProps {
  message: Message;
  onToggleTask?: (messageId: string, taskId: string) => void;
  onToggleTimetableSlot?: (messageId: string, slotId: string) => void;
  onReportProgress?: (taskTitle: string) => void;
  onRequestAdjustment?: (context?: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onToggleTask,
  onToggleTimetableSlot,
  onReportProgress,
  onRequestAdjustment,
}) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);

  const { cleanedText, goalData: extractedGoal, timetableData: extractedTimetable } = extractGoalData(message.text);
  const activeGoalData = message.goalData || extractedGoal;
  const activeTimetableData = message.timetableData || extractedTimetable;
  const displayText = (activeGoalData || activeTimetableData) ? cleanedText : message.text;

  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat([], {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  const handleCopy = async () => {
    try {
      let textToCopy = displayText;
      if (activeTimetableData) {
        textToCopy = `${displayText}\n\n**Weekly Timetable: ${activeTimetableData.title}** (${activeTimetableData.weekRange || ''})\n` +
          activeTimetableData.schedule
            .map((s) => `- [${s.completed ? 'x' : ' '}] **${s.day}** [${s.timeSlot}] (${s.goalTitle}): ${s.taskTitle} (${s.duration || ''})`)
            .join('\n');
      } else if (activeGoalData) {
        const tasksSummary = activeGoalData.tasks
          .map(
            (t, i) =>
              `${i + 1}. [${t.completed ? 'x' : ' '}] ${t.day ? `[${t.day}] ` : ''}${t.title} (${t.estimatedTime || ''}) - Outcome: ${t.outcome || ''}`
          )
          .join('\n');
        textToCopy = `${displayText}\n\n**Goal: ${activeGoalData.title}**\n${tasksSummary}`;
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className={`message-wrapper ${isUser ? 'user-wrapper' : 'ai-wrapper'}`}>
      <div className={`avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`} aria-label={isUser ? 'You' : 'TinySteps AI'}>
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>

      <div className="bubble-container">
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
          {isUser ? (
            <div className="message-content user-text">{message.text}</div>
          ) : (
            <div className="message-content ai-markdown">
              {displayText && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');
                      const isMultiLine = codeString.includes('\n');

                      if (match || isMultiLine) {
                        return (
                          <CodeBlock
                            language={match ? match[1] : undefined}
                            value={codeString}
                            onToggleTimetableSlot={
                              onToggleTimetableSlot
                                ? (slotId) => onToggleTimetableSlot(message.id, slotId)
                                : undefined
                            }
                            onToggleTask={
                              onToggleTask
                                ? (taskId) => onToggleTask(message.id, taskId)
                                : undefined
                            }
                            onReportProgress={onReportProgress}
                            onRequestAdjustment={onRequestAdjustment}
                          />
                        );
                      }

                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    table({ children }) {
                      return (
                        <div className="table-responsive-wrapper">
                          <table className="student-table">{children}</table>
                        </div>
                      );
                    },
                  }}
                >
                  {displayText}
                </ReactMarkdown>
              )}

              {/* Interactive Multi-Day Single Goal Card */}
              {activeGoalData && (
                <GoalCard
                  goal={activeGoalData}
                  onToggleTask={
                    onToggleTask ? (taskId) => onToggleTask(message.id, taskId) : undefined
                  }
                  onReportProgress={onReportProgress}
                  onRequestAdjustment={onRequestAdjustment}
                />
              )}

              {/* Interactive Multi-Goal Weekly Timetable */}
              {activeTimetableData && (
                <WeeklyTimetable
                  timetable={activeTimetableData}
                  onToggleSlot={
                    onToggleTimetableSlot
                      ? (slotId) => onToggleTimetableSlot(message.id, slotId)
                      : undefined
                  }
                  onReportProgress={onReportProgress}
                  onRequestAdjustment={onRequestAdjustment}
                />
              )}
            </div>
          )}
        </div>

        <div className={`message-meta ${isUser ? 'user-meta' : 'ai-meta'}`}>
          <span className="timestamp">{formatTime(message.timestamp)}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="copy-btn"
              title="Copy message to clipboard"
              aria-label="Copy message"
            >
              {copied ? (
                <>
                  <Check size={12} className="copy-icon checked" />
                  <span className="copy-label">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} className="copy-icon" />
                  <span className="copy-label">Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
