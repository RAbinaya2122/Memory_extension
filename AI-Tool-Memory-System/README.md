# AI Tool Memory System

A production-quality personal AI Tool Memory System that lets you capture AI tools from multiple sources (Instagram, YouTube, X, web), automatically analyze and categorize them using Google Gemini AI, permanently store them in a local JSON database, search and browse them through a Chrome Extension, and recall relevant tools inside **ChatGPT** and **Google Gemini**.

---

## Architecture Diagram

```
                AI TOOL MEMORY SYSTEM

   ┌──────────────────────┐
   │ Discovery Platforms  │
   │ YouTube / Instagram  │
   │ X / Websites         │
   └──────────┬───────────┘
              │
              │ Tool URL
              ▼
   ┌──────────────────────┐
   │ Capture Methods      │
   │                      │
   │  Telegram Bot        │
   │  Chrome Extension    │
   └──────────┬───────────┘
              │
              ▼
   ┌──────────────────────┐
   │ Node.js Backend      │
   │ Express + Processor  │
   └──────────┬───────────┘
              │
              ▼
         Gemini API
              │
              ▼
   Extract + Categorize
              │
              ▼
   Duplicate Detection
              │
              ▼
      ai_tools.json
              │
      ┌───────┴────────┐
      ▼                ▼
Extension Popup    LLM Injector
      │                │
Search / Filter    ChatGPT/Gemini
                       │
                       ▼
               Relevant Tool Recall
```

---

## Repository Structure

```
AI-Tool-Memory-System/
├── capture-server/
│   ├── data/
│   │   └── ai_tools.json     # Single source of truth database
│   ├── src/
│   │   ├── index.js          # Express REST API server
│   │   ├── telegram.js       # Telegraf Telegram Bot listener
│   │   ├── gemini.js         # @google/genai SDK extraction & schema validation
│   │   ├── storage.js        # Atomic file persistence & URL normalization
│   │   └── processor.js      # Central processTool(url, source) workflow
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── README.md
├── chrome-extension/
│   ├── public/
│   │   └── icons/            # Extension PNG icons (16, 48, 128)
│   ├── src/
│   │   ├── background/
│   │   │   └── background.ts # Manifest V3 service worker (caching & alarms)
│   │   ├── content/
│   │   │   └── content.ts    # ChatGPT & Google Gemini LLM context injector
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── ToolCard.tsx
│   │   │   ├── SaveToolForm.tsx
│   │   │   └── Popup.tsx
│   │   ├── hooks/
│   │   │   └── useTools.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── relevance.ts  # Client-side prompt relevance engine
│   │   │   └── types.ts
│   │   ├── popup/
│   │   │   ├── main.tsx
│   │   │   └── index.html
│   │   ├── App.tsx
│   │   └── index.css         # Dark theme (#0A0A0A) styling & glassmorphism
│   ├── manifest.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── README.md
└── README.md
```

---

## 1. Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/)
- **Telegram Bot Token** *(Optional)*: Token from [@BotFather](https://t.me/BotFather) on Telegram

---

### Step 1: Configure Capture Server Backend

1. Navigate to `capture-server`:
   ```bash
   cd capture-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
4. Fill in your API keys in `capture-server/.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   TELEGRAM_BOT_TOKEN=your_botfather_telegram_token
   PORT=3000
   ```
5. Start backend development server:
   ```bash
   npm run dev
   ```
   *The server will start at `http://localhost:3000`.*

---

### Step 2: How to Create Telegram Bot (via BotFather)

1. Open Telegram app and search for `@BotFather`.
2. Send `/newbot` command.
3. Choose a display name for your bot (e.g. `My AI Tool Memory`).
4. Choose a unique username ending in `bot` (e.g. `my_aitool_memory_bot`).
5. Copy the generated API token (e.g., `7123456789:AAF...`) and paste it into `TELEGRAM_BOT_TOKEN` in `capture-server/.env`.
6. Restart the backend server.

---

### Step 3: Build & Install Chrome Extension

1. Navigate to `chrome-extension`:
   ```bash
   cd ../chrome-extension
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the production extension bundle:
   ```bash
   npm run build
   ```
4. Load in Google Chrome:
   - Open Chrome and go to `chrome://extensions/`.
   - Enable **Developer mode** (toggle in upper right).
   - Click **Load unpacked**.
   - Select the `chrome-extension/dist` directory.

---

## 2. Real-World End-to-End Test Workflow

### Test 1: Capture via Telegram
1. Send an AI tool link to your Telegram bot (e.g., `https://gamma.app`).
2. Bot replies with Gemini-extracted tool name, category ("Presentation"), description, and tags.
3. Check `capture-server/data/ai_tools.json` to verify the tool record is saved.

### Test 2: Duplicate Detection
1. Send the same link again (`https://gamma.app/` or `https://gamma.app?ref=test`).
2. System normalizes the URL and detects duplicate record without adding a double entry.

### Test 3: Manual Extension Capture
1. Click the Chrome Extension popup icon.
2. Paste a tool URL (e.g., `https://klingai.com`).
3. Click **Analyze & Save**.
4. Gemini AI analyzes the URL and refreshes the tool list live in the popup UI.

### Test 4: Search & Category Filtering
1. Open Extension Popup.
2. Filter by category pills (e.g., `Presentation`, `Video`, `Coding`).
3. Search by tag or description keyword in the live search bar.

### Test 5: ChatGPT / Google Gemini Recall Injection
1. Open [ChatGPT](https://chatgpt.com) or [Google Gemini](https://gemini.google.com).
2. Type a query into the chat input, e.g.:
   `"I need to create a slide presentation for my startup pitch."`
3. The unobtrusive **✦ AI Memory** badge floats near the bottom right:
   `✦ AI Memory 1 saved tool relevant [Use Context]`
4. Click **Use Context** to insert the formatted context prompt block cleanly into the chat prompt.

---

## 3. DOM Resilience & Technical Safeguards

- **Multi-Selector Input Detection**: Evaluates `#prompt-textarea`, `div[contenteditable="true"]`, and `textarea` across ChatGPT and Gemini dynamically.
- **MutationObserver Watcher**: Binds to dynamically rendered input elements when switching conversations.
- **Graceful Error Handling**: If the backend server is stopped, the Chrome Extension popup and content script fall back to cached data without crashing the web page.
- **Atomic File Operations**: Safe read-modify-write pattern on `ai_tools.json` using temporary files to prevent data corruption.
