import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Award,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
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
  const [isFullScreen, setIsFullScreen] = useState(false);

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const fullscreenTableScrollRef = useRef<HTMLDivElement>(null);

  // Close full screen on Escape key
  useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

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

        if (hourA !== hourB) return hourA - hourB;
        return minA - minB;
      }
      return a.localeCompare(b);
    });
  }, [timetable.schedule]);

  // Active days: always include full week (Monday through Sunday)
  const activeDays = ORDERED_DAYS;

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
    activeDays.forEach((d) => {
      result.push({
        day: d,
        slots: map[d] || [],
      });
    });
    return result;
  }, [filteredSchedule, activeDays]);

  // Group slots by Goal for the Goal breakdown view
  const slotsByGoal = useMemo(() => {
    const map: { [goal: string]: TimetableSlot[] } = {};

    filteredSchedule.forEach((slot) => {
      const g = slot.goalTitle.trim();
      if (!map[g]) {
        map[g] = [];
      }
      map[g].push(slot);
    });

    return Object.entries(map).map(([goalTitle, slots]) => ({
      goalTitle,
      slots,
    }));
  }, [filteredSchedule]);

  const handleCopyTimetable = async () => {
    try {
      let md = `## 📅 ${timetable.title} (${timetable.weekRange || 'Weekly Plan'})\n\n`;
      if (timetable.totalDailyTime) {
        md += `> **Daily Study Commitment**: ${timetable.totalDailyTime}\n\n`;
      }
      md += `| Time Slot | ${activeDays.join(' | ')} |\n`;
      md += `| --- | ${activeDays.map(() => '---').join(' | ')} |\n`;

      uniqueTimeSlots.forEach((slotTime) => {
        const rowCells = activeDays.map((d) => {
          const matchSlots = timetable.schedule.filter(
            (s) =>
              s.day.trim().toLowerCase() === d.toLowerCase() &&
              s.timeSlot.trim().toLowerCase() === slotTime.toLowerCase()
          );
          if (matchSlots.length === 0) return '—';
          return matchSlots
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

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, isModal = false) => {
    // Avoid dragging when clicking interactive buttons/links
    if ((e.target as HTMLElement).closest('button, input, a, svg')) return;
    const target = isModal ? fullscreenTableScrollRef.current : tableScrollRef.current;
    if (!target) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - target.offsetLeft;
    scrollLeftRef.current = target.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, isModal = false) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const target = isModal ? fullscreenTableScrollRef.current : tableScrollRef.current;
    if (!target) return;
    const x = e.pageX - target.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    target.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleScrollTable = (direction: 'left' | 'right', isModal = false) => {
    const target = isModal ? fullscreenTableScrollRef.current : tableScrollRef.current;
    if (target) {
      const amount = direction === 'left' ? -350 : 350;
      target.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleScrollToDay = (dayIndex: number, isModal = false) => {
    const target = isModal ? fullscreenTableScrollRef.current : tableScrollRef.current;
    if (target) {
      if (dayIndex === 0) {
        target.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      if (dayIndex >= 5) {
        // Saturday / Sunday: scroll fully to the right
        target.scrollTo({ left: target.scrollWidth, behavior: 'smooth' });
        return;
      }
      target.scrollTo({ left: dayIndex * 150, behavior: 'smooth' });
    }
  };

  // Reusable rendering function for view modes
  const renderViewContent = (isModal: boolean = false) => {
    return (
      <>
        {/* VIEW MODE 1: CLASS SCHEDULE TABLE MATRIX */}
        {viewMode === 'table' && (
          <div className="timetable-matrix-container">
            {/* TOP DAY JUMP & HORIZONTAL NAVIGATION BAR */}
            <div className="timetable-top-nav-bar">
              <div className="top-nav-left">
                <span className="top-nav-label">Move to Day:</span>
                <div className="top-nav-day-pills">
                  {activeDays.map((d, idx) => (
                    <button
                      key={d}
                      type="button"
                      className={`top-day-pill ${idx >= 5 ? 'weekend-pill' : ''}`}
                      onClick={() => handleScrollToDay(idx, isModal)}
                      title={`Scroll table to ${d} ${idx >= 5 ? '(Weekend)' : ''}`}
                    >
                      <span
                        className="top-day-dot"
                        style={{ backgroundColor: DAY_HEADER_COLORS[d] || 'var(--lavender-accent)' }}
                      />
                      <span>{d.slice(0, 3)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="top-nav-right">
                <button
                  type="button"
                  className="table-nav-arrow-btn"
                  onClick={() => handleScrollTable('left', isModal)}
                  title="Scroll left (earlier days)"
                >
                  <ChevronLeft size={15} />
                  <span>Left</span>
                </button>
                <button
                  type="button"
                  className="table-nav-arrow-btn table-nav-arrow-highlight"
                  onClick={() => handleScrollTable('right', isModal)}
                  title="Scroll right to see weekend (Sat & Sun)"
                >
                  <span>Right</span>
                  <ChevronRight size={15} />
                </button>
                {!isModal && (
                  <button
                    type="button"
                    className="table-expand-pill-btn"
                    onClick={() => setIsFullScreen(true)}
                    title="Open Full Screen (view all 7 days side-by-side)"
                  >
                    <Maximize2 size={13} />
                    <span>Full Screen</span>
                  </button>
                )}
              </div>
            </div>

            <div className="timetable-matrix-wrapper">
              {/* Floating Left/Right Navigation Arrows */}
              <button
                type="button"
                className="table-float-nav-btn table-float-left"
                onClick={() => handleScrollTable('left', isModal)}
                title="Scroll left (Monday - Wednesday)"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="table-float-nav-btn table-float-right"
                onClick={() => handleScrollTable('right', isModal)}
                title="Scroll right (Thursday - Sunday)"
                aria-label="Scroll right"
              >
                <span className="float-btn-text">Move Right</span>
                <ChevronRight size={16} />
              </button>

              <div
                ref={isModal ? fullscreenTableScrollRef : tableScrollRef}
                className="timetable-matrix-scroll"
                onMouseDown={(e) => handleMouseDown(e, isModal)}
                onMouseMove={(e) => handleMouseMove(e, isModal)}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
              >
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
                        <td className="matrix-time-cell">
                          <div className="matrix-time-badge">
                            <Clock size={11} className="matrix-clock-icon" />
                            <span>{timeSlot}</span>
                          </div>
                        </td>

                        {activeDays.map((day) => {
                          const cellSlots = filteredSchedule.filter((s) => {
                            const sDay = s.day.trim().toLowerCase();
                            const targetDay = day.toLowerCase();
                            const sTime = s.timeSlot.trim().toLowerCase();
                            const targetTime = timeSlot.toLowerCase();
                            return (
                              (sDay === targetDay || sDay.startsWith(targetDay.slice(0, 3))) &&
                              sTime === targetTime
                            );
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
                                          backgroundColor: `${slotColor}14`,
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

              {/* PERSISTENT HORIZONTAL SCROLL & DAY JUMP FOOTER */}
              <div className="timetable-scroll-footer">
                <div className="scroll-footer-left">
                  <span className="scroll-hint-label">Jump to Day:</span>
                  <div className="scroll-day-pills">
                    {activeDays.map((d, idx) => (
                      <button
                        key={d}
                        type="button"
                        className="day-jump-pill"
                        onClick={() => handleScrollToDay(idx, isModal)}
                        title={`Scroll horizontally to ${d}`}
                      >
                        <span
                          className="day-jump-dot"
                          style={{ backgroundColor: DAY_HEADER_COLORS[d] || 'var(--lavender-accent)' }}
                        />
                        <span>{d.slice(0, 3)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="scroll-footer-right">
                  <button
                    type="button"
                    className="table-nav-arrow-btn"
                    onClick={() => handleScrollTable('left', isModal)}
                    title="Scroll table left (earlier days)"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={15} />
                    <span>Left</span>
                  </button>
                  <button
                    type="button"
                    className="table-nav-arrow-btn table-nav-arrow-highlight"
                    onClick={() => handleScrollTable('right', isModal)}
                    title="Scroll table right to see weekend (Sat/Sun)"
                    aria-label="Scroll right"
                  >
                    <span>Right</span>
                    <ChevronRight size={15} />
                  </button>
                  {!isModal && (
                    <button
                      type="button"
                      className="table-expand-pill-btn"
                      onClick={() => setIsFullScreen(true)}
                      title="Open in Full Screen (see all 7 days side-by-side)"
                    >
                      <Maximize2 size={13} />
                      <span>Full Screen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: DAY CARDS */}
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW MODE 3: DAY AGENDA */}
        {viewMode === 'day' && (
          <div className="timetable-agenda-view">
            <div className="agenda-day-tabs">
              {activeDays.map((day) => {
                const count = timetable.schedule.filter(
                  (s) => s.day.trim().toLowerCase() === day.toLowerCase()
                ).length;
                const headerColor = DAY_HEADER_COLORS[day] || 'var(--lavender-accent)';

                return (
                  <button
                    key={day}
                    type="button"
                    className={`day-tab-pill ${activeDayTab === day ? 'active' : ''}`}
                    onClick={() => setActiveDayTab(day)}
                    style={{
                      borderBottomColor: activeDayTab === day ? headerColor : undefined,
                    }}
                  >
                    <span className="day-dot" style={{ backgroundColor: headerColor }}></span>
                    <span>{day}</span>
                    <span className="day-count-badge">{count}</span>
                  </button>
                );
              })}
            </div>

            {(() => {
              const activeDayData = slotsByDay.find((d) => d.day === activeDayTab);
              if (!activeDayData || activeDayData.slots.length === 0) {
                return (
                  <div className="agenda-empty-state">
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
                              style={{ color: slotColor, backgroundColor: `${slotColor}14` }}
                            >
                              {slot.goalTitle}
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

                          {onReportProgress && !readOnly && !isDone && (
                            <button
                              type="button"
                              className="agenda-progress-btn"
                              onClick={() => onReportProgress(slot.taskTitle)}
                            >
                              <Sparkles size={11} />
                              <span>I completed this slot</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* VIEW MODE 4: BY GOAL BREAKDOWN */}
        {viewMode === 'goal' && (
          <div className="timetable-goal-breakdown-view">
            <div className="goal-breakdown-tabs">
              {timetable.goals.map((g) => {
                const count = timetable.schedule.filter(
                  (s) => s.goalTitle.toLowerCase() === g.name.toLowerCase()
                ).length;

                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`goal-tab-pill ${activeGoalTab === g.name ? 'active' : ''}`}
                    onClick={() => setActiveGoalTab(g.name)}
                    style={{
                      borderBottomColor: activeGoalTab === g.name ? g.color : undefined,
                    }}
                  >
                    <span className="goal-dot" style={{ backgroundColor: g.color }}></span>
                    <span>{g.name}</span>
                    <span className="goal-count-badge">{count}</span>
                  </button>
                );
              })}
            </div>

            {(() => {
              const activeGroup = slotsByGoal.find((g) => g.goalTitle === activeGoalTab);
              const goalSlots = activeGroup ? activeGroup.slots : [];
              const goalMeta = timetable.goals.find((g) => g.name === activeGoalTab);
              const goalColor = goalMeta?.color || 'var(--lavender-accent)';

              if (goalSlots.length === 0) {
                return (
                  <div className="goal-empty-state">
                    <p>No study sessions scheduled for {activeGoalTab}.</p>
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
        )}
      </>
    );
  };

  return (
    <>
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

            <button
              type="button"
              className="timetable-fullscreen-btn"
              onClick={() => setIsFullScreen(true)}
              title="Expand to Full Screen (see all days side-by-side)"
              aria-label="Expand timetable to full screen"
            >
              <Maximize2 size={13} className="timetable-expand-icon" />
              <span>Full Screen</span>
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

              return (
                <button
                  key={g.id}
                  type="button"
                  className={`goal-tag-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedGoalFilter(isSelected ? null : g.name)}
                  style={{
                    borderColor: isSelected ? g.color : undefined,
                    boxShadow: isSelected ? `0 0 0 2px ${g.color}30` : undefined,
                  }}
                >
                  <span className="goal-dot" style={{ backgroundColor: g.color }}></span>
                  <span>
                    {g.name} ({goalCount})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Progress Bar & Status */}
        <div className="timetable-progress-container">
          <div className="timetable-progress-header">
            <span className="progress-stat-text">
              <strong>{completedSlots}</strong> of <strong>{totalSlots}</strong> weekly study sessions completed
            </span>
            <span className="progress-percent-badge">{percentComplete}%</span>
          </div>
          <div className="timetable-progress-bar-track">
            <div
              className={`timetable-progress-bar-fill ${isAllComplete ? 'progress-all-done' : ''}`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="timetable-view-tabs">
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

        {/* Embedded View Mode Content */}
        {renderViewContent(false)}

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

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isFullScreen && (
        <div
          className="timetable-fullscreen-overlay"
          onClick={() => setIsFullScreen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Full screen weekly timetable"
        >
          <div className="timetable-fullscreen-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="timetable-fullscreen-header">
              <div className="fullscreen-header-left">
                <CalendarRange size={22} className="fullscreen-icon" />
                <div>
                  <div className="fullscreen-subtitle-row">
                    <span className="fullscreen-subheading">Class Schedule & Multi-Goal Weekly Timetable</span>
                    {timetable.weekRange && (
                      <span className="timetable-week-range">{timetable.weekRange}</span>
                    )}
                  </div>
                  <h2 className="fullscreen-modal-title">{timetable.title}</h2>
                </div>
              </div>

              <div className="fullscreen-header-actions">
                {timetable.totalDailyTime && (
                  <span className="timetable-pill timetable-pill-time">
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

                <button
                  type="button"
                  className="timetable-fullscreen-close-btn"
                  onClick={() => setIsFullScreen(false)}
                  title="Close Full Screen (Esc)"
                >
                  <Minimize2 size={15} />
                  <span>Exit Full Screen</span>
                </button>
              </div>
            </div>

            {/* Modal Toolbar: Filters & View Switcher */}
            <div className="timetable-fullscreen-toolbar">
              <div className="fullscreen-filter-pills">
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

                  return (
                    <button
                      key={g.id}
                      type="button"
                      className={`goal-tag-pill ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedGoalFilter(isSelected ? null : g.name)}
                      style={{
                        borderColor: isSelected ? g.color : undefined,
                        boxShadow: isSelected ? `0 0 0 2px ${g.color}30` : undefined,
                      }}
                    >
                      <span className="goal-dot" style={{ backgroundColor: g.color }}></span>
                      <span>
                        {g.name} ({goalCount})
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="timetable-view-tabs">
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
            </div>

            {/* Modal Body */}
            <div className="timetable-fullscreen-body">
              {renderViewContent(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
