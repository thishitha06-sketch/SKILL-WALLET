# Project Execution & Deployment Guide

**Document Title:** Project Execution & Deployment Guide
**Sub-Title:** Local Running & Render Deployment Configurations
**Date of Submission:** July 14, 2026
**Team ID:** XXXXX (Placeholder: Manual replacement required)

***

## 1. Local Development Execution

Follow these simple steps to run the application on your local machine:

1. Install Dependencies:
   Execute 'npm install' in the workspace root directory.
2. Configure Environment:
   Create a '.env' file in the root directory and add:
   GEMINI_API_KEY=your_gemini_api_key
   NODE_ENV=development
3. Start the Dev Server:
   Run 'npm run dev'. This starts Vite and the Express backend on port 3000.

## 2. Production Compilation & Packaging

To bundle the full-stack system for production:
1. Run 'npm run build'.
2. This compiles the frontend assets into 'dist/' and bundles the Express 'server.ts' using 'esbuild' into 'dist/server.cjs'.
3. Run 'npm run start' to launch the production-ready CJS server.

## 3. Production Deployment on Render

The system is pre-configured for Render.
- Build Command: npm run build
- Start Command: npm run start
- SQLite Persistence: In Render, configure a persistent disk mounted at '/var/data' and set 'DATABASE_URL=/var/data/networking_assistant.db' to prevent data loss on server redeployment.

