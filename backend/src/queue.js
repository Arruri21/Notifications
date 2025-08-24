import { randomUUID } from 'crypto';
import { insertEvent, createNotification, db } from './db.js';

// Simple in-memory queue for POC
const eventQueue = [];

export function enqueueEvent(event) {
	const enriched = {
		eventId: event.eventId || randomUUID(),
		type: event.type,
		sourceUserId: event.sourceUserId,
		targetUserId: event.targetUserId || null,
		data: event.data || {},
		timestamp: event.timestamp || Date.now()
	};
	eventQueue.push(enriched);
	return enriched;
}

function processLikeEvent(evt) {
	if (!evt.targetUserId) return;
	const content = `${evt.sourceUserId} liked your post`; // keep simple for POC
	createNotification({
		notificationId: randomUUID(),
		userId: evt.targetUserId,
		type: 'like',
		content,
		status: 'unread',
		timestamp: Date.now()
	});
}

function processFollowEvent(evt) {
	if (!evt.targetUserId) return;
	const content = `${evt.sourceUserId} started following you`;
	createNotification({
		notificationId: randomUUID(),
		userId: evt.targetUserId,
		type: 'follow',
		content,
		status: 'unread',
		timestamp: Date.now()
	});
}

function processCommentEvent(evt) {
	if (!evt.targetUserId) return;
	const content = `${evt.sourceUserId} commented on your post`;
	createNotification({
		notificationId: randomUUID(),
		userId: evt.targetUserId,
		type: 'comment',
		content,
		status: 'unread',
		timestamp: Date.now()
	});
}

function processNewPostEvent(evt) {
	// For POC, notify targetUserId if provided
	if (!evt.targetUserId) return;
	const content = `${evt.sourceUserId} published a new post`;
	createNotification({
		notificationId: randomUUID(),
		userId: evt.targetUserId,
		type: 'new_post',
		content,
		status: 'unread',
		timestamp: Date.now()
	});
}

function handleEvent(evt) {
	switch (evt.type) {
		case 'like':
			processLikeEvent(evt);
			break;
		case 'follow':
			processFollowEvent(evt);
			break;
		case 'comment':
			processCommentEvent(evt);
			break;
		case 'new_post':
			processNewPostEvent(evt);
			break;
		default:
			break;
	}
}

export function startWorker({ intervalMs = 250 } = {}) {
	setInterval(() => {
		if (eventQueue.length === 0) return;
		const evt = eventQueue.shift();
		try {
			insertEvent(evt);
			db.transaction(() => {
				handleEvent(evt);
			})();
		} catch (err) {
			// In POC, just log
			console.error('Failed processing event', err);
		}
	}, intervalMs);
}

