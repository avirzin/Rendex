'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface RefreshButtonProps {
  onRefresh: () => void
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
  const queryClient = useQueryClient()
  const [spinning, setSpinning] = useState(false)

  const handleRefresh = async () => {
    setSpinning(true)
    await queryClient.invalidateQueries()
    onRefresh()
    setTimeout(() => setSpinning(false), 600)
  }

  return (
    <button
      onClick={handleRefresh}
      title="Refresh data"
      className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
    >
      <svg
        className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  )
}
