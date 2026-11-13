const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5000';
const OUT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  // --- SCREENSHOT 1: Desktop Home Page (Light Mode) ---
  console.log('Capturing Screenshot 1: Desktop Home Page (Light Mode)...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      localStorage.setItem('tinysteps_theme', 'light');
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.prompts-grid');
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_1_desktop_home.png') });
    await page.close();
  }

  // --- SCREENSHOT 2: Mobile Responsive View (Light Mode) ---
  console.log('Capturing Screenshot 2: Mobile Responsive View...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      localStorage.setItem('tinysteps_theme', 'light');
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.prompts-grid');
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_2_mobile_view.png') });
    await page.close();
  }

  // --- SCREENSHOT 3: Interactive Goal Card & Progress Tracking (Light Mode) ---
  console.log('Capturing Screenshot 3: Interactive Goal Card & Progress Tracking...');
  {
    const sampleGoalData = {
      title: 'Full Stack Development (FSD) Unit 1 & 2 Exam Preparation',
      deadline: 'Friday, 5:00 PM',
      dailyTime: '45 mins/day',
      currentLevel: 'Intermediate',
      tasks: [
        { id: 't1', day: 'Day 1: HTML5 & CSS3 Architecture', title: 'Revise HTML5 semantic tags & CSS Flexbox/Grid layout patterns', estimatedTime: '20 mins', outcome: 'Master responsive flex containers & box model', completed: true },
        { id: 't2', day: 'Day 1: HTML5 & CSS3 Architecture', title: 'Practice CSS media queries for mobile-first responsiveness', estimatedTime: '25 mins', outcome: 'Working mobile layout without horizontal overflow', completed: true },
        { id: 't3', day: 'Day 2: JavaScript ES6+ & TypeScript', title: 'Review TypeScript interfaces, async/await, and array methods', estimatedTime: '25 mins', outcome: 'Confident in functional data manipulation & promises', completed: false },
        { id: 't4', day: 'Day 2: JavaScript ES6+ & TypeScript', title: 'Build client-side form validation & localStorage persistence', estimatedTime: '20 mins', outcome: 'State survives browser page reloads reliably', completed: false },
        { id: 't5', day: 'Day 3: Node.js & REST Integration', title: 'Implement Express API endpoints with error handling & failover', estimatedTime: '30 mins', outcome: 'Secure RESTful backend with Google Gemini SDK', completed: false }
      ]
    };

    const sampleMessages = [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Hi TinySteps! I have my Full Stack Development Exam in 3 days. Can you break down my revision into small daily goals?',
        timestamp: Date.now() - 120000
      },
      {
        id: 'msg-2',
        sender: 'ai',
        text: "You've got this! Breaking big exams into small 20–30 minute daily sessions prevents burnout and builds confidence. Here is your personalized step-by-step study plan:\n\n```goal_card\n" + JSON.stringify(sampleGoalData, null, 2) + "\n```\n\nTake it one small step at a time! Click the checkboxes as you complete each task to see your progress bar update.",
        timestamp: Date.now() - 60000,
        goalData: sampleGoalData
      }
    ];

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
    await page.evaluateOnNewDocument((msgs, goal) => {
      localStorage.setItem('tinysteps_chat_history', JSON.stringify(msgs));
      localStorage.setItem('tinysteps_active_goal', JSON.stringify(goal));
      localStorage.setItem('tinysteps_theme', 'light');
    }, sampleMessages, sampleGoalData);

    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.goal-card-widget');
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_3_interactive_goal_card.png') });
    await page.close();
  }

  // --- SCREENSHOT 4: Technical Concept Explanation with Mermaid Diagram & Table ---
  console.log('Capturing Screenshot 4: Technical Concept Explanation with Mermaid Diagram & Table...');
  {
    const diagramMessages = [
      {
        id: 'diag-u1',
        sender: 'user',
        text: 'Can you explain the Client-Server Architecture of our TinySteps AI application with a flowchart and comparison table?',
        timestamp: Date.now() - 90000
      },
      {
        id: 'diag-a1',
        sender: 'ai',
        text: `### TinySteps AI Full-Stack Architecture

Here is how data flows securely between the **Client (React + TypeScript)**, the **Express Backend Server**, and the **Google Gemini Generative AI Service**:

\`\`\`mermaid
flowchart LR
    A[Student Browser<br/>React 19 + TypeScript] -->|POST /api/chat<br/>User Message| B(Express.js Backend<br/>Node.js Server :5000)
    B -->|SDK Call with API Key<br/>Secure .env Isolation| C[(Google Gemini API<br/>gemini-3.5-flash-lite)]
    C -->|AI Coaching Response<br/>Markdown + JSON Plan| B
    B -->|JSON Response| A
    A -->|Persist History| D[(Client localStorage<br/>Chat & Goal Progress)]
\`\`\`

#### Key Component Comparison

| Layer / Component | Technology Stack | Responsibilities & Security Role |
| :--- | :--- | :--- |
| **Frontend Client** | React 19, TypeScript, Vite, CSS3 | Renders UI, handles student interactions, Mermaid SVGs, and localStorage state. |
| **Backend API** | Node.js, Express.js | Validates requests, shields Gemini API keys in \`.env\`, provides model failover. |
| **Generative AI** | Google Gemini Generative AI SDK | Generates empathetic study coaching, micro-tasks, and structured learning roadmaps. |

> **Key Takeaway:** Notice that the Google Gemini API key is **never exposed** to the client browser, strictly fulfilling modern full-stack web security requirements.`,
        timestamp: Date.now() - 30000
      }
    ];

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 960, deviceScaleFactor: 2 });
    await page.evaluateOnNewDocument((msgs) => {
      localStorage.setItem('tinysteps_chat_history', JSON.stringify(msgs));
      localStorage.removeItem('tinysteps_active_goal');
      localStorage.setItem('tinysteps_theme', 'light');
    }, diagramMessages);

    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.mermaid-svg-container svg, .mermaid-card');
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_4_mermaid_diagram_and_table.png') });
    await page.close();
  }

  // --- SCREENSHOT 5: Dark Mode Theme View ---
  console.log('Capturing Screenshot 5: Dark Mode Theme View...');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      localStorage.setItem('tinysteps_theme', 'dark');
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.chat-card');
    await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_5_dark_mode.png') });
    await page.close();
  }

  // --- SCREENSHOT 6: Interactive Goal Card in Dark Mode ---
  console.log('Capturing Screenshot 6: Interactive Goal Card in Dark Mode...');
  {
    const sampleGoalData = {
      title: 'Full Stack Development (FSD) Unit 1 & 2 Exam Preparation',
      deadline: 'Friday, 5:00 PM',
      dailyTime: '45 mins/day',
      currentLevel: 'Intermediate',
      tasks: [
        { id: 't1', day: 'Day 1: HTML5 & CSS3 Architecture', title: 'Revise HTML5 semantic tags & CSS Flexbox/Grid layout patterns', estimatedTime: '20 mins', outcome: 'Master responsive flex containers & box model', completed: true },
        { id: 't2', day: 'Day 1: HTML5 & CSS3 Architecture', title: 'Practice CSS media queries for mobile-first responsiveness', estimatedTime: '25 mins', outcome: 'Working mobile layout without horizontal overflow', completed: true },
        { id: 't3', day: 'Day 2: JavaScript ES6+ & TypeScript', title: 'Review TypeScript interfaces, async/await, and array methods', estimatedTime: '25 mins', outcome: 'Confident in functional data manipulation & promises', completed: false },
        { id: 't4', day: 'Day 2: JavaScript ES6+ & TypeScript', title: 'Build client-side form validation & localStorage persistence', estimatedTime: '20 mins', outcome: 'State survives browser page reloads reliably', completed: false },
        { id: 't5', day: 'Day 3: Node.js & REST Integration', title: 'Implement Express API endpoints with error handling & failover', estimatedTime: '30 mins', outcome: 'Secure RESTful backend with Google Gemini SDK', completed: false }
      ]
    };

    const sampleMessages = [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Hi TinySteps! I have my Full Stack Development Exam in 3 days. Can you break down my revision into small daily goals?',
        timestamp: Date.now() - 120000
      },
      {
        id: 'msg-2',
        sender: 'ai',
        text: "You've got this! Breaking big exams into small 20–30 minute daily sessions prevents burnout and builds confidence. Here is your personalized step-by-step study plan:\n\n```goal_card\n" + JSON.stringify(sampleGoalData, null, 2) + "\n```\n\nTake it one small step at a time! Click the checkboxes as you complete each task to see your progress bar update.",
        timestamp: Date.now() - 60000,
        goalData: sampleGoalData
      }
    ];

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
    await page.evaluateOnNewDocument((msgs, goal) => {
      localStorage.setItem('tinysteps_chat_history', JSON.stringify(msgs));
      localStorage.setItem('tinysteps_active_goal', JSON.stringify(goal));
      localStorage.setItem('tinysteps_theme', 'dark');
    }, sampleMessages, sampleGoalData);

    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.goal-card-widget');
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_6_dark_mode_goal_card.png') });
    await page.close();
  }

  await browser.close();
  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
