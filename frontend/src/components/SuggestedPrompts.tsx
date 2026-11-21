import React from 'react';
import { Calendar, Zap, CheckSquare, Clock, CalendarRange } from 'lucide-react';

interface SuggestedPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export const SUGGESTED_PROMPTS = [
  {
    text: 'Create a weekly timetable for my subjects',
    icon: CalendarRange,
  },
  {
    text: 'Create my study plan',
    icon: Calendar,
  },
  {
    text: 'Help me stop procrastinating',
    icon: Zap,
  },
  {
    text: 'Break my exam preparation into tasks',
    icon: CheckSquare,
  },
  {
    text: 'Help me manage my time',
    icon: Clock,
  },
];

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  return (
    <div className="suggested-prompts-container" aria-label="Suggested study prompts">
      <div className="prompts-label">Need inspiration? Try asking:</div>
      <div className="prompts-grid">
        {SUGGESTED_PROMPTS.map((prompt) => {
          const Icon = prompt.icon;
          return (
            <button
              key={prompt.text}
              type="button"
              className="prompt-chip"
              onClick={() => onSelectPrompt(prompt.text)}
              disabled={disabled}
            >
              <Icon size={14} className="prompt-chip-icon" />
              <span>{prompt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
