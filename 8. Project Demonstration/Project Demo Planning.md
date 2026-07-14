# Project Presentation & Demo Planning

**Document Title:** Project Presentation & Demo Planning
**Sub-Title:** Agenda & Strategy for Live Academic Defense
**Date of Submission:** July 14, 2026
**Team ID:** XXXXX (Placeholder: Manual replacement required)

***

## 1. Presentation Structure (10-Minute Limit)

- Minute 0-2: Problem space analysis & value proposition of factual grounding.
- Minute 2-4: Core architecture walkthrough (React front-end, Node/Express backend, SQLite database, Gemini API).
- Minute 4-8: Live application demonstration (Sign up, custom tier selection, Wikipedia grounding check, AI script generation, ratings logging, analytics dashboard update).
- Minute 8-10: Q&A session with the academic committee.

## 2. Handling Technical Q&A

- Question: "How do you avoid AI hallucinations?" -> Answer: By implementing an on-demand Wikipedia search prior to generation, injecting verified abstract context directly into the Gemini prompt.
- Question: "How are API keys secured?" -> Answer: All keys are stored in secure environment variables, processed strictly on the Express backend, and never exposed to the client browser.
- Question: "Why did you choose SQLite?" -> Answer: SQLite offers zero-config, highly rapid file transactions, making it perfect for rapid local deployments.

