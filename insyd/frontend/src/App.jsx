import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function App() {
  const [userId, setUserId] = useState('userA')
  const [notifications, setNotifications] = useState([])
  const [type, setType] = useState('like')
  const [targetUserId, setTargetUserId] = useState('userB')
  const [sourceUserId, setSourceUserId] = useState('userA')
  const [banner, setBanner] = useState(null)

  const api = useMemo(() => ({
    async fetchNotifications(u) {
      const res = await fetch(`${API_BASE}/notifications/${encodeURIComponent(u)}`)
      if (!res.ok) throw new Error('Failed to fetch notifications')
      const data = await res.json()
      return data.notifications || []
    },
    async enqueueEvent(payload) {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to enqueue event')
      return res.json()
    },
    async markAllRead(u) {
      const res = await fetch(`${API_BASE}/notifications/${encodeURIComponent(u)}/read`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to mark read')
      return res.json()
    }
  }), [])

  useEffect(() => {
    let mounted = true
    let timer
    const load = async () => {
      try {
        const items = await api.fetchNotifications(userId)
        if (mounted) setNotifications(items)
      } catch (e) {
        // no-op
      }
    }
    load()
    timer = setInterval(load, 2000)
    return () => { mounted = false; clearInterval(timer) }
  }, [userId, api])

  const submitEvent = async (e) => {
    e.preventDefault()
    try {
      await api.enqueueEvent({ type, sourceUserId, targetUserId })
      setBanner({ kind: 'success', text: `Event '${type}' sent from ${sourceUserId} to ${targetUserId}` })
      setTimeout(() => setBanner(null), 2000)
    } catch (err) {
      setBanner({ kind: 'error', text: 'Failed to send event' })
      setTimeout(() => setBanner(null), 3000)
    }
  }

  return (
    <div className="App">
      <h1>Insyd Notifications POC</h1>
      {banner && (
        <div className={`banner ${banner.kind}`} role="status">{banner.text}</div>
      )}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div>
          <h2>Trigger Event</h2>
          <form onSubmit={submitEvent} style={{ display: 'grid', gap: '0.5rem', width: 320 }}>
            <label>
              <span>Type</span>
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="like">like</option>
                <option value="comment">comment</option>
                <option value="follow">follow</option>
                <option value="new_post">new_post</option>
              </select>
            </label>
            <label>
              <span>Source User</span>
              <input value={sourceUserId} onChange={e => setSourceUserId(e.target.value)} />
            </label>
            <label>
              <span>Target User</span>
              <input value={targetUserId} onChange={e => setTargetUserId(e.target.value)} />
            </label>
            <button type="submit">Send Event</button>
          </form>
        </div>
        <div>
          <h2>Notifications</h2>
          <div style={{ marginBottom: 8 }}>
            <label>
              <span>User</span>{' '}
              <select value={userId} onChange={e => setUserId(e.target.value)}>
                <option value="userA">userA</option>
                <option value="userB">userB</option>
              </select>
            </label>
            <button style={{ marginLeft: 8 }} onClick={async () => {
              try {
                await api.markAllRead(userId)
                setBanner({ kind: 'success', text: `Marked all read for ${userId}` })
                setTimeout(() => setBanner(null), 2000)
              } catch (err) {
                setBanner({ kind: 'error', text: 'Failed to mark as read' })
                setTimeout(() => setBanner(null), 3000)
              }
            }}>Mark all read</button>
          </div>
          <ul>
            {notifications.map(n => (
              <li key={n.notificationId}>
                <strong>{n.type}</strong>: {n.content} — {new Date(n.timestamp).toLocaleTimeString()} [{n.status}]
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App