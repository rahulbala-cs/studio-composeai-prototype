'use client'

import { ReactNode } from 'react'

interface ClientWrapperProps {
  children: ReactNode
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  // Remove all loading logic - directly render children
  return <>{children}</>
}