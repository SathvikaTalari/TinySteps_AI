import React from 'react';
import { Sparkles } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="message-wrapper ai-wrapper">
      <div className="avatar ai-avatar" aria-label="TinySteps AI avatar">
        <Sparkles size={16} />
      </div>
      <div className="message-bubble ai-bubble typing-bubble">
        <div className="typing-dots">
          <span className="dot dot-1"></span>
          <span className="dot dot-2"></span>
          <span className="dot dot-3"></span>
        </div>
        <span className="typing-text">TinySteps is thinking...</span>
      </div>
    </div>
  );
};

