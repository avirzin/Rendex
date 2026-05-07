'use client'

import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACTS, CDI_ORACLE_ABI, RENDEX_TOKEN_ABI } from '@/lib/contracts'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="text-sm text-neutral-500 mb-2">{label}</div>
      <div className="text-2xl text-neutral-900">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  )
}

export function PoolStats() {
  const { data: currentCDI } = useReadContract({
    address: CONTRACTS.cdiOracle,
    abi: CDI_ORACLE_ABI,
    functionName: 'getCDI',
  })

  const { data: sharesPerToken } = useReadContract({
    address: CONTRACTS.rendexToken,
    abi: RENDEX_TOKEN_ABI,
    functionName: 'sharesPerToken',
  })

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.rendexToken,
    abi: RENDEX_TOKEN_ABI,
    functionName: 'totalSupply',
  })

  const dailyCDI = currentCDI !== undefined ? `${(Number(currentCDI) / 100).toFixed(4)}%` : '—'
  const unitPrice = sharesPerToken !== undefined
    ? (Number(sharesPerToken) / 1e18).toFixed(6)
    : '—'
  const supply = totalSupply !== undefined
    ? Number(formatEther(totalSupply)).toLocaleString('en-US', { maximumFractionDigits: 2 })
    : '—'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <StatCard label="Daily CDI Rate" value={dailyCDI} />
      <StatCard label="Pool Yield Multiplier" value="120%" sub="of CDI" />
      <StatCard label="Unit Price" value={unitPrice} sub="appreciation since deploy" />
      <StatCard label="Total RDX Supply" value={supply} sub="RDX" />
    </div>
  )
}
