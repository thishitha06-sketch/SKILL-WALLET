# Data Flow Diagram Analysis

**Document Title:** Data Flow Diagram Analysis
**Sub-Title:** System Processes & Information Transmission Channels
**Date of Submission:** July 14, 2026
**Team ID:** XXXXX (Placeholder: Manual replacement required)

***

## 1. Architectural Boundaries

The system operates as a classic, secure three-tier application. Client interactions are proxied through a Node/Express backend to keep external APIs and database transactions protected. Below is the structured flow of data across system processes.

## 2. Core Data Flows

- DF1 (User to Client UI): User inputs professional metadata, custom subscription budgets, or event descriptions.
- DF2 (Client UI to Express Server): Express endpoints receive HTTP POST/GET requests (e.g. /api/auth, /api/suggestions/generate).
- DF3 (Express Server to Wikipedia REST API): Queries are sent to Wikipedia. Returns verified abstracts/Desktop URLs (Factual Grounds).
- DF4 (Express Server to Google Gemini Model): Consolidated prompt (including User Profile, Wikipedia Context, and History constraints) is dispatched securely to model gemini-3.5-flash.
- DF5 (Gemini to Express Server): Structured JSON payload containing curated categories is returned, validated, and processed.
- DF6 (Express Server to SQLite Database): Historical logs, extracted topics, user settings, and ratings are stored using persistent transaction queries in networking_assistant.db.
- DF7 (Express Server to Client UI): Processed suggestions and updated SaaS statistics are sent back as JSON for rich frontend rendering.

## 3. Data Store Definitions

- Sessions Table: Manages user login states.
- Users Table: Stores salt-hashed credentials, profession, goals, and customized plan parameters.
- ConversationHistory Table: Stores extracted topics, event descriptions, and structured JSON suggestions.
- Feedback Table: Stores ratings, likes, dislikes, and text comments for analytics dashboard rendering.

