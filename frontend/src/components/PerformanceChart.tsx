'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { sepolia } from 'viem/chains'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { CONTRACTS } from '@/lib/contracts'

const TOTAL_SUPPLY = 1_000_000

type DataPoint = { date: string; poolValue: number }

export function PerformanceChart({ refreshKey }: { refreshKey?: number }) {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const client = createPublicClient({
      chain: sepolia,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL),
    })

    client.getLogs({
      address: CONTRACTS.rendexToken,
      event: parseAbiItem('event RebaseExecuted(uint256 indexed rebaseCount, uint256 cdiRate, uint256 rebaseRate, uint256 newSharesPerToken, uint256 timestamp)'),
      fromBlock: 0n,
      toBlock: 'latest',
    }).then((logs) => {
      const points = logs.map((log) => {
        const args = log.args as { newSharesPerToken: bigint; timestamp: bigint }
        const unitPrice = Number(args.newSharesPerToken) / 1e18
        const date = new Date(Number(args.timestamp) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return { date, poolValue: unitPrice * TOTAL_SUPPLY }
      })

      // Genesis point: hardcoded pool deployment date with initial unit price of 1.0 (sharesPerToken = 1e18 at deploy).
      // This is the only point not derived from on-chain RebaseExecuted events — all subsequent points come from the contract.
      const genesis: DataPoint = { date: 'May 11', poolValue: 1_000_000 }

      setData([genesis, ...points])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [refreshKey])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-8 h-80 flex items-center justify-center">
        <span className="text-sm text-neutral-400">Loading chart...</span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-8 h-80 flex items-center justify-center">
        <span className="text-sm text-neutral-400">Rebase history will appear here after the first rebase</span>
      </div>
    )
  }

  const minValue = Math.min(...data.map(d => d.poolValue))
  const maxValue = Math.max(...data.map(d => d.poolValue))
  const padding = (maxValue - minValue) * 0.1 || 100

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg text-neutral-900">Pool Performance</h3>
        <span className="text-sm text-neutral-500">Total pool value (R$)</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#737373' }} />
          <YAxis
            domain={[minValue - padding, maxValue + padding]}
            tickFormatter={(v) => `R$ ${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            tick={{ fontSize: 12, fill: '#737373' }}
            width={110}
          />
          <Tooltip
            formatter={(value: number) => [`R$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Pool Value']}
            contentStyle={{ border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '12px' }}
          />
          <Line type="monotone" dataKey="poolValue" stroke="#171717" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
