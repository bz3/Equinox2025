import { io, Socket } from 'socket.io-client'

const WS_BASE = import.meta.env.VITE_API_BASE?.replace(/^http/, 'ws') || 'ws://localhost:4000'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_BASE, { transports: ['websocket'] })
  }
  return socket
}

export function subscribeToCall(callId: string, handler: (evt: any) => void) {
  const s = getSocket()
  s.emit('subscribe', callId)
  const listener = (payload: any) => handler(payload)
  s.on('event', listener)
  return () => s.off('event', listener)
}


