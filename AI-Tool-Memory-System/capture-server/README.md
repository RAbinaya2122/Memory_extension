# Capture Server — AI Tool Memory System

The Express backend and Telegram Bot server for capturing, categorizing, and managing AI tools using Google Gemini AI.

## Features
- **Express REST API**: Serves tools to the Chrome Extension.
- **Telegram Bot**: Listens for tool URLs in Telegram chat and saves them automatically.
- **Gemini AI Integration**: Uses `@google/genai` to analyze links and extract structured JSON metadata.
- **Local JSON Storage**: Persists data in `data/ai_tools.json` with safe read-modify-write operations.
- **Duplicate Detection**: Intelligently normalizes URLs and prevents duplicate records.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Set your keys:
   - `GEMINI_API_KEY`: Get from Google AI Studio.
   - `TELEGRAM_BOT_TOKEN`: Get from Telegram's `@BotFather`.
   - `PORT`: Default `3000`.

3. **Run Server**:
   ```bash
   npm run dev   # Development with auto-reload
   # or
   npm start     # Production
   ```

## API Endpoints
- `GET /api/health` — Check server status and total tool count.
- `GET /api/tools` — Retrieve all saved AI tools.
- `GET /api/tools/:id` — Retrieve a single tool record by ID.
- `POST /api/tools` — Save a new tool URL `{ "url": "https://gamma.app", "source": "extension" }`.
