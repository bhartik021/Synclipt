import { useEffect, useRef, useState, useCallback } from 'react'
import { WS_URL } from '../utils/constants'

export function useWebSocket(code, { onEvent } = {}) {
  const ws = useRef(null)
  const [status, setStatus] = useState('disconnected')
  const [events, setEvents] = useState([])
  const pingInterval = useRef(null)
  const reconnectTimeout = useRef(null)
  const reconnectAttempts = useRef(0)

  // Keep the ref always current so onmessage never calls a stale closure
  const onEventRef = useRef(onEvent)
  useEffect(() => {
    onEventRef.current = onEvent
  })

  // Track the currently active socket so stale onclose handlers don't reconnect
  const activeWs = useRef(null)

  const connect = useCallback(() => {
    if (!code) return
    const url = `${WS_URL}/ws/clipboard/${code.toUpperCase()}/`

    let socket
    try {
      socket = new WebSocket(url)
    } catch {
      return
    }

    ws.current = socket
    activeWs.current = socket

    socket.onopen = () => {
      setStatus('connected')
      reconnectAttempts.current = 0
      pingInterval.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        }
      }, 20000)
    }

    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'pong') return

        const event = { ...msg, receivedAt: new Date().toISOString() }
        setEvents((prev) => [event, ...prev].slice(0, 50))
        onEventRef.current?.(event)
      } catch {}
    }

    socket.onclose = () => {
      // Ignore if this socket was replaced (code changed) or the component unmounted
      if (activeWs.current !== socket) return
      setStatus('disconnected')
      clearInterval(pingInterval.current)
      if (reconnectAttempts.current < 5) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000)
        reconnectAttempts.current += 1
        setStatus('reconnecting')
        reconnectTimeout.current = setTimeout(connect, delay)
      }
    }

    socket.onerror = () => {
      setStatus('error')
    }
  }, [code]) // reconnect only when code changes, not on every parent render

  useEffect(() => {
    connect()
    return () => {
      // Nulling activeWs prevents the onclose handler from scheduling a reconnect
      activeWs.current = null
      clearInterval(pingInterval.current)
      clearTimeout(reconnectTimeout.current)
      ws.current?.close()
    }
  }, [connect])

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }, [])

  return { status, events, send }
}
