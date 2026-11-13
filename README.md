# TinySteps AI 🎓✨
> **A friendly AI study companion that helps students break big academic goals into small, manageable daily tasks.**

---

## 🌟 Overview

**TinySteps AI** is a modern, responsive web application designed to combat study overwhelm and procrastination. Instead of intimidating multi-hour cram sessions, TinySteps AI acts as an empathetic productivity coach—guiding students to take realistic 15–30 minute micro-steps, organize exam prep, build sustainable daily routines, and recover momentum without guilt.

---

## 🎨 Theme & Design
- **Color Palette**: Clean lavender (`#F6F4FD`, `#EBE5F9`), crisp white (`#FFFFFF`), and deep midnight purple (`#200E3A`, `#3B1768`).
- **Aesthetic**: Soft glowing glassmorphism, rounded chat bubbles, smooth keyframe animations, and custom scrollbars.
- **Responsiveness**: Fully optimized for mobile screens (100dvh, compact touch targets) and desktop monitors (card container with elevation).

---

## 🚀 Key Features

1. **Visually Rich Learning & Goal Coaching**:
   - **Smart Response Formatting**: Chooses the ideal presentation format automatically—Mermaid diagrams for flows, Markdown tables for comparisons, syntax-highlighted code blocks for programming, and step-by-step solutions for mathematics.
   - **Visual Diagrams (Mermaid)**: Renders live interactive flowcharts, architecture maps, and sequence diagrams directly in chat with source toggle and graceful fallbacks.
   - **Multi-Day Interactive Study Plans**: Breaks study plans into distinct days (Day 1, Day 2, etc.) with topics, estimated times, outcomes, interactive checkmarks, visual progress bars, and plan adjustment requests.
   - **Student-Friendly Explanations**: Simple English, analogies, bold terminology, step-by-step guidance, and concise Key Takeaways.
   - **Goal Discovery**: Uncovers the student's academic/personal goal, asking for deadline, current level, and daily available time **one question at a time**.
   - **Zero-Guilt Philosophy**: Practical anti-procrastination coaching (5-Minute Rule, Pomodoro) with supportive restarts after missed study sessions.
   - **Full Persistence**: Goal progress, task checkmarks, and chat history survive page reloads via `localStorage`.
2. **Suggested Quick Prompts**:
   - 📅 *Create my study plan*
   - ⚡ *Help me stop procrastinating*
   - ☑️ *Break my exam preparation into tasks*
   - ⏰ *Help me manage my time*
3. **Chat History Persistence**:
   - Automatically saves conversation history in browser `localStorage`.
   - Re-loads previous chats seamlessly on refresh.
   - Includes a safe "Clear Chat" button with confirmation prompt to reset anytime.
4. **Rich Interactive Chat**:
   - Welcome message on initial launch: *"Hi! I'm TinySteps AI. Tell me your study goals, and I'll help you take small steps towards achieving them."*
   - Enter key support (`Enter` to send, `Shift + Enter` for new lines).
   - Animated 3-dot typing indicator and disabled states during generation.
   - One-click "Copy" button on AI study plans to easily paste into notes.
5. **Secure Backend Architecture**:
   - Secure Express API (`/api/chat` and `/api/health`).
   - Official `@google/generative-ai` SDK.
   - **Zero API key exposure**: Gemini API key resides strictly in `backend/.env`.
   - Comprehensive error handling with friendly student-facing fallback messages.

---

## 🛠️ Tech Stack

- **Frontend**:
  - React 19
  - TypeScript
  - Vite 8
  - Lucide React (Icons)
  - React Markdown (Formatted output)
  - Remark GFM (Tables, tasklists, strikethrough)
  - Mermaid.js (Dynamic visual diagrams & flowcharts)
  - CSS3 (Variables, Flexbox/Grid, Keyframe Animations)
- **Backend**:
  - Node.js (v18+)
  - Express 4
  - `@google/generative-ai` (Official Google Gemini SDK)
  - `dotenv` (Environment management)
  - `cors` (Cross-Origin Resource Sharing)

---

## 📁 Project Structure

```text
TinySteps_AI/
├── package.json              # Root package with multi-runner scripts
├── README.md                 # Complete documentation & guide
├── backend/
│   ├── .env.example          # Sample environment variables
│   ├── .env                  # Backend secrets (GEMINI_API_KEY)
│   ├── package.json          # Express & Gemini dependencies
│   └── server.js             # Express API server & Gemini integration
└── frontend/
    ├── index.html            # HTML entry point with metadata
    ├── package.json          # React 19, TypeScript & Vite dependencies
    ├── tsconfig.json         # TypeScript configuration
    ├── vite.config.ts        # Vite configuration with API proxy
    └── src/
        ├── App.tsx           # Main application logic & state
        ├── App.css           # Lavender & dark-purple styling
        ├── index.css         # Global design tokens & reset
        ├── main.tsx          # React DOM root entry
        ├── components/
        │   ├── Header.tsx            # Header, status badge & clear chat
        │   ├── ChatMessage.tsx       # Message bubble & markdown renderer
        │   ├── ChatInput.tsx         # Textarea, Enter key & send button
        │   ├── SuggestedPrompts.tsx  # Quick-start suggested chips
        │   ├── TypingIndicator.tsx   # Animated bouncing dots
        │   ├── GoalCard.tsx          # Interactive multi-day roadmap & checklist
        │   ├── MermaidDiagram.tsx    # Responsive visual diagram renderer
        │   └── CodeBlock.tsx         # Syntax-styled code box with copy button
        ├── services/
        │   └── api.ts        # API client for backend communication
        ├── utils/
        │   └── goalParser.ts # Resilient JSON goal card extractor
        └── types/
            └── chat.ts       # TypeScript interfaces
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js** (v18.x or higher, v20+ recommended)
- **npm** (v9+)
- A **Google Gemini API Key** (Get free key from [Google AI Studio](https://aistudio.google.com/))

---

### 2. Configure Your Gemini API Key

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Open or create `.env` (you can copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
3. Add your Gemini API key in `backend/.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   PORT=5000
   GEMINI_MODEL=gemini-1.5-flash
   ```

---

### 3. Install Dependencies

You can install all dependencies from the root directory:
```bash
npm run install:all
```
*Or manually in each folder:*
```bash
cd backend && npm install
cd ../frontend && npm install
```

---

### 4. Run the Application

#### Option A: Run Both Together (Recommended)
From the root directory:
```bash
npm run dev
```
This concurrently starts:
- Backend server at `http://localhost:5000`
- Frontend Vite dev server at `http://localhost:5173`

#### Option B: Run Separately
**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:5173`**

---

## 🔌 API Endpoints

### `GET /api/health`
Returns backend health status and indicates if the Gemini API key is configured.
```json
{
  "status": "ok",
  "service": "TinySteps AI Backend",
  "apiKeyConfigured": true,
  "model": "gemini-1.5-flash"
}
```

### `POST /api/chat`
Handles student queries and returns study companion responses.
- **Request Body**:
  ```json
  {
    "message": "I have a biology test on Friday and haven't started!",
    "history": [
      { "sender": "ai", "text": "Hi! I'm TinySteps AI..." }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "reply": "Don't stress, you've got this! Let's take just one tiny step today..."
  }
  ```

---

## 🛡️ Security & Best Practices

- **API Key Protection**: The Gemini API key is stored exclusively on the backend in `.env` and is never exposed to the client bundle.
- **Input Validation**: Backend validates incoming messages to prevent malformed requests.
- **Resilient Fallbacks**: If the API key is not yet set or quota is exceeded, the UI displays clear, actionable feedback rather than crashing.

---

## 🌐 Deploy to Render

You can deploy TinySteps AI as a free full-stack web service on [Render](https://render.com) in under 3 minutes:

1. **Sign Up / Log In** to [render.com](https://render.com) with GitHub.
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select your repository: `TinySteps_AI`.
4. Render will auto-detect the included `render.yaml` blueprint, or you can configure manually:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Under **Environment Variables**:
   - `GEMINI_API_KEY`: *(Paste your Google Gemini API key)*
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite` *(or leave default)*
6. Click **Deploy Web Service**.
7. Once deployed, Render provides an SSL-enabled public URL (e.g. `https://tinysteps-ai.onrender.com`).

---

## 📄 License
MIT License. Created with ❤️ for students everywhere.
