# Solution Architecture & System Design

**Document Title:** Solution Architecture & System Design
**Sub-Title:** Structural Blueprint of NetLink.AI Systems
**Date of Submission:** July 14, 2026
**Team ID:** XXXXX (Placeholder: Manual replacement required)

***

## 1. Core Layer Diagram

The NetLink.AI platform is structured across three core layers to guarantee absolute security, scalability, and performance:

1. CLIENT LAYER (React SPA)
   - Serves the compiled index.html, CSS styles, and JavaScript assets.
   - Manages state hooks, form inputs, local authentication cookies, dashboard charts (Recharts), and transitions (Framer Motion).

2. MIDDLEWARE LAYER (Express REST Gateway)
   - Runs server-side on Node.js, listening exclusively on Port 3000.
   - Proxies request to external APIs, keeping GEMINI_API_KEY secure.
   - Integrates routing services: /api/auth, /api/suggestions, /api/feedback, /api/wikipedia.

3. RESOURCE LAYER (Data Stores & Services)
   - SQLite Database (networking_assistant.db) storing local records.
   - Google Gemini API Model (gemini-3.5-flash) providing deep reasoning.
   - Wikipedia API providing validated summaries.

## 2. Security Boundary Control

The system strictly enforces the API Key Security guidelines. The browser client has zero knowledge of the Gemini API key. All generations are handled via server-to-server POST requests, with extensive input cleaning to block injection vulnerabilities.

