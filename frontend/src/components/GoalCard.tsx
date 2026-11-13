import React, { useMemo } from 'react';
import type { GoalData, GoalTask } from '../types/chat';
import {
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Award,
  Sliders,
  BookOpen
} from 'lucide-react';

interface GoalCardProps {
  goal: GoalData;
  onToggleTask?: (taskId: string) => void;
  onReportProgress?: (taskTitle: string) => void;
  onRequestAdjustment?: (topicOrDay?: string) => void;
  readOnly?: boolean;
}

interface GroupedDay {
  dayName: string;
  topic?: string;
  tasks: GoalTask[];
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onToggleTask,
  onReportProgress,
  onRequestAdjustment,
  readOnly = false,
}) => {
  const totalTasks = goal.tasks.length;
  const completedTasks = goal.tasks.filter((t) => t.completed).length;
  const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isAllComplete = totalTasks > 0 && completedTasks === totalTasks;

  // Group tasks by day if tasks specify a day property
  const dayGroups: GroupedDay[] = useMemo(() => {
    const hasDays = goal.tasks.some((t) => Boolean(t.day));
    if (!hasDays) {
      return [{ dayName: '', tasks: goal.tasks }];
    }

    const groups: { [key: string]: GroupedDay } = {};
    const order: string[] = [];

    goal.tasks.forEach((task) => {
      const dayKey = task.day || 'Daily Tasks';
      if (!groups[dayKey]) {
        groups[dayKey] = {
          dayName: dayKey,
          topic: task.topic,
          tasks: [],
        };
        order.push(dayKey);
      }
      if (!groups[dayKey].topic && task.topic) {
        groups[dayKey].topic = task.topic;
      }
      groups[dayKey].tasks.push(task);
    });

    return order.map((k) => groups[k]);
  }, [goal.tasks]);

  const hasMultipleDays = dayGroups.length > 1 || (dayGroups.length === 1 && dayGroups[0].dayName !== '');

  return (
    <div className={`goal-card-widget ${isAllComplete ? 'goal-all-complete' : ''}`}>
      {/* Header */}
      <div className="goal-card-header">
        <div className="goal-title-wrapper">
          <div className="goal-badge-icon">
            {isAllComplete ? <Award size={18} className="award-icon" /> : <Target size={18} />}
          </div>
          <div>
            <span className="goal-subheading">Active Study Roadmap</span>
            <h3 className="goal-title">{goal.title}</h3>
          </div>
        </div>

        {/* Metadata badges */}
        <div className="goal-meta-badges">
          {goal.deadline && (
            <span className="goal-pill goal-pill-deadline" title="Target Deadline">
              <Calendar size={12} />
              <span>{goal.deadline}</span>
            </span>
          )}
          {goal.dailyTime && (
            <span className="goal-pill goal-pill-time" title="Daily Study Time">
              <Clock size={12} />
              <span>{goal.dailyTime}</span>
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="goal-progress-section">
        <div className="goal-progress-labels">
          <span className="progress-text">
            {completedTasks} of {totalTasks} micro-steps completed
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
          <div className="progress-fill" style={{ width: `${percentComplete}%` }}></div>
        </div>
        {isAllComplete && (
          <div className="goal-celebration-banner">
            <Sparkles size={14} />
            <span>Incredible work! You completed every single step in this study plan! 🎉</span>
          </div>
        )}
      </div>

      {/* Days & Tasks List */}
      <div className="goal-days-container">
        {dayGroups.map((group, groupIdx) => {
          const dayCompletedCount = group.tasks.filter((t) => t.completed).length;
          const isDayDone = group.tasks.length > 0 && dayCompletedCount === group.tasks.length;

          return (
            <div key={group.dayName || `group-${groupIdx}`} className="day-card-group">
              {group.dayName && (
                <div className="day-group-header">
                  <div className="day-title-row">
                    <span className="day-badge">{group.dayName}</span>
                    {group.topic && (
                      <span className="day-topic-name">
                        <BookOpen size={12} className="day-topic-icon" />
                        {group.topic}
                      </span>
                    )}
                  </div>
                  <span className={`day-status-pill ${isDayDone ? 'day-status-done' : ''}`}>
                    {dayCompletedCount}/{group.tasks.length} done
                  </span>
                </div>
              )}

              <div className="goal-tasks-list">
                {group.tasks.map((task, taskIdx) => {
                  const isDone = task.completed;
                  return (
                    <div
                      key={task.id || `task-${groupIdx}-${taskIdx}`}
                      className={`goal-task-item ${isDone ? 'task-done' : ''}`}
                    >
                      <button
                        type="button"
                        className="task-checkbox-btn"
                        onClick={() => onToggleTask && onToggleTask(task.id)}
                        disabled={readOnly}
                        aria-label={
                          isDone
                            ? `Mark "${task.title}" as incomplete`
                            : `Mark "${task.title}" as complete`
                        }
                      >
                        {isDone ? (
                          <CheckCircle2 size={20} className="check-icon checked" />
                        ) : (
                          <Circle size={20} className="check-icon unchecked" />
                        )}
                      </button>

                      <div className="task-details">
                        <div className="task-main-row">
                          <span className="task-title-text">{task.title}</span>
                          {task.estimatedTime && (
                            <span className="task-time-tag">
                              <Clock size={11} />
                              {task.estimatedTime}
                            </span>
                          )}
                        </div>

                        {task.outcome && (
                          <div className="task-outcome-text">
                            <span className="outcome-prefix">🎯 Outcome:</span> {task.outcome}
                          </div>
                        )}
                      </div>

                      {/* Quick progress report button */}
                      {onReportProgress && !readOnly && isDone && (
                        <button
                          type="button"
                          className="quick-report-btn"
                          title="Tell coach you finished this step"
                          onClick={() => onReportProgress(task.title)}
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

      {/* Plan adjustment action */}
      {onRequestAdjustment && !readOnly && (
        <div className="goal-card-footer">
          <button
            type="button"
            className="adjust-plan-btn"
            onClick={() =>
              onRequestAdjustment(
                hasMultipleDays && dayGroups[0].dayName ? dayGroups[0].dayName : goal.title
              )
            }
          >
            <Sliders size={13} />
            <span>Need an adjustment? Ask Coach to adjust schedule</span>
          </button>
        </div>
      )}
    </div>
  );
};
