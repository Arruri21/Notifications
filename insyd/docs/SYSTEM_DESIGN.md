# Insyd Notification System — System Design (POC)

## Introduction
Insyd needs a notification system to keep users engaged by surfacing activity from followed users, followers, and organic discovery. This POC targets 100 DAUs initially and outlines a path to scale to 1M DAUs.

## System Overview
- **Goal**: Deliver timely in-app notifications for events like likes, comments, follows, and new posts.
- **Scope (POC)**: In-app notifications only, no auth, no caching. Simple polling from frontend.

## Architecture
- **Event Source**: Client or backend services emit events (like, comment, follow, new_post).
- **Message Queue**: In-memory queue (POC). Future: Kafka/RabbitMQ for durability and scale.
- **Notification Service**: Consumes events, creates notifications.
- **Database**: SQLite (POC). Future: MongoDB/Postgres with sharding and read replicas.
- **Delivery**: In-app via polling (POC). Future: WebSockets or push/email via dedicated delivery workers.

Flow:
1) Event published to queue.
2) Worker consumes event, writes event log, generates notifications.
3) Notifications stored in DB.
4) Frontend polls and renders notifications.

High-level diagram (conceptual):

Frontend → POST /events → [Queue] → Worker → Notifications DB ← GET /notifications/:userId ← Frontend

## Data Design
- Users: { userId, username, email, preferences }
- Events: { eventId, type, sourceUserId, targetUserId, data, timestamp }
- Notifications: { notificationId, userId, type, content, status, timestamp }

SQLite schema (POC):
- `users(userId pk, username, email, preferences)`
- `events(eventId pk, type, sourceUserId, targetUserId, data, timestamp)`
- `notifications(notificationId pk, userId, type, content, status, timestamp)`
Indexes: `(notifications userId,timestamp)`, `(events timestamp)`

## API
- POST `/events`: { type, sourceUserId, targetUserId, data? }
- GET `/notifications/:userId` -> { notifications: [] }
- POST `/notifications/:userId/read`

## Scale and Performance
- 100 DAUs: single node service, SQLite (WAL), in-memory queue, polling every 2s.
- 1M DAUs:
  - Replace queue with Kafka/RabbitMQ; partition by userId.
  - Horizontal scale notification workers (stateless).
  - Move DB to MongoDB/Postgres; shard by userId, add read replicas.
  - Use Redis for rate limiting and dedupe/coalescing (e.g., like-burst aggregation).
  - Switch polling → WebSockets (with fanout via pub/sub per user).
  - Add write-behind and batch inserts for notifications.

## Trade-offs
- Polling is simpler but adds latency and unnecessary load; WebSockets reduce latency but add infra complexity.
- SQLite is great for POC; lacks horizontal scale; good WAL performance for small write volume.
- No caching keeps design simple; higher read latency under load.

## Limitations
- No auth; userId is client-provided for demo.
- Single process worker; queue is volatile; events lost on crash.
- No email/push delivery in POC.

## Conclusion
This POC demonstrates the core flow from event ingestion to notification delivery with a clear path to scale. It intentionally omits non-essential features to meet the assignment’s constraints.

