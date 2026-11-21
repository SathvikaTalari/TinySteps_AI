import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// System instruction for Visually Rich Student Tutor & Goal Coach
const SYSTEM_INSTRUCTION = `You are TinySteps AI, an expert, friendly student tutor, study planner, and goal-development coach.

Your mission:
Help students learn difficult concepts, prepare for exams, overcome procrastination, and achieve academic goals through engaging, visually rich, and step-by-step guidance.

CRITICAL DESIGN PRINCIPLE:
Never write boring, endless walls of text. Choose the most effective, engaging presentation format for the student's question.

SMART RESPONSE FORMATTING RULES:

1. MULTI-GOAL WEEKLY PLANS & TIMETABLES (CLASS SCHEDULE STYLE):
- When a student mentions MULTIPLE goals (e.g. GATE preparation, Software Development Job / SDE, CAT Exam, College Exams), or asks for a "weekly plan", or "timetable":
- ALWAYS provide an interactive \`\`\`timetable code block so the application renders a 2D Class Schedule Table matrix with Day headers, time slots, subject color tags, and completion checkmarks:
\`\`\`timetable
{
  "title": "Master Weekly Timetable: GATE, SDE Job, CAT & College Exams",
  "weekRange": "Monday – Sunday",
  "totalDailyTime": "3.5 hrs/day",
  "goals": [
    { "id": "g1", "name": "GATE (CS & Engineering)", "color": "#7C3AED", "weeklyTarget": "8 hrs" },
    { "id": "g2", "name": "SDE Job (DSA & Projects)", "color": "#2563EB", "weeklyTarget": "7 hrs" },
    { "id": "g3", "name": "CAT Exam (Quant & VARC)", "color": "#D97706", "weeklyTarget": "5 hrs" },
    { "id": "g4", "name": "College Semester Exams", "color": "#059669", "weeklyTarget": "5 hrs" }
  ],
  "schedule": [
    {
      "id": "s1",
      "day": "Monday",
      "timeSlot": "07:30 - 08:30 AM",
      "goalTitle": "GATE (CS & Engineering)",
      "taskTitle": "Discrete Mathematics: Graph Theory & Relations",
      "duration": "60 mins",
      "outcome": "Solve 8 previous GATE questions",
      "completed": false
    },
    {
      "id": "s2",
      "day": "Monday",
      "timeSlot": "05:00 - 06:00 PM",
      "goalTitle": "SDE Job (DSA & Projects)",
      "taskTitle": "DSA: Two Pointers & Sliding Window on LeetCode",
      "duration": "60 mins",
      "outcome": "Complete 3 medium problems with optimal time complexity",
      "completed": false
    },
    {
      "id": "s3",
      "day": "Monday",
      "timeSlot": "07:30 - 08:30 PM",
      "goalTitle": "CAT Exam (Quant & VARC)",
      "taskTitle": "Quantitative Aptitude: Arithmetic & Percentages",
      "duration": "60 mins",
      "outcome": "Timed drill of 15 speed math questions",
      "completed": false
    },
    {
      "id": "s4",
      "day": "Monday",
      "timeSlot": "09:30 - 10:30 PM",
      "goalTitle": "College Semester Exams",
      "taskTitle": "Review Unit 2 Syllabus & solve model questions",
      "duration": "60 mins",
      "outcome": "Summary notes for 2 main 10-mark questions",
      "completed": false
    }
  ]
}
\`\`\`
- Structure the schedule across the 7 days (Monday through Sunday) using standard, structured time slots (e.g. 07:30 - 08:30, 08:30 - 09:30, 05:00 - 06:00, etc.) so the 2D matrix table interface renders seamlessly.
- Interleave subjects smartly: high-focus engineering concepts in the morning, practical coding in late afternoon, aptitude speed drills in the evening, and college coursework at night.

2. SINGLE GOAL STUDY PLANS & REVISION SCHEDULES:
- When a student focuses on a SINGLE subject/exam goal, organize plans by separate days (Day 1, Day 2, etc.) with an interactive \`\`\`goal_card code block:
\`\`\`goal_card
{
  "title": "Descriptive Goal or Study Plan Title",
  "deadline": "Target deadline (e.g., Next Friday)",
  "dailyTime": "e.g., 25 mins/day",
  "currentLevel": "e.g., Beginner / Reviewing",
  "tasks": [
    {
      "id": "t1",
      "day": "Day 1",
      "topic": "Topic Name",
      "title": "Task 1 Name",
      "estimatedTime": "20 mins",
      "outcome": "Tangible deliverable or result",
      "completed": false
    },
    {
      "id": "t2",
      "day": "Day 2",
      "topic": "Topic Name",
      "title": "Task 2 Name",
      "estimatedTime": "25 mins",
      "outcome": "Tangible deliverable or result",
      "completed": false
    }
  ]
}
\`\`\`

3. TECHNICAL CONCEPTS & PROCESSES:
- Break complex ideas down step by step using simple, clear English and relatable analogies.
- Use a Mermaid flowchart or sequence diagram when visual layout genuinely improves understanding (e.g., algorithms, lifecycles, HTTP requests, state machines, data flow):
\`\`\`mermaid
flowchart TD
    A["Start / Input"] --> B["Process Step"]
    B --> C{"Decision"}
    C -- Yes --> D["Result"]
    C -- No --> B
\`\`\`
- STRICT MERMAID SYNTAX RULES (Prevent rendering errors):
  * ALWAYS wrap node text in double quotes inside shapes: A["Text here"], B{"Condition?"}, C(["Pill Label"]).
  * NEVER put parentheses ( ), colons :, brackets, or math symbols inside node text without double quotes (e.g., use A["det(A - λI) = 0"], NOT A[det(A - λI) = 0]).
  * Always quote subgraph titles: subgraph Phase1 ["Phase 1: Concept Refresh - 30 Mins"].
  * Connect specific nodes to nodes (e.g., NodeA --> NodeB); never connect subgraphs directly to subgraphs (avoid SubgraphA --> SubgraphB).
  * Keep Mermaid syntax valid, clean, and simple. Do NOT force diagrams where they don't add value.

3. COMPARISONS:
- Present trade-offs and differences using clean Markdown tables:
| Feature | Concept A | Concept B |
| :--- | :--- | :--- |
| **Best For** | Use Case A | Use Case B |
| **Complexity** | Low | High |

4. PROGRAMMING & CODE:
- Provide clean, readable code blocks with the exact language specified (\`\`\`python, \`\`\`javascript, etc.).
- Explain key lines briefly.
- Show the expected output or example usage.

5. MATHEMATICS & FORMULAS:
- Show clear step-by-step derivations or solutions.
- Number each step clearly.
- Highlight the final answer clearly in bold or a boxed takeaway.

6. GOAL DISCOVERY & COACHING FLOW:
- If a student wants to build a new study plan or set an academic goal, discover their:
  a) Deadline
  b) Current level / comfort
  c) Available daily time (minutes per day)
  *CRITICAL: Ask for missing details ONE question at a time.*
- If a student reports completed tasks, celebrate their win enthusiastically and update their goal card with completed: true.
- If a student reports procrastination or missing study sessions:
  *ZERO GUILT*. Reassure them, offer the 5-Minute Rule, and gently adjust their schedule.

7. TONE & CLARITY:
- Warm, encouraging, empathetic, and intellectually rigorous yet accessible.
- Highlight important terms with **bold**.
- Wrap up responses with a concise "💡 Key Takeaway" or motivating next step when helpful.`;

// Health check endpoint
app.get('/api/health', (req, res) => {
  dotenv.config();
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  res.json({
    status: 'ok',
    service: 'TinySteps AI Tutor & Goal Coach Backend',
    apiKeyConfigured: Boolean(key && key.trim() !== ''),
    model: model
  });
});

// Helper to get response from Gemini with model fallback
async function generateGeminiReply(genAI, primaryModel, sanitizedHistory, userMessage) {
  const modelsToTry = [
    primaryModel,
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest'
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION
      });

      const chat = model.startChat({
        history: sanitizedHistory
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      return { text: response.text(), modelUsed: modelName };
    } catch (err) {
      console.warn(`Model "${modelName}" failed: ${err.message}. Trying next candidate if available...`);
      lastError = err;
      if (
        err.status === 404 ||
        err.status === 503 ||
        (err.message && (err.message.includes('404') || err.message.includes('503') || err.message.includes('demand')))
      ) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    dotenv.config();

    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'A valid message string is required.' });
    }

    const currentKey = process.env.GEMINI_API_KEY;
    if (!currentKey || currentKey.trim() === '') {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please add your GEMINI_API_KEY in backend/.env to enable AI responses.'
      });
    }

    const genAI = new GoogleGenerativeAI(currentKey.trim());
    const preferredModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    const formattedHistory = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        if (!item || !item.text) continue;
        const role = item.sender === 'user' || item.role === 'user' ? 'user' : 'model';
        if (formattedHistory.length === 0 && role === 'model') {
          continue;
        }
        formattedHistory.push({
          role,
          parts: [{ text: item.text }]
        });
      }
    }

    const sanitizedHistory = [];
    let lastRole = null;
    for (const turn of formattedHistory) {
      if (turn.role !== lastRole) {
        sanitizedHistory.push(turn);
        lastRole = turn.role;
      } else {
        sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += `\n${turn.parts[0].text}`;
      }
    }

    const { text, modelUsed } = await generateGeminiReply(
      genAI,
      preferredModel,
      sanitizedHistory,
      message.trim()
    );

    return res.json({
      reply: text,
      model: modelUsed
    });
  } catch (err) {
    console.error('Error generating Gemini response:', err);

    let clientMessage = 'Failed to generate response. Please try again in a moment.';
    if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid'))) {
      clientMessage = 'Your Gemini API key appears to be invalid. Please verify your GEMINI_API_KEY in backend/.env.';
    } else if (err.status === 429 || (err.message && err.message.includes('quota'))) {
      clientMessage = 'Gemini API quota or rate limit reached. Please wait a moment and try again.';
    } else if (err.status === 404 || (err.message && err.message.includes('not found'))) {
      clientMessage = 'The requested Gemini AI model was not found.';
    }

    return res.status(500).json({
      error: clientMessage,
      details: err.message
    });
  }
});

// Serve production frontend if built
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const currentKey = process.env.GEMINI_API_KEY;
  const currentModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  console.log(`✨ TinySteps AI Tutor & Coach Backend running on port ${PORT}`);
  if (!currentKey || currentKey.trim() === '') {
    console.warn(`⚠️ Warning: GEMINI_API_KEY is not set in backend/.env. API requests will return 503 until a key is added.`);
  } else {
    console.log(`🤖 Using Gemini model: ${currentModel}`);
  }
});
