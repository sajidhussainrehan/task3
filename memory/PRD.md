# نادي بارع الشبابي - Youth Club Points Tracker

## Original Problem Statement
Arabic-language web app for "نادي بارع الشبابي" (Barea Youth Club) to track student points earned in activities.

## Tech Stack
- Frontend: React.js, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, MongoDB (motor async driver)

## Architecture
```
/app/backend/server.py       - All API endpoints
/app/frontend/src/pages/
  AdminPage.jsx               - Admin dashboard (4 tabs: students, tasks, competitions, league)
  HomePage.jsx                - Public leaderboard
  StudentProfilePage.jsx      - Individual student page (QR destination)
  QuizPage.jsx                - Standalone quiz page
  ViewerPage.jsx              - Read-only spectator view
```

## What's Implemented
- [x] Student CRUD with image cropping
- [x] Team management (4 teams with colors/icons)
- [x] QR code generation + bulk printing
- [x] Points system (add/deduct with emoji categories)
- [x] Custom points for individual student
- [x] Team-wide points (apply to all team members at once)
- [x] Star Player (نجم الدوري)
- [x] Top 10 leaderboard
- [x] Competitions CRUD + quiz answering with auto-scoring
- [x] Football league management (matches, standings)
- [x] Spectator/Viewer page (read-only)
- [x] Admin PIN protection (171920)
- [x] Student page isolated (no external links)
- [x] QR code regeneration (invalidate old codes)
- [x] Weekly Tasks System:
  - Auto-distribute 4 tasks to all teams
  - Adhan/Speech: admin assigns specific student
  - Social: students reserve items (قهوة/شاي/حلى/سمبوسة)
  - Items are exclusive per team (one student per item)
  - Special Dinner: manual task by admin
  - Tasks can be cleared manually or auto-scheduled

## Routes
- `/` - Homepage
- `/admin` - Admin (PIN: 171920)
- `/student/:studentId` - Student profile
- `/quiz/:competitionId` - Quiz
- `/viewer` - Spectator view

## Testing: 100% (iteration_3.json - 34/34 passed)
