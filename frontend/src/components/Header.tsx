import React, { useState } from 'react';
import { Sparkles, Trash2, Check, X, Target, CalendarRange, Sun, Moon } from 'lucide-react';
import type { GoalData, WeeklyTimetableData } from '../types/chat';

interface HeaderProps {
  onClearChat: () => void;
  messageCount: number;
  activeGoal?: GoalData | null;
  activeTimetable?: WeeklyTimetableData | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onClearChat,
  messageCount,
  activeGoal,
  activeTimetable,
  theme,
  onToggleTheme,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmClear = () => {
    onClearChat();
    setShowConfirm(false);
  };

  const completedCount = activeGoal?.tasks.filter((t) => t.completed).length ?? 0;
  const totalCount = activeGoal?.tasks.length ?? 0;

  const timetableCompletedCount = activeTimetable?.schedule.filter((s) => s.completed).length ?? 0;
  const timetableTotalCount = activeTimetable?.schedule.length ?? 0;

  return (
    <header className="chat-header">
      <div className="header-left">
        <div className="brand-icon-wrapper">
          <Sparkles className="brand-icon" size={22} />
        </div>
        <div className="brand-info">
          <div className="title-row">
            <h1 className="brand-title">TinySteps AI</h1>
            <span className="online-badge">
              <span className="online-dot"></span>
              Online
            </span>
            {activeTimetable ? (
              <span className="header-goal-badge" title={`Active Timetable: ${activeTimetable.title}`}>
                <CalendarRange size={11} />
                <span className="header-goal-text">{activeTimetable.title}</span>
                <span className="header-goal-progress">({timetableCompletedCount}/{timetableTotalCount})</span>
              </span>
            ) : activeGoal ? (
              <span className="header-goal-badge" title={`Active Goal: ${activeGoal.title}`}>
                <Target size={11} />
                <span className="header-goal-text">{activeGoal.title}</span>
                <span className="header-goal-progress">({completedCount}/{totalCount})</span>
              </span>
            ) : null}
          </div>
          <p className="brand-tagline">Personalized Student Goal Coach</p>
        </div>
      </div>

      <div className="header-right">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="theme-toggle-btn"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={16} className="theme-icon sun" />
          ) : (
            <Moon size={16} className="theme-icon moon" />
          )}
          <span className="theme-toggle-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {showConfirm ? (
          <div className="clear-confirm-bar" role="alert">
            <span className="confirm-text">Clear chat?</span>
            <button
              onClick={handleConfirmClear}
              className="confirm-btn confirm-yes"
              title="Yes, clear history"
              aria-label="Confirm clear chat"
            >
              <Check size={14} />
              <span>Yes</span>
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="confirm-btn confirm-no"
              title="Cancel"
              aria-label="Cancel clear chat"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="clear-chat-btn"
            title="Clear conversation history and active goal"
            aria-label="Clear chat history"
            disabled={messageCount <= 1 && !activeGoal && !activeTimetable}
          >
            <Trash2 size={16} />
            <span className="clear-btn-text">Clear Chat</span>
          </button>
        )}
      </div>
    </header>
  );
};
