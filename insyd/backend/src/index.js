import express from 'express';
import cors from 'cors';
import { initializeSchema, getNotificationsByUser, markAllRead } from './db.js';
import { enqueueEvent, startWorker } from './queue.js';

const app = express();
const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.FRONTEND_ORIGIN || '*';

app.use(cors({ origin: ORIGIN }));
app.use(express.json());

initializeSchema();
startWorker();

app.get('/health', (req, res) => {
	res.json({ ok: true });
});

// Create an event (like, comment, follow, new_post)
app.post('/events', (req, res) => {
	const { type, sourceUserId, targetUserId, data } = req.body || {};
	if (!type || !sourceUserId) {
		return res.status(400).json({ error: 'type and sourceUserId are required' });
	}
	const evt = enqueueEvent({ type, sourceUserId, targetUserId, data });
	res.status(202).json({ enqueued: true, event: evt });
});

// For testing: create a notification directly (not required by assignment but useful)
app.post('/notifications', (req, res) => {
	res.status(501).json({ error: 'Direct creation disabled in this POC' });
});

// Get notifications for a user
app.get('/notifications/:userId', (req, res) => {
	const { userId } = req.params;
	const limit = Number(req.query.limit || 50);
	const items = getNotificationsByUser(userId, limit);
	res.json({ notifications: items });
});

// Mark all as read for a user
app.post('/notifications/:userId/read', (req, res) => {
	const { userId } = req.params;
	const r = markAllRead(userId);
	res.json({ updated: r.changes });
});

app.listen(PORT, () => {
	console.log(`Insyd backend listening on http://localhost:${PORT}`);
});

