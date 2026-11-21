import React, { useState, useMemo } from 'react';
import type { WeeklyTimetableData, TimetableSlot } from '../types/chat';
import {
  CalendarRange,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  LayoutGrid,
  Calendar,
  Layers,
  Sliders,
  Copy,
  Check,
  Target,
  Award
} from 'lucide-react';

interface WeeklyTimetableProps {
  timetable: WeeklyTimetableData;
  onToggleSlot?: (slotId: string) => void;
  onReportProgress?: (taskTitle: string) => void;
  onRequestAdjustment?: (context?: string) => void;
  readOnly?: boolean;
}

type ViewMode = 'grid' | 'day' | 'goal';

const ORDERED_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  timetable,
  onToggleSlot,
  onReportProgress,
  onRequestAdjustment,
  readOnly = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string | null>(null);
  const [activeDayTab, setActiveDayTab] = useState<string>('Monday');
  const [activeGoalTab, setActiveGoalTab] = useState<string>(
    timetable.goals[0]?.name || ''
  );
  const [copied, setCopied] = useState(false);

  const totalSlots = timetable.schedule.length;
  const completedSlots = timetable.schedule.filter((s) => s.completed).length;
  const percentComplete = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;
  const isAllComplete = totalSlots > 0 && completedSlots === totalSlots;

  // Filter schedule if a goal filter is selected
  const filteredSchedule = useMemo(() => {
    if (!selectedGoalFilter) return timetable.schedule;
    return timetable.schedule.filter(
      (s) => s.goalTitle.toLowerCase() === selectedGoalFilter.toLowerCase()
    );
  }, [timetable.schedule, selectedGoalFilter]);

  // Group slots by Day
  const slotsByDay = useMemo(() => {
    const map: { [day: string]: TimetableSlot[] } = {};

    // First populate ordered days
    ORDERED_DAYS.forEach((d) => {
      map[d] = [];
    });

    // Populate actual slots
    filteredSchedule.forEach((slot) => {
      // Find matching standard day or use slot.day as-is
      const matchedStandard = ORDERED_DAYS.find(
        (od) => od.toLowerCase() === slot.day.trim().toLowerCase()
      );
      const dayKey = matchedStandard || slot.day.trim();
      if (!map[dayKey]) {
        map[dayKey] = [];
      }
      map[dayKey].push(slot);
    });

    // Return entries that have slots, preserving ORDERED_DAYS priority
    const result: { day: string; slots: TimetableSlot[] }[] = [];
    ORDERED_DAYS.forEach((d) => {
      if (map[d] && map[d].length > 0) {
        result.push({ day: d, slots: map[d] });
      }
    });

    // Add any non-standard days (e.g. "Day 1", "Day 2")
    Object.keys(map).forEach((d) => {
      if (!ORDERED_DAYS.includes(d) && map[d].length > 0) {
        result.push({ day: d, slots: map[d] });
      }
    });

    return result;
  }, [filteredSchedule]);

  // Set initial activeDayTab to the first available day if Monday is empty
  useMemo(() => {
    if (slotsByDay.length > 0 && !slotsByDay.some((s) => s.day === activeDayTab)) {
      setActiveDayTab(slotsByDay[0].day);
    }
  }, [slotsByDay, activeDayTab]);

  // Copy full timetable to clipboard in Markdown table format
  const handleCopyTimetable = async () => {
    try {
      let md = `### 📅 ${timetable.title}\n`;
      if (timetable.weekRange) md += `**Week:** ${timetable.weekRange} | `;
      if (timetable.totalDailyTime) md += `**Daily Time:** ${timetable.totalDailyTime}\n\n`;

      md += `| Day | Time Slot | Goal / Subject | Task & Topic | Est. Time | Status |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

      timetable.schedule.forEach((s) => {
        const status = s.completed ? '✅ Done' : '⏳ Pending';
        md += `| **${s.day}** | ${s.timeSlot} | ${s.goalTitle} | ${s.taskTitle} | ${s.duration || ''} | ${status} |\n`;
      });

      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className={`timetable-card-widget ${isAllComplete ? 'timetable-all-complete' : ''}`}>
      {/* Header */}
      <div className="timetable-header">
        <div className="timetable-title-wrapper">
          <div className="timetable-badge-icon">
            {isAllComplete ? <Award size={20} className="award-icon" /> : <CalendarRange size={20} />}
          </div>
          <div>
            <div className="timetable-subheading-row">
              <span className="timetable-subheading">Multi-Goal Weekly Schedule</span>
              {timetable.weekRange && (
                <span className="timetable-week-range">{timetable.weekRange}</span>
              )}
            </div>
            <h3 className="timetable-title">{timetable.title}</h3>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="timetable-header-actions">
          {timetable.totalDailyTime && (
            <span className="timetable-pill timetable-pill-time" title="Average Daily Study Time">
              <Clock size={12} />
              <span>{timetable.totalDailyTime}</span>
            </span>
          )}

          <button
            type="button"
            className="timetable-copy-btn"
            onClick={handleCopyTimetable}
            title="Copy timetable to clipboard"
          >
            {copied ? (
              <>
                <Check size={12} className="copy-icon-success" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy Timetable</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Multi-Goal Subject Pills (Filterable) */}
      {timetable.goals && timetable.goals.length > 0 && (
        <div className="timetable-goals-filter-bar">
          <span className="filter-label">Goals:</span>
          <button
            type="button"
            className={`goal-tag-pill ${selectedGoalFilter === null ? 'active' : ''}`}
            onClick={() => setSelectedGoalFilter(null)}
          >
            <span className="goal-dot" style={{ backgroundColor: 'var(--lavender-accent)' }}></span>
            <span>All Goals ({totalSlots})</span>
          </button>

          {timetable.goals.map((g) => {
            const isSelected = selectedGoalFilter?.toLowerCase() === g.name.toLowerCase();
            const goalCount = timetable.schedule.filter(
              (s) => s.goalTitle.toLowerCase() === g.name.toLowerCase()
            ).length;
            const goalColor = g.color || 'var(--lavender-accent)';

            return (
              <button
                key={g.id || g.name}
                type="button"
                className={`goal-tag-pill ${isSelected ? 'active' : ''}`}
                style={{
                  borderColor: isSelected ? goalColor : undefined,
                  backgroundColor: isSelected ? `${goalColor}18` : undefined,
                }}
                onClick={() => setSelectedGoalFilter(isSelected ? null : g.name)}
                title={`Filter by ${g.name} (${goalCount} sessions)`}
              >
                <span className="goal-dot" style={{ backgroundColor: goalColor }}></span>
                <span className="goal-tag-name">{g.name}</span>
                <span className="goal-tag-count">({goalCount})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Progress Bar */}
      <div className="timetable-progress-section">
        <div className="timetable-progress-labels">
          <span className="progress-text">
            <strong>{completedSlots}</strong> of <strong>{totalSlots}</strong> weekly study sessions completed
          </span>
          <span className="progress-percent">{percentComplete}%</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="progress-fill timetable-progress-fill"
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>

        {isAllComplete && (
          <div className="timetable-celebration-banner">
            <Sparkles size={14} />
            <span>Outstanding consistency! You completed all weekly study sessions across all goals! 🎉</span>
          </div>
        )}
      </div>

      {/* View Switcher: Weekly Grid vs Day Agenda vs By Goal */}
      <div className="timetable-view-switcher">
        <button
          type="button"
          className={`view-tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
        >
          <LayoutGrid size={13} />
          <span>Weekly Grid</span>
        </button>
        <button
          type="button"
          className={`view-tab-btn ${viewMode === 'day' ? 'active' : ''}`}
          onClick={() => setViewMode('day')}
        >
          <Calendar size={13} />
          <span>Day-by-Day Agenda</span>
        </button>
        <button
          type="button"
          className={`view-tab-btn ${viewMode === 'goal' ? 'active' : ''}`}
          onClick={() => setViewMode('goal')}
        >
          <Layers size={13} />
          <span>By Goal Breakdown</span>
        </button>
      </div>

      {/* VIEW MODE 1: WEEKLY GRID */}
      {viewMode === 'grid' && (
        <div className="timetable-grid-container">
          {slotsByDay.map(({ day, slots }) => {
            const dayDoneCount = slots.filter((s) => s.completed).length;
            const isDayFinished = slots.length > 0 && dayDoneCount === slots.length;

            return (
              <div key={day} className={`timetable-day-col ${isDayFinished ? 'day-finished' : ''}`}>
                <div className="day-col-header">
                  <span className="day-col-name">{day}</span>
                  <span className={`day-col-badge ${isDayFinished ? 'done' : ''}`}>
                    {dayDoneCount}/{slots.length}
                  </span>
                </div>

                <div className="day-col-slots">
                  {slots.map((slot) => {
                    const isDone = slot.completed;
                    const slotColor = slot.goalColor || 'var(--lavender-accent)';

                    return (
                      <div
                        key={slot.id}
                        className={`timetable-slot-card ${isDone ? 'slot-done' : ''}`}
                        style={{ borderLeftColor: slotColor }}
                      >
                        <div className="slot-top-row">
                          <button
                            type="button"
                            className="slot-checkbox-btn"
                            onClick={() => onToggleSlot && onToggleSlot(slot.id)}
                            disabled={readOnly}
                            aria-label={isDone ? `Mark incomplete` : `Mark complete`}
                          >
                            {isDone ? (
                              <CheckCircle2 size={16} className="check-icon checked" />
                            ) : (
                              <Circle size={16} className="check-icon unchecked" />
                            )}
                          </button>

                          <span className="slot-time-pill">
                            <Clock size={10} />
                            {slot.timeSlot}
                          </span>
                        </div>

                        <div className="slot-goal-badge" style={{ color: slotColor, backgroundColor: `${slotColor}14` }}>
                          <span className="goal-dot-sm" style={{ backgroundColor: slotColor }}></span>
                          <span className="goal-name-text">{slot.goalTitle}</span>
                        </div>

                        <div className="slot-task-title">{slot.taskTitle}</div>

                        {slot.duration && (
                          <div className="slot-duration-tag">
                            <span>⏱ {slot.duration}</span>
                          </div>
                        )}

                        {slot.outcome && (
                          <div className="slot-outcome-text">
                            <Target size={11} className="outcome-icon" />
                            <span>{slot.outcome}</span>
                          </div>
                        )}

                        {onReportProgress && !readOnly && isDone && (
                          <button
                            type="button"
                            className="slot-quick-report-btn"
                            onClick={() => onReportProgress(`${slot.goalTitle}: ${slot.taskTitle}`)}
                            title="Tell coach you finished this"
                          >
                            Tell Coach
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: DAY-BY-DAY AGENDA */}
      {viewMode === 'day' && (
        <div className="timetable-day-view">
          {/* Day Navigation Tabs */}
          <div className="day-tabs-bar">
            {slotsByDay.map(({ day, slots }) => {
              const dayDoneCount = slots.filter((s) => s.completed).length;
              const isSelected = activeDayTab === day;
              const isFinished = slots.length > 0 && dayDoneCount === slots.length;

              return (
                <button
                  key={day}
                  type="button"
                  className={`day-tab-pill ${isSelected ? 'active' : ''} ${isFinished ? 'finished' : ''}`}
                  onClick={() => setActiveDayTab(day)}
                >
                  <span className="day-tab-text">{day.slice(0, 3)}</span>
                  <span className="day-tab-badge">
                    {dayDoneCount}/{slots.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Day Agenda Cards */}
          <div className="day-agenda-content">
            {(() => {
              const activeDayData = slotsByDay.find((d) => d.day === activeDayTab);
              if (!activeDayData || activeDayData.slots.length === 0) {
                return (
                  <div className="empty-day-state">
                    <Calendar size={28} />
                    <p>No study sessions scheduled for {activeDayTab} in this view.</p>
                  </div>
                );
              }

              return (
                <div className="agenda-slots-list">
                  <div className="agenda-day-header">
                    <h4>{activeDayTab} Agenda</h4>
                    <span className="agenda-slots-count">
                      {activeDayData.slots.filter((s) => s.completed).length} of {activeDayData.slots.length} completed
                    </span>
                  </div>

                  {activeDayData.slots.map((slot) => {
                    const isDone = slot.completed;
                    const slotColor = slot.goalColor || 'var(--lavender-accent)';

                    return (
                      <div
                        key={slot.id}
                        className={`agenda-slot-card ${isDone ? 'agenda-done' : ''}`}
                        style={{ borderLeftColor: slotColor }}
                      >
                        <button
                          type="button"
                          className="agenda-checkbox-btn"
                          onClick={() => onToggleSlot && onToggleSlot(slot.id)}
                          disabled={readOnly}
                        >
                          {isDone ? (
                            <CheckCircle2 size={22} className="check-icon checked" />
                          ) : (
                            <Circle size={22} className="check-icon unchecked" />
                          )}
                        </button>

                        <div className="agenda-slot-body">
                          <div className="agenda-meta-row">
                            <span className="agenda-time-badge">
                              <Clock size={12} />
                              {slot.timeSlot}
                            </span>
                            <span
                              className="agenda-goal-pill"
                              style={{ color: slotColor, backgroundColor: `${slotColor}18` }}
                            >
                              <span className="goal-dot-sm" style={{ backgroundColor: slotColor }}></span>
                              {slot.goalTitle}
                            </span>
                            {slot.duration && (
                              <span className="agenda-duration-pill">{slot.duration}</span>
                            )}
                          </div>

                          <div className="agenda-task-title">{slot.taskTitle}</div>

                          {slot.outcome && (
                            <div className="agenda-outcome-row">
                              <Target size={13} className="outcome-icon" />
                              <span><strong>Outcome:</strong> {slot.outcome}</span>
                            </div>
                          )}
                        </div>

                        {onReportProgress && !readOnly && isDone && (
                          <button
                            type="button"
                            className="agenda-report-btn"
                            onClick={() => onReportProgress(`${slot.goalTitle}: ${slot.taskTitle}`)}
                          >
                            Tell Coach
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: BY GOAL BREAKDOWN */}
      {viewMode === 'goal' && (
        <div className="timetable-by-goal-view">
          {/* Goal selection tabs */}
          <div className="goal-tabs-bar">
            {timetable.goals.map((goal) => {
              const isSelected = activeGoalTab === goal.name;
              const goalSlots = timetable.schedule.filter(
                (s) => s.goalTitle.toLowerCase() === goal.name.toLowerCase()
              );
              const doneCount = goalSlots.filter((s) => s.completed).length;

              return (
                <button
                  key={goal.id || goal.name}
                  type="button"
                  className={`goal-tab-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setActiveGoalTab(goal.name)}
                  style={{
                    borderColor: isSelected ? goal.color : undefined,
                    backgroundColor: isSelected ? `${goal.color}15` : undefined,
                  }}
                >
                  <span className="goal-dot-sm" style={{ backgroundColor: goal.color }}></span>
                  <span className="goal-tab-name">{goal.name}</span>
                  <span className="goal-tab-count">
                    {doneCount}/{goalSlots.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Goal sessions list */}
          <div className="goal-breakdown-content">
            {(() => {
              const goalSlots = timetable.schedule.filter(
                (s) => s.goalTitle.toLowerCase() === activeGoalTab.toLowerCase()
              );
              const goalMeta = timetable.goals.find(
                (g) => g.name.toLowerCase() === activeGoalTab.toLowerCase()
              );
              const goalColor = goalMeta?.color || 'var(--lavender-accent)';

              if (goalSlots.length === 0) {
                return (
                  <div className="empty-day-state">
                    <Layers size={28} />
                    <p>No study sessions listed for {activeGoalTab}.</p>
                  </div>
                );
              }

              return (
                <div className="goal-slots-list">
                  <div className="goal-breakdown-header" style={{ borderLeftColor: goalColor }}>
                    <div>
                      <h4 style={{ color: goalColor }}>{activeGoalTab}</h4>
                      <p className="goal-breakdown-meta">
                        {goalSlots.length} sessions across the week
                        {goalMeta?.weeklyTarget ? ` • Target: ${goalMeta.weeklyTarget}` : ''}
                      </p>
                    </div>
                    <span className="goal-completion-badge">
                      {goalSlots.filter((s) => s.completed).length}/{goalSlots.length} completed
                    </span>
                  </div>

                  {goalSlots.map((slot) => {
                    const isDone = slot.completed;

                    return (
                      <div
                        key={slot.id}
                        className={`agenda-slot-card ${isDone ? 'agenda-done' : ''}`}
                        style={{ borderLeftColor: goalColor }}
                      >
                        <button
                          type="button"
                          className="agenda-checkbox-btn"
                          onClick={() => onToggleSlot && onToggleSlot(slot.id)}
                          disabled={readOnly}
                        >
                          {isDone ? (
                            <CheckCircle2 size={20} className="check-icon checked" />
                          ) : (
                            <Circle size={20} className="check-icon unchecked" />
                          )}
                        </button>

                        <div className="agenda-slot-body">
                          <div className="agenda-meta-row">
                            <span className="day-badge-highlight">{slot.day}</span>
                            <span className="agenda-time-badge">
                              <Clock size={11} />
                              {slot.timeSlot}
                            </span>
                            {slot.duration && (
                              <span className="agenda-duration-pill">{slot.duration}</span>
                            )}
                          </div>

                          <div className="agenda-task-title">{slot.taskTitle}</div>

                          {slot.outcome && (
                            <div className="agenda-outcome-row">
                              <Target size={12} className="outcome-icon" />
                              <span>{slot.outcome}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Footer Adjustment Action */}
      {onRequestAdjustment && !readOnly && (
        <div className="timetable-footer">
          <button
            type="button"
            className="adjust-timetable-btn"
            onClick={() =>
              onRequestAdjustment(
                `Can we adjust my weekly timetable for "${timetable.title}"? I need to reschedule some time slots and re-balance my goals.`
              )
            }
          >
            <Sliders size={13} />
            <span>Need an adjustment? Ask Coach to rebalance weekly timetable</span>
          </button>
        </div>
      )}
    </div>
  );
};
