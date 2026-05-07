'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <header className="bg-white border-b border-neutral-200 fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        <h1 className="text-xl text-neutral-900">Rendex</h1>
        {!mounted ? (
          <button className="bg-neutral-900 text-white px-6 py-2 rounded-lg text-sm">
            Connect Wallet
          </button>
        ) : isConnected ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button
              onClick={() => disconnect()}
              className="bg-white text-neutral-900 border border-neutral-300 px-4 py-2 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={() => connect({ connector: injected() })}
            className="bg-neutral-900 text-white px-6 py-2 rounded-lg text-sm hover:bg-neutral-800 transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  )
}
