# Personalized Networking Assistant

A production-ready full-stack web application designed to help professional event attendees craft engaging, context-aware, and highly natural networking conversation starters.

## Tech Stack
* **Frontend**: React 19, TypeScript, Lucide Icons, Tailwind CSS, Motion (Animations)
* **Backend**: Node.js, Express, tsx, esbuild
* **AI & Integration**:
  * **Google Gemini API** (`@google/genai`): Handles contextual generation of conversational starters based on event contexts and user interests.
  * **DistilBERT-style Topic Model Simulation**: Extracts keywords, overarching industry themes, and deduplicates top topics.
  * **Wikipedia REST API**: Verifies complex frameworks, terms, or speakers in real-time.
* **Database**: SQLite (`sqlite3` module with full async/promise-based wrappers).

---

## Key Features

1. **Event Theme Extraction**: Analyze any professional conference description, resolving industry categories, technical keywords, and core topics.
2. **Personalized Starters**: Leverage Gemini 3.5 Flash to write professional, natural, and unique icebreakers adjusted to specific social scenarios and user interests.
3. **Interactive Fact-Checker**: Lookup buzzwords or technologies on Wikipedia with instant desktop article links.
4. **Conversation History**: Every generation is saved locally in SQLite, supporting easy reloading or deletions.
5. **Feedback Loop**: Likes and dislikes are stored along with suggestion logs to evaluate quality.

---

## Project Structure

```text
├── .env.example              # Template for environment configuration
├── index.html                # Entry HTML document
├── package.json              # Full-stack dependencies and commands
├── server.ts                 # Main Express server entry point (Vite routing integration)
├── tsconfig.json             # TypeScript rules
├── vite.config.ts            # Vite asset configurations
├── metadata.json             # AI Studio platform parameters
│
├── server/                   # Server Services Directory
│   ├── db.ts                 # Database Service (sqlite3 initialization & tables)
│   ├── logger.ts             # Logger Service (requests, database, API logs)
│   └── services/
│       ├── gemini.ts         # Gemini API client wrapper
│       ├── topic.ts          # DistilBERT simulation and NLP theme extractor
│       ├── factcheck.ts      # Wikipedia REST API query service
│       ├── conversation.ts   # Contextual generator logic (Gemini models)
│       ├── history.ts        # SQLite storage transactions for logs
│       └── feedback.ts       # SQLite storage transactions for user likes/dislikes
│
└── src/                      # Client-Side Directory
    ├── App.tsx               # Primary React dashboard orchestrator
    ├── main.tsx              # React mounting root
    ├── index.css             # Tailwind styling configuration
    ├── types.ts              # Share client-side TypeScript interfaces
    └── components/
        ├── InputForm.tsx     # Context & Interests builder form with presets
        ├── StarterList.tsx   # Icebreakers panel (Copy clipboard, 👍 / 👎 actions)
        ├── FactChecker.tsx   # Buzzwords lookup searching Wikipedia
        └── HistorySection.tsx# Persistent SQLite history log cards
```

---

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Duplicate `.env.example` as `.env` and fill out your variables:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   DATABASE_URL="sqlite://networking_assistant.db"
   APP_NAME="Personalized Networking Assistant"
   DEBUG="true"
   ```

3. **Running in Development**:
   Starts Express server on port 3000 which automatically mounts the Vite React dev server as middleware:
   ```bash
   npm run dev
   ```

4. **Production Build & Execution**:
   Builds the React client to static assets and bundles the Node server using esbuild:
   ```bash
   npm run build
   npm run start
   ```

---

## API Documentation

* `GET /health`: Checks system and database connection readiness.
* `POST /generate-conversation`: Input `{ eventDescription: string, interests: string }`. Returns theme extraction and conversation starters, saving them into history.
* `POST /fact-check`: Input `{ query: string }`. Queries Wikipedia and returns the summary and desktop article URL.
* `GET /history`: Returns a list of past generation records, sorted newest first.
* `DELETE /history/:id`: Deletes a specific generation item from the SQLite history log.
* `POST /feedback`: Input `{ conversationId: number, suggestion: string, feedback: 'like' | 'dislike' }`. Saves user ratings.

---

## Render Deployment Instructions

This application is fully production-ready and optimized for deployment on **Render**.

### Step-by-Step Deployment on Render

1. **Create a Render Account**: Sign up at [render.com](https://render.com).
2. **Create a New Web Service**:
   - Click **New +** and select **Web Service**.
   - Connect your GitHub or GitLab repository containing this codebase.
3. **Configure the Settings**:
   - **Name**: `personalized-networking-assistant` (or your preferred name)
   - **Environment/Runtime**: `Node`
   - **Region**: Select the region closest to your users.
   - **Branch**: `main` (or your deployment branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. **Configure Environment Variables**:
   Under the **Environment** tab of your service, add the following key-value pairs:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: `your_actual_google_gemini_api_key`
   - `APP_NAME`: `Personalized Networking Assistant`
5. **(Optional) Database Persistence with Render Disks**:
   By default, SQLite creates the `networking_assistant.db` file in the application's root directory. Since Render free tier web services have ephemeral filesystems (changes are lost on restart/redeploy), to persist your history permanently:
   - Upgrade to a Paid Individual instance type (Starter plan or higher).
   - Go to **Disks** -> **Add Disk**.
   - **Name**: `db-volume`
   - **Mount Path**: `/var/data`
   - **Size**: `1 GiB` (minimum)
   - In your Render environment variables, add:
     - `DATABASE_URL`: `/var/data/networking_assistant.db`
     - *(Note: The database service automatically handles database file creation at whatever path is defined).*
6. **Deploy**:
   Click **Deploy Web Service**. Render will build the React application, bundle the Express server with esbuild, and spin up the production Node container. Once the service is live, you can access your personalized networking assistant at the provided `.onrender.com` URL!
