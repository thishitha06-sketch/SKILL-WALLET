# Technology Stack Documentation

**Document Title:** Technology Stack Documentation
**Sub-Title:** Detailed Architectural Frameworks & Dependencies
**Date of Submission:** July 14, 2026
**Team ID:** XXXXX (Placeholder: Manual replacement required)

***

## 1. Frontend Environment

- Framework: React 18+ (utilizing modern functional components, state hooks, and side-effect hooks).
- Bundler: Vite (configured with ESM and fast client-side hot-reloads).
- Styling Engine: Tailwind CSS (modern @import "tailwindcss" syntax with integrated CSS variables).
- Animations: motion/react (Framer Motion) for hardware-accelerated transitions and interactive modal states.
- Iconography: Lucide React (vector-based, styled dynamically using Tailwind classes).
- Data Visuals: Recharts (for rendering high-contrast SVG trend charts and feedback metrics on the dashboard).

## 2. Backend Environment

- Runtime: Node.js (v18 or v20 LTS).
- Web Server: Express.js (handling API routing, CORS, static file serving, and JSON request parsers).
- TypeScript Compiler & Runner: tsx (for execution during development) and esbuild (bundling the server to node CJS during production).
- Log System: Custom console logger routing server info, warning, and error logs.

## 3. Database & Core Services

- Database: SQLite3 — A self-contained, file-based relational engine requiring zero network configurations. Active database stored locally at /networking_assistant.db.
- SDK Core AI: @google/genai (TypeScript SDK initialized server-side utilizing model gemini-3.5-flash).
- Knowledge API: Wikipedia REST and Action APIs.

