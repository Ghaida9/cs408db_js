# DB Systems Quiz - Project TODO

## Phase 1: Database & Backend
- [x] Extend schema with questions, userAnswers, gameSessions, userProgress, badges, userBadges tables
- [x] Run migration and apply SQL
- [x] Seed 20+ Database Systems questions (Easy/Medium/Hard)
- [x] Seed badge definitions (12 badges)
- [x] Build tRPC routers: quiz, game, progress, leaderboard

## Phase 2: AI Evaluation
- [x] Copy evaluation template to server/evaluation.ts
- [x] Integrate LLM-based answer evaluation with fuzzy + semantic + LLM scoring
- [x] Add hint generation endpoint
- [x] Add partial credit logic

## Phase 3: Frontend
- [x] Design system: dark theme, color palette, mobile-first layout
- [x] Login/Auth page (OAuth)
- [x] Home/Dashboard page with user stats
- [x] Quiz game screen (question display, answer input, progress bar)
- [x] Answer feedback screen (score, feedback, XP earned)
- [x] Stage completion screen
- [x] Game completion screen with badge unlock animation
- [x] Progress page (XP, level, badges earned/locked)
- [x] Leaderboard page
- [x] PWA manifest and service worker

## Phase 4: Gamification
- [x] XP calculation and level system
- [x] Badge unlock logic
- [x] Streak tracking
- [x] Leaderboard ranking
- [x] Social sharing buttons

## Phase 5: Testing & Polish
- [x] Write vitest tests for evaluation logic
- [x] Write vitest tests for game session management
- [x] Save checkpoint and deliver

## Phase 6: Llama 3.1 8B Integration
- [x] Add HUGGINGFACE_API_KEY secret
- [x] Create server/llama.ts HuggingFace Inference API client
- [x] Update evaluation.ts to use Llama 3.1 8B Instruct instead of Gemini
- [x] Update server/_core/env.ts to expose HUGGINGFACE_API_KEY
- [x] Write vitest tests for Llama integration
- [x] Save checkpoint and deliver

## Phase 7: Seed File
- [x] Generate seed.sql with all questions and badges

## Phase 8: Cleanup
- [x] Remove branding from UI (login screen, dashboard, footer badges)
- [x] Clean up code comments
- [x] Update package.json author/name metadata
- [x] Update app title and description
