import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Auto-resize textarea height up to a max
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <div className="chat-input-wrapper">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tell me your study goals, exam date, or what's stressing you..."
          rows={1}
          className="chat-textarea"
          disabled={isLoading}
          aria-label="Type your message"
        />

        <div className="input-actions">
          <span className="enter-hint">
            <span>Press</span> <kbd>Enter <CornerDownLeft size={10} /></kbd>
          </span>
          <button
            type="submit"
            disabled={!canSend}
            className={`send-button ${canSend ? 'send-button-active' : ''}`}
            aria-label="Send message"
            title={canSend ? 'Send message' : 'Type a message to send'}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
      <div className="input-disclaimer">
        TinySteps AI breaks big goals into micro-tasks. One small step at a time!
      </div>
    </div>
  );
};

