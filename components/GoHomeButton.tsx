// components/GoHomeButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { DoorOpen } from 'lucide-react'
import React from 'react'

export default function GoHomeButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/')}
      className="fixed bottom-6 left-6 z-50 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all duration-300"
      aria-label="Volver al inicio"
    >
      <DoorOpen size={24} />
    </button>
  )
}
