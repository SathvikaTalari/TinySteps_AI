import type { Message } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function sendChatMessage(message: string, history: Message[]): Promise<string> {
  const url = `${API_BASE_URL}/api/chat`;

  // Filter history to exclude welcome prompt if needed or format cleanly
  const conversationHistory = history.map((msg) => ({
    sender: msg.sender,
    text: msg.text,
  }));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history: conversationHistory,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error || `Server error (${response.status})`;
    throw new Error(errorMsg);
  }

  return data.reply;
}
