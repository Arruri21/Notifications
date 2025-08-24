import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'insyd.db');

if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL for better write concurrency
db.pragma('journal_mode = WAL');

export function initializeSchema() {
	// Users table (minimal for POC)
	db.prepare(`
		CREATE TABLE IF NOT EXISTS users (
			userId TEXT PRIMARY KEY,
			username TEXT NOT NULL,
			email TEXT,
			preferences TEXT DEFAULT '{}'
		)
	`).run();

	// Events table
	db.prepare(`
		CREATE TABLE IF NOT EXISTS events (
			eventId TEXT PRIMARY KEY,
			type TEXT NOT NULL,
			sourceUserId TEXT NOT NULL,
			targetUserId TEXT,
			data TEXT,
			timestamp INTEGER NOT NULL
		)
	`).run();

	// Notifications table
	db.prepare(`
		CREATE TABLE IF NOT EXISTS notifications (
			notificationId TEXT PRIMARY KEY,
			userId TEXT NOT NULL,
			type TEXT NOT NULL,
			content TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'unread',
			timestamp INTEGER NOT NULL
		)
	`).run();

	// Helpful indexes
	db.prepare('CREATE INDEX IF NOT EXISTS idx_notifications_user_time ON notifications(userId, timestamp DESC)').run();
	db.prepare('CREATE INDEX IF NOT EXISTS idx_events_time ON events(timestamp DESC)').run();

	// Seed a couple of demo users if empty
	const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
	if (count === 0) {
		const insert = db.prepare('INSERT INTO users (userId, username, email) VALUES (?, ?, ?)');
		insert.run('userA', 'Alice Architect', 'alice@example.com');
		insert.run('userB', 'Bob Builder', 'bob@example.com');
	}
}

export function insertEvent(event) {
	const stmt = db.prepare(`
		INSERT INTO events (eventId, type, sourceUserId, targetUserId, data, timestamp)
		VALUES (@eventId, @type, @sourceUserId, @targetUserId, @data, @timestamp)
	`);
	stmt.run({ ...event, data: JSON.stringify(event.data || {}) });
}

export function createNotification(notification) {
	const stmt = db.prepare(`
		INSERT INTO notifications (notificationId, userId, type, content, status, timestamp)
		VALUES (@notificationId, @userId, @type, @content, @status, @timestamp)
	`);
	stmt.run(notification);
}

export function getNotificationsByUser(userId, limit = 50) {
	return db
		.prepare(`
			SELECT notificationId, userId, type, content, status, timestamp
			FROM notifications
			WHERE userId = ?
			ORDER BY timestamp DESC
			LIMIT ?
		`)
		.all(userId, limit);
}

export function markAllRead(userId) {
	return db.prepare(`UPDATE notifications SET status = 'read' WHERE userId = ? AND status = 'unread'`).run(userId);
}

