'use client'

import { SessionProvider } from 'next-auth/react'
import { WebSocketProvider } from '@/components/WebSocketProvider'

export function Providers({ children }) {
  return (
    <SessionProvider>
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    </SessionProvider>
  )
}

