'use client'

import { useEffect, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACTS, RENDEX_TOKEN_ABI } from '@/lib/contracts'

export function InvestorPosition() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { data: balance, isFetching } = useReadContract({
    address: CONTRACTS.rendexToken,
    abi: RENDEX_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  if (!mounted || !isConnected) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6m18 0V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V6" />
          </svg>
        </div>
        <h3 className="text-xl text-neutral-900 mb-2">Connect Your Wallet</h3>
        <p className="text-neutral-500 text-sm">Connect your wallet to view your RDX position.</p>
      </div>
    )
  }

  const formattedBalance = balance !== undefined
    ? `R$ ${Number(formatEther(balance)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-8">
      <h3 className="text-lg text-neutral-900 mb-6">Your Position</h3>
      <div className="flex items-end gap-2 mb-2">
        {isFetching
          ? <div className="animate-pulse bg-neutral-200 rounded h-10 w-48 mt-1" />
          : <span className="text-4xl text-neutral-900">{formattedBalance}</span>
        }
      </div>
      <p className="text-sm text-neutral-400">Value increases automatically after each daily rebase.</p>
    </div>
  )
}
