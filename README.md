# Personalized Networking Assistant (NetLink.AI)

An elite, full-stack cognitive relationship accelerator designed to empower professional event attendees. By utilizing Google Gemini generative AI coupled with live, zero-dependency Wikipedia factual verification, the platform crafts engaging, context-aware, and highly natural networking icebreakers, pitches, and dialogue strategies, completely eliminating social anxiety and shallow talk.

---

## Academic Submission Dossier Info
* **Course Submission**: Final Capstone Project
* **Submission Date**: July 14, 2026
* **Team ID**: `XXXXX` *(Placeholder: Please replace with your actual academic team ID prior to submission)*

This repository has been structured to contain both the **fully operational live application** (fully deployable on Render) and a **complete, professionally formatted Academic Dossier** containing 21 documentation modules in both Markdown (`.md`) and Portable Document Format (`.pdf`).

---

## 📂 Academic Documentation Structure
The following directories have been automatically generated at the root of the repository. Every directory contains high-quality academic documents in **Markdown** and **PDF** formats:

1. **`Brainstorming & Idea Prioritization/`**
   - `Brainstorming & Idea Prioritization.{md,pdf}`: Core session ideation matrix and selection rationales.
   - `Define Problem Statements.{md,pdf}`: In-depth breakdowns of user social and factual anxieties.
   - `Empathy Map.{md,pdf}`: Profile mapping of the representative user persona "Sarah".
2. **`2. Requirement Analysis/`**
   - `Customer Journey Map.{md,pdf}`: Journey stages, touchpoints, and systemic actions.
   - `Data Flow Diagram.{md,pdf}`: Process definitions, external APIs, and local SQL paths.
   - `SOLUTION REQUIREMENTS.{md,pdf}`: Formal functional and non-functional engineering standards.
   - `Technology Stack.{md,pdf}`: Full architecture mapping from browser client to cloud endpoints.
3. **`3. Project Design Phase/`**
   - `Problem-Solution Fit.{md,pdf}`: Matching target user pains to application solutions.
   - `Proposed Solution.{md,pdf}`: Core innovations, competitive features, and value drivers.
   - `Solution Architecture.{md,pdf}`: Three-tier design system, network borders, and routing gateways.
4. **`4. Project Planning Phase/`**
   - `Initial Project Planning Template.{md,pdf}`: Gantt-style development sprints and milestone logs.
5. **`5. Project Development Phase/`**
   - `Code Layout Readability and Reusability.{md,pdf}`: Project modularity and file decoupling reviews.
   - `Coding & Solution.{md,pdf}`: In-depth breakdowns of core coding mechanisms (Gemini logic, Wiki query handlers).
   - `Number of Functional Features Included.{md,pdf}`: Comprehensive audits of all 6 active functional modules.
6. **`6. Project Testing/`**
   - `Performance Testing.{md,pdf}`: SQL transaction benchmarks and AI response latency audits.
7. **`7. Project Documentation/`**
   - `Project Demonstration.{md,pdf}`: Complete step-by-step user walkthrough and showcasing guide.
   - `Project Executable Files.{md,pdf}`: Build routines, dependencies, and local hosting configurations.
8. **`8. Project Demonstration/`**
   - `Demonstration of Proposed Features.{md,pdf}`: presentation timelines and core criteria checks.
   - `Project Demo Planning.{md,pdf}`: 10-minute presentation guide and technical Q&A scripts.
   - `Scalability Future Plan.{md,pdf}`: Industrial scaling plans (PostgreSQL migrations, TTS engines, calendar syncs).
   - `Team Involvement in Demonstration.{md,pdf}`: Defense roles, responsibilities, and presentation guidelines.

---

## 🛠️ Technology Stack
* **Frontend**: React 18+, TypeScript, Lucide Icons, Tailwind CSS, Motion (Framer Motion animations), Recharts (Dashboard analytics).
* **Backend**: Node.js, Express, tsx (dev runner), esbuild (production bundler compiling to high-performance CJS).
* **Database**: SQLite3 (`sqlite3` module with secure, parameterized promise-based transactions).
* **AI & Integration Services**:
  - **Google Gemini API** (`@google/genai` TypeScript SDK via model `gemini-3.5-flash`): Executes multi-stage linguistic reasoning.
  - **Wikipedia REST API**: On-demand search query engine providing factual abstracts to prevent AI hallucination.

---

## 🎯 Key Implemented Features
1. **User Profile & Registration Engine**: Hash-secured password access (via `bcryptjs`), and complete professional background profile customizer (Profession, Role, Company, Career Goals, Interests).
2. **Interactive Plan Selection**: Onboarding supporting Basic, Executive, and Sovereign Enterprise tiers. Prompts the user with customizable payment inputs for premium tiers.
3. **Real-time Wikipedia Fact-Checker**: On-demand lookup of technical terminologies or speaker topics, providing live summary cards prior to generation.
4. **22-Category AI Generative Script Engine**: Executes deep multi-stage prompt synthesis server-side, organizing custom verbal starters across lobbies, elevators, coffee breaks, speaker panels, and follow-up templates.
5. **Connection History Logging**: Saves previous run records, event metadata, and generated suggestions in a structured SQLite database.
6. **Interactive Feedback & SaaS Dashboard**: Enables users to rate starters, leave text comments, and toggle likes/dislikes, populating an analytical SVG dashboard.

---

## 💾 Database Schema Overview
The SQLite database file `networking_assistant.db` stores all local records under four core relational tables:
* `users`: Stores user IDs, emails, hashed passwords, professional fields, goals, and premium price configurations.
* `sessions`: Handles local user active authentication states.
* `history`: Stores completed generation details, inputs, and raw suggestion categories in structured JSON formats.
* `feedback`: Logs star ratings, likes, dislikes, and qualitative suggestions connected directly to history rows.

---

## 🔒 Security Note & API Key Integrity
In strict compliance with modern full-stack engineering guidelines:
- **No Client-Side Secrets**: All third-party interactions and API keys are completely isolated on the server. The client browser has no access to the `GEMINI_API_KEY`.
- **Environment Isolation**: API credentials are loaded dynamically on-demand from environment variables (`process.env.GEMINI_API_KEY`), preventing memory leak crashes.
- **Secure Authentication**: Credentials are encrypted using salt-rounds before database writes. All database queries use strictly parameterized inputs to prevent SQL Injection.

---

## 🚀 Installation & Local Execution

### 1. Pre-requisites
Ensure you have Node.js (v18 or v20 LTS) installed on your system.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the project's root folder and add the following configuration:
```env
GEMINI_API_KEY="your_actual_google_gemini_api_key_here"
DATABASE_URL="sqlite://networking_assistant.db"
NODE_ENV="development"
```
*(Note: Never check your actual .env file or credentials into GitHub).*

### 4. Run in Development Mode
This starts the Node Express backend on port 3000, which automatically mounts the Vite frontend client as dynamic middleware:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build & Run in Production
To bundle the frontend and compile the backend into a high-performance, single CJS file:
```bash
npm run build
npm run start
```

---

## 🌐 Production Deployment on Render
This full-stack codebase is fully optimized for containerized deployments on **Render**:

1. **Web Service Setup**: Connect this repository to your Render panel.
2. **Environment/Runtime**: Select `Node`.
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm run start`
5. **Environment Configurations**:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: `your_secure_google_gemini_api_key_here`
6. **Database Persistence**: To ensure your database file does not reset on server redeploys, attach a **Persistent Disk** on Render:
   - **Mount Path**: `/var/data`
   - **Environment Variable**: `DATABASE_URL="/var/data/networking_assistant.db"`
   - *(Note: The sqlite service automatically creates and configures tables inside `/var/data` on boot).*
