# Insyd Backend

Express + SQLite (better-sqlite3) notification service with in-memory event queue.

## Run
```
npm install
npm run start
```

Env:
- `PORT` (default 4000)
- `FRONTEND_ORIGIN` (CORS origin, default `*`)

## API
- POST `/events` { type, sourceUserId, targetUserId?, data? }
- GET `/notifications/:userId`
- POST `/notifications/:userId/read`

## Dev
```
npm run dev
```