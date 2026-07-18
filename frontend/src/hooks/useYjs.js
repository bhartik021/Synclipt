import { useEffect, useRef, useCallback } from 'react'
import * as Y from 'yjs'
import { WS_URL } from '../utils/constants'

/**
 * useYjs — binds a Y.Doc to a server-side CRDT session.
 *
 * Returns { yText, doc } where `yText` is the shared Y.Text named "content".
 * The caller can observe yText for changes and apply updates.
 *
 * @param {string|null} code  — clipboard code; pass null to skip connecting
 * @param {function} onUpdate — called with (plaintext: string) on every remote change
 */
export function useYjs(code, onUpdate) {
  const docRef = useRef(null)
  const wsRef = useRef(null)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])

  useEffect(() => {
    if (!code) return

    const doc = new Y.Doc()
    docRef.current = doc
    const yText = doc.getText('content')

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const base = WS_URL.replace(/^wss?:\/\//, '') || window.location.host
    const ws = new WebSocket(`${proto}//${base}/ws/yjs/${code}/`)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    ws.onopen = () => {}

    ws.onmessage = (ev) => {
      if (!(ev.data instanceof ArrayBuffer)) return
      const update = new Uint8Array(ev.data)
      // Apply remote update without triggering our own observer
      Y.applyUpdate(doc, update, 'remote')
    }

    // Observe only changes NOT originated by 'remote' (i.e. local edits)
    doc.on('update', (update, origin) => {
      if (origin !== 'remote' && ws.readyState === WebSocket.OPEN) {
        ws.send(update)
      }
    })

    // Notify parent whenever the shared text changes (from any origin)
    yText.observe(() => {
      onUpdateRef.current?.(yText.toString())
    })

    ws.onclose = () => {}

    return () => {
      ws.close()
      doc.destroy()
      docRef.current = null
      wsRef.current = null
    }
  }, [code])

  const applyLocalEdit = useCallback((newText) => {
    const doc = docRef.current
    if (!doc) return
    const yText = doc.getText('content')
    const current = yText.toString()
    if (current === newText) return
    doc.transact(() => {
      yText.delete(0, yText.length)
      yText.insert(0, newText)
    })
  }, [])

  return {
    doc: docRef.current,
    yText: docRef.current?.getText('content') ?? null,
    applyLocalEdit,
  }
}
