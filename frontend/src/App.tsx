import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatMessage } from './components/ChatMessage';
import { SuggestedPrompts } from './components/SuggestedPrompts';
import { ChatInput } from './components/ChatInput';
import { TypingIndicator } from './components/TypingIndicator';
import { sendChatMessage } from './services/api';
import type { Message, GoalData, WeeklyTimetableData } from './types/chat';
import { extractGoalData } from './utils/goalParser';
import { AlertCircle } from 'lucide-react';
import './App.css';

const STORAGE_KEY = 'tinysteps_chat_history';
const GOAL_STORAGE_KEY = 'tinysteps_active_goal';
const TIMETABLE_STORAGE_KEY = 'tinysteps_active_timetable';
const THEME_STORAGE_KEY = 'tinysteps_theme';

function getInitialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch (err) {
    console.error('Failed to load theme preference:', err);
  }
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome-msg',
  sender: 'ai',
  text: "Hi! I'm TinySteps AI. Tell me your study goals, multiple subjects, or exam deadlines, and I'll create a step-by-step roadmap or a weekly timetable for you!",
  timestamp: Date.now(),
};

function getInitialMessages(): Message[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((msg: Message) => {
          if ((!msg.goalData || !msg.timetableData) && msg.text && msg.sender === 'ai') {
            const { goalData, timetableData } = extractGoalData(msg.text);
            return {
              ...msg,
              goalData: msg.goalData || goalData,
              timetableData: msg.timetableData || timetableData,
            };
          }
          return msg;
        });
      }
    }
  } catch (err) {
    console.error('Failed to load chat history from localStorage:', err);
  }
  return [WELCOME_MESSAGE];
}

function getInitialActiveGoal(messages: Message[]): GoalData | null {
  try {
    const savedGoal = localStorage.getItem(GOAL_STORAGE_KEY);
    if (savedGoal) {
      const parsed = JSON.parse(savedGoal);
      if (parsed && parsed.title && Array.isArray(parsed.tasks)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load active goal from localStorage:', err);
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].goalData) {
      return messages[i].goalData!;
    }
  }

  return null;
}

function getInitialActiveTimetable(messages: Message[]): WeeklyTimetableData | null {
  try {
    const savedTimetable = localStorage.getItem(TIMETABLE_STORAGE_KEY);
    if (savedTimetable) {
      const parsed = JSON.parse(savedTimetable);
      if (parsed && parsed.title && Array.isArray(parsed.schedule)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load active timetable from localStorage:', err);
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].timetableData) {
      return messages[i].timetableData!;
    }
  }

  return null;
}

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [activeGoal, setActiveGoal] = useState<GoalData | null>(() =>
    getInitialActiveGoal(messages)
  );
  const [activeTimetable, setActiveTimetable] = useState<WeeklyTimetableData | null>(() =>
    getInitialActiveTimetable(messages)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Apply theme to document and persist
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
      console.error('Failed to save theme to localStorage:', err);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error('Failed to save chat history to localStorage:', err);
    }
  }, [messages]);

  // Persist active goal to localStorage
  useEffect(() => {
    try {
      if (activeGoal) {
        localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(activeGoal));
      } else {
        localStorage.removeItem(GOAL_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to save active goal to localStorage:', err);
    }
  }, [activeGoal]);

  // Persist active timetable to localStorage
  useEffect(() => {
    try {
      if (activeTimetable) {
        localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(activeTimetable));
      } else {
        localStorage.removeItem(TIMETABLE_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to save active timetable to localStorage:', err);
    }
  }, [activeTimetable]);

  // Smooth scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setErrorMessage(null);

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const aiReply = await sendChatMessage(text.trim(), updatedMessages);

      // Check if AI generated a structured goal card or weekly timetable
      const { goalData, timetableData } = extractGoalData(aiReply);

      const aiMessage: Message = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'ai',
        text: aiReply,
        goalData: goalData,
        timetableData: timetableData,
        timestamp: Date.now(),
      };

      if (goalData) {
        setActiveGoal(goalData);
      }
      if (timetableData) {
        setActiveTimetable(timetableData);
      }

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errText =
        err instanceof Error ? err.message : 'Something went wrong. Please check your backend connection.';
      setErrorMessage(errText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = (messageId: string, taskId: string) => {
    setMessages((prevMessages) => {
      let updatedGoal: GoalData | null = null;

      const nextMessages = prevMessages.map((msg) => {
        if (msg.id === messageId && msg.goalData) {
          const updatedTasks = msg.goalData.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          );
          updatedGoal = { ...msg.goalData, tasks: updatedTasks };
          return { ...msg, goalData: updatedGoal };
        }
        return msg;
      });

      if (updatedGoal) {
        setActiveGoal(updatedGoal);
      }

      return nextMessages;
    });
  };

  const handleToggleTimetableSlot = (messageId: string, slotId: string) => {
    setMessages((prevMessages) => {
      let updatedTimetable: WeeklyTimetableData | null = null;

      const nextMessages = prevMessages.map((msg) => {
        if (msg.id === messageId && msg.timetableData) {
          const updatedSchedule = msg.timetableData.schedule.map((slot) =>
            slot.id === slotId ? { ...slot, completed: !slot.completed } : slot
          );
          updatedTimetable = { ...msg.timetableData, schedule: updatedSchedule };
          return { ...msg, timetableData: updatedTimetable };
        }
        return msg;
      });

      if (updatedTimetable) {
        setActiveTimetable(updatedTimetable);
      }

      return nextMessages;
    });
  };

  const handleReportProgress = (taskTitle: string) => {
    handleSendMessage(`I just completed: "${taskTitle}"! What's our next tiny step?`);
  };

  const handleRequestAdjustment = (context?: string) => {
    const prompt = context
      ? `Can we adjust my plan for "${context}"? I need to reschedule some tasks and rebalance my schedule.`
      : `Can we adjust my study schedule? I need to reschedule some tasks.`;
    handleSendMessage(prompt);
  };

  const handleClearChat = () => {
    const freshWelcome: Message = {
      ...WELCOME_MESSAGE,
      timestamp: Date.now(),
    };
    setMessages([freshWelcome]);
    setActiveGoal(null);
    setActiveTimetable(null);
    setErrorMessage(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(GOAL_STORAGE_KEY);
      localStorage.removeItem(TIMETABLE_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear localStorage:', err);
    }
  };

  return (
    <div className="app-container">
      <div className="chat-card">
        {/* Header with Title, Active Goal / Timetable Pill, Theme Toggle & Clear Button */}
        <Header
          onClearChat={handleClearChat}
          messageCount={messages.length}
          activeGoal={activeGoal}
          activeTimetable={activeTimetable}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Error notification banner */}
        {errorMessage && (
          <div className="error-banner" role="alert">
            <div className="error-banner-content">
              <AlertCircle size={18} className="error-icon" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="error-dismiss-btn"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div className="chat-messages" role="log" aria-live="polite">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onToggleTask={handleToggleTask}
              onToggleTimetableSlot={handleToggleTimetableSlot}
              onReportProgress={handleReportProgress}
              onRequestAdjustment={handleRequestAdjustment}
            />
          ))}

          {isLoading && (
            <div className="loading-wrapper">
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts (visible when conversation is fresh) */}
        {messages.length <= 2 && (
          <SuggestedPrompts
            onSelectPrompt={handleSendMessage}
            disabled={isLoading}
          />
        )}

        {/* Input Bar */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
export default App;
