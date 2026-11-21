import React, { useState, useMemo } from 'react';
import type { WeeklyTimetableData, TimetableSlot } from '../types/chat';
import {
  CalendarRange,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Table as TableIcon,
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

type ViewMode = 'table' | 'grid' | 'day' | 'goal';

const ORDERED_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DAY_HEADER_COLORS: { [day: string]: string } = {
  Monday: '#7C3AED',    // Purple
  Tuesday: '#A855F7',   // Magenta
  Wednesday: '#EC4899', // Pink
  Thursday: '#F97316',  // Orange
  Friday: '#F59E0B',    // Amber / Coral
  Saturday: '#10B981',  // Emerald Green
  Sunday: '#06B6D4',    // Sky Cyan
};

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  timetable,
  onToggleSlot,
  onReportProgress,
  onRequestAdjustment,
  readOnly = false,
}) => {
  // Default to the 2D "Class Schedule Table" matrix view!
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string | null>(null);
  const [activeDayTab, setActiveDayTab] = useState<string>('Monday');
  const [activeGoalTab, setActiveGoalTab] = useState<string>(
    timetable.goals[0]?.name || ''
  );
  const [copied, setCopied] = useState(false);
  const [localCompletedMap, setLocalCompletedMap] = useState<{ [slotId: string]: boolean }>({});

  const isSlotCompleted = (slot: TimetableSlot) => {
    return slot.id in localCompletedMap ? localCompletedMap[slot.id] : Boolean(slot.completed);
  };

  const handleToggleSlot = (slotId: string) => {
    if (onToggleSlot) {
      onToggleSlot(slotId);
    }
    setLocalCompletedMap((prev) => {
      const current = slotId in prev ? prev[slotId] : Boolean(timetable.schedule.find((s) => s.id === slotId)?.completed);
      return { ...prev, [slotId]: !current };
    });
  };

  const totalSlots = timetable.schedule.length;
  const completedSlots = timetable.schedule.filter((s) => isSlotCompleted(s)).length;
  const percentComplete = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;
  const isAllComplete = totalSlots > 0 && completedSlots === totalSlots;

  // Filter schedule if a goal filter is selected
  const filteredSchedule = useMemo(() => {
    if (!selectedGoalFilter) return timetable.schedule;
    return timetable.schedule.filter(
      (s) => s.goalTitle.toLowerCase() === selectedGoalFilter.toLowerCase()
    );
  }, [timetable.schedule, selectedGoalFilter]);

  // Extract all unique time slots across the timetable in chronological order
  const uniqueTimeSlots = useMemo(() => {
    const slots: string[] = [];
    timetable.schedule.forEach((s) => {
      const trimmed = s.timeSlot.trim();
      if (!slots.includes(trimmed)) {
        slots.push(trimmed);
      }
    });

    // Try chronological sorting if strings contain hour numbers (e.g. "07:30 - 08:30" or "7:00 AM")
    return slots.sort((a, b) => {
      const matchA = a.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
      const matchB = b.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
      if (matchA && matchB) {
        let hourA = parseInt(matchA[1], 10);
        let hourB = parseInt(matchB[1], 10);
        const minA = matchA[2] ? parseInt(matchA[2], 10) : 0;
        const minB = matchB[2] ? parseInt(matchB[2], 10) : 0;

        if (matchA[3]?.toUpperCase() === 'PM' && hourA < 12) hourA += 12;
        if (matchA[3]?.toUpperCase() === 'AM' && hourA === 12) hourA = 0;
        if (matchB[3]?.toUpperCase() === 'PM' && hourB < 12) hourB += 12;
        if (matchB[3]?.toUpperCase() === 'AM' && hourB === 12) hourB = 0;

        const totalA = hourA * 60 + minA;
        const totalB = hourB * 60 + minB;
        return totalA - totalB;
      }
      return a.localeCompare(b);
    });
  }, [timetable.schedule]);

  // Active days that have slots or standard 5/7 days
  const activeDays = useMemo(() => {
    const daysWithSlots = new Set(
      timetable.schedule.map((s) => {
        const matched = ORDERED_DAYS.find(
          (od) => od.toLowerCase() === s.day.trim().toLowerCase()
        );
        return matched || s.day.trim();
      })
    );

    // If schedule covers weekends, show all 7 days; otherwise show Monday - Friday
    const hasWeekend = daysWithSlots.has('Saturday') || daysWithSlots.has('Sunday');
    if (hasWeekend) {
      return ORDERED_DAYS;
    }
    return ORDERED_DAYS.slice(0, 5); // Monday through Friday
  }, [timetable.schedule]);

  // Group slots by Day for the Grid and Day views
  const slotsByDay = useMemo(() => {
    const map: { [day: string]: TimetableSlot[] } = {};

    ORDERED_DAYS.forEach((d) => {
      map[d] = [];
    });

    filteredSchedule.forEach((slot) => {
      const matchedStandard = ORDERED_DAYS.find(
        (od) => od.toLowerCase() === slot.day.trim().toLowerCase()
      );
      const dayKey = matchedStandard || slot.day.trim();
      if (!map[dayKey]) {
        map[dayKey] = [];
      }
      map[dayKey].push(slot);
    });

    const result: { day: string; slots: TimetableSlot[] }[] = [];
    ORDERED_DAYS.forEach((d) => {
      if (map[d] && map[d].length > 0) {
        result.push({ day: d, slots: map[d] });
      }
    });

    Object.keys(map).forEach((d) => {
      if (!ORDERED_DAYS.includes(d) && map[d].length > 0) {
        result.push({ day: d, slots: map[d] });
      }
    });

    return result;
  }, [filteredSchedule]);

  // Copy full timetable to clipboard in Markdown table format
  const handleCopyTimetable = async () => {
    try {
      let md = `### 📅 ${timetable.title}\n`;
      if (timetable.weekRange) md += `**Week:** ${timetable.weekRange} | `;
      if (timetable.totalDailyTime) md += `**Daily Study Time:** ${timetable.totalDailyTime}\n\n`;

      md += `| Time Slot | ` + activeDays.map((d) => d).join(' | ') + ` |\n`;
      md += `| :--- | ` + activeDays.map(() => ':---').join(' | ') + ` |\n`;

      uniqueTimeSlots.forEach((slotTime) => {
        const rowCells = activeDays.map((day) => {
          const matched = timetable.schedule.filter(
            (s) =>
              s.day.trim().toLowerCase() === day.toLowerCase() &&
              s.timeSlot.trim().toLowerCase() === slotTime.toLowerCase()
          );
          if (matched.length === 0) return '—';
          return matched
            .map((s) => `${s.completed ? '✅' : '⏳'} [${s.goalTitle}] ${s.taskTitle}`)
            .join('<br/>');
        });
        md += `| **${slotTime}** | ${rowCells.join(' | ')} |\n`;
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
              <span className="timetable-subheading">Class Schedule & Multi-Goal Timetable</span>
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
          <span className="filter-label">Goals / Subjects:</span>
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
            <span>Outstanding consistency! You completed all scheduled sessions across all goals! 🎉</span>
          </div>
        )}
      </div>

      {/* View Switcher: Class Schedule Table (Default) vs Weekly Cards vs Day Agenda vs By Goal */}
      <div className="timetable-view-switcher">
        <button
          type="button"
          className={`view-tab-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          <TableIcon size={13} />
          <span>Class Schedule Table</span>
        </button>
        <button
          type="button"
          className={`view-tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
        >
          <LayoutGrid size={13} />
          <span>Day Cards</span>
        </button>
        <button
          type="button"
          className={`view-tab-btn ${viewMode === 'day' ? 'active' : ''}`}
          onClick={() => setViewMode('day')}
        >
          <Calendar size={13} />
          <span>Day Agenda</span>
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

      {/* =========================================================================
          VIEW MODE 1: CLASS SCHEDULE TABLE MATRIX (IMAGE-INSPIRED)
          ========================================================================= */}
      {viewMode === 'table' && (
        <div className="timetable-matrix-wrapper">
          <div className="timetable-matrix-scroll">
            <table className="timetable-matrix-table">
              <thead>
                <tr>
                  <th className="matrix-time-header">Time Slots</th>
                  {activeDays.map((day) => {
                    const headerColor = DAY_HEADER_COLORS[day] || 'var(--lavender-accent)';
                    return (
                      <th
                        key={day}
                        className="matrix-day-header"
                        style={{ backgroundColor: headerColor }}
                      >
                        <span className="matrix-day-title">{day}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {uniqueTimeSlots.map((timeSlot) => (
                  <tr key={timeSlot} className="matrix-row">
                    {/* Time Column (Y-Axis) */}
                    <td className="matrix-time-cell">
                      <div className="matrix-time-badge">
                        <Clock size={11} className="matrix-clock-icon" />
                        <span>{timeSlot}</span>
                      </div>
                    </td>

                    {/* Day Columns (X-Axis) */}
                    {activeDays.map((day) => {
                      const cellSlots = filteredSchedule.filter((s) => {
                        const sDay = s.day.trim().toLowerCase();
                        const targetDay = day.toLowerCase();
                        const sTime = s.timeSlot.trim().toLowerCase();
                        const targetTime = timeSlot.toLowerCase();
                        return (sDay === targetDay || sDay.startsWith(targetDay.slice(0, 3))) && sTime === targetTime;
                      });

                      if (cellSlots.length === 0) {
                        return (
                          <td key={`${timeSlot}-${day}`} className="matrix-cell matrix-cell-empty">
                            <span className="empty-slot-label">—</span>
                          </td>
                        );
                      }

                      return (
                        <td key={`${timeSlot}-${day}`} className="matrix-cell matrix-cell-occupied">
                          {cellSlots.map((slot) => {
                            const isDone = isSlotCompleted(slot);
                            const slotColor = slot.goalColor || 'var(--lavender-accent)';

                            return (
                              <div
                                key={slot.id}
                                className={`matrix-slot-block ${isDone ? 'slot-completed' : ''}`}
                                style={{ borderLeftColor: slotColor }}
                              >
                                <div className="matrix-slot-top">
                                  <button
                                    type="button"
                                    className="matrix-slot-check"
                                    onClick={() => handleToggleSlot(slot.id)}
                                    disabled={readOnly}
                                    title={isDone ? 'Mark incomplete' : 'Mark complete'}
                                  >
                                    {isDone ? (
                                      <CheckCircle2 size={15} className="check-icon checked" />
                                    ) : (
                                      <Circle size={15} className="check-icon unchecked" />
                                    )}
                                  </button>

                                  <span
                                    className="matrix-goal-tag"
                                    style={{
                                      color: slotColor,
                                      backgroundColor: `${slotColor}16`,
                                    }}
                                  >
                                    {slot.goalTitle}
                                  </span>
                                </div>

                                <div className="matrix-slot-title">{slot.taskTitle}</div>

                                {slot.duration && (
                                  <span className="matrix-slot-duration">⏱ {slot.duration}</span>
                                )}

                                {slot.outcome && (
                                  <div className="matrix-slot-outcome" title={slot.outcome}>
                                    <Target size={10} className="outcome-icon" />
                                    <span>{slot.outcome}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: DAY CARDS
          ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="timetable-grid-container">
          {slotsByDay.map(({ day, slots }) => {
            const dayDoneCount = slots.filter((s) => isSlotCompleted(s)).length;
            const isDayFinished = slots.length > 0 && dayDoneCount === slots.length;
            const headerColor = DAY_HEADER_COLORS[day] || 'var(--lavender-accent)';

            return (
              <div key={day} className={`timetable-day-col ${isDayFinished ? 'day-finished' : ''}`}>
                <div className="day-col-header" style={{ borderBottomColor: `${headerColor}30` }}>
                  <span className="day-col-name" style={{ color: headerColor }}>{day}</span>
                  <span className={`day-col-badge ${isDayFinished ? 'done' : ''}`}>
                    {dayDoneCount}/{slots.length}
                  </span>
                </div>

                <div className="day-col-slots">
                  {slots.map((slot) => {
                    const isDone = isSlotCompleted(slot);
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
                            onClick={() => handleToggleSlot(slot.id)}
                            disabled={readOnly}
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

      {/* =========================================================================
          VIEW MODE 3: DAY-BY-DAY AGENDA
          ========================================================================= */}
      {viewMode === 'day' && (
        <div className="timetable-day-view">
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

          <div className="day-agenda-content">
            {(() => {
              const activeDayData = slotsByDay.find((d) => d.day === activeDayTab);
              if (!activeDayData || activeDayData.slots.length === 0) {
                return (
                  <div className="empty-day-state">
                    <Calendar size={28} />
                    <p>No study sessions scheduled for {activeDayTab}.</p>
                  </div>
                );
              }

              return (
                <div className="agenda-slots-list">
                  <div className="agenda-day-header">
                    <h4>{activeDayTab} Agenda</h4>
                    <span className="agenda-slots-count">
                      {activeDayData.slots.filter((s) => isSlotCompleted(s)).length} of {activeDayData.slots.length} completed
                    </span>
                  </div>

                  {activeDayData.slots.map((slot) => {
                    const isDone = isSlotCompleted(slot);
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
                          onClick={() => handleToggleSlot(slot.id)}
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

      {/* =========================================================================
          VIEW MODE 4: BY GOAL BREAKDOWN
          ========================================================================= */}
      {viewMode === 'goal' && (
        <div className="timetable-by-goal-view">
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
                      {goalSlots.filter((s) => isSlotCompleted(s)).length}/{goalSlots.length} completed
                    </span>
                  </div>

                  {goalSlots.map((slot) => {
                    const isDone = isSlotCompleted(slot);

                    return (
                      <div
                        key={slot.id}
                        className={`agenda-slot-card ${isDone ? 'agenda-done' : ''}`}
                        style={{ borderLeftColor: goalColor }}
                      >
                        <button
                          type="button"
                          className="agenda-checkbox-btn"
                          onClick={() => handleToggleSlot(slot.id)}
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
