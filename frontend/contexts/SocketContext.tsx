'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinCase: (caseId: string) => void
  leaveCase: (caseId: string) => void
  joinMediationSession: (caseId: string) => void
  leaveMediationSession: (caseId: string) => void
  sendMediationMessage: (caseId: string, message: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { token, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && token) {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
        auth: {
          token,
        },
      })

      socketInstance.on('connect', () => {
        setIsConnected(true)
        console.log('Connected to server')
      })

      socketInstance.on('disconnect', () => {
        setIsConnected(false)
        console.log('Disconnected from server')
      })

      socketInstance.on('connect_error', (error) => {
        console.error('Connection error:', error)
        setIsConnected(false)
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.disconnect()
      }
    } else {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, token])

  const joinCase = (caseId: string) => {
    if (socket) {
      socket.emit('joinCase', caseId)
    }
  }

  const leaveCase = (caseId: string) => {
    if (socket) {
      socket.emit('leaveCase', caseId)
    }
  }

  const joinMediationSession = (caseId: string) => {
    if (socket) {
      socket.emit('joinMediationSession', caseId)
    }
  }

  const leaveMediationSession = (caseId: string) => {
    if (socket) {
      socket.emit('leaveMediationSession', caseId)
    }
  }

  const sendMediationMessage = (caseId: string, message: string) => {
    if (socket) {
      socket.emit('mediationMessage', {
        caseId,
        message,
        timestamp: new Date().toISOString(),
      })
    }
  }

  const value = {
    socket,
    isConnected,
    joinCase,
    leaveCase,
    joinMediationSession,
    leaveMediationSession,
    sendMediationMessage,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}