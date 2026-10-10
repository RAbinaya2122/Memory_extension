# Chrome Extension — AI Tool Memory System

React + Vite + TypeScript + Manifest V3 Chrome Extension for searching, browsing, manually saving, and recalling AI tools inside ChatGPT and Google Gemini.

## Features
- **Sleek Popup UI**: Dark mode (#0A0A0A base) with glassmorphism, instant multi-field search, category filter pills, and manual URL capture.
- **Manifest V3 Background Service Worker**: Local storage caching (`chrome.storage.local`), API sync with backend, and messaging.
- **ChatGPT & Google Gemini LLM Injector**: Content script detects prompt input, runs client-side relevance scoring, displays an unobtrusive `✦ AI Memory` badge, and formats context insertion.

## Build & Load Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build Production Extension**:
   ```bash
   npm run build
   ```
   This compiles all code into the `dist/` directory.

3. **Load Unpacked Extension in Google Chrome**:
   1. Open Chrome and navigate to `chrome://extensions/`.
   2. Enable **Developer mode** in the top right corner.
   3. Click **Load unpacked**.
   4. Select the `AI-Tool-Memory-System/chrome-extension/dist` (or `chrome-extension`) folder.
   5. Pin the **AI Tool Memory** icon to your Chrome toolbar.
