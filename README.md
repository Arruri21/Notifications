# Insyd Notifications POC

Monorepo with backend (Express + SQLite) and frontend (React + Vite) plus docs.

## Quick start

Terminal 1:
```
cd insyd/backend
npm install
npm run start
```

Terminal 2:
```
cd insyd/frontend
npm install
cp .env.example .env # adjust if backend is remote
npm run dev
```

Open the frontend URL printed by Vite (e.g., http://localhost:5173). Choose a user (userA or userB), trigger events, and see notifications appear.

## Docs
- insyd/docs/SYSTEM_DESIGN.md