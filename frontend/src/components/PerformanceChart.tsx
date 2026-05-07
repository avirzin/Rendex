'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { sepolia } from 'viem/chains'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { CONTRACTS } from '@/lib/contracts'

type DataPoint = { date: string; unitPrice: number }

export function PerformanceChart() {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
        return { date, unitPrice }
      })
      setData(points)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

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

  const minPrice = Math.min(...data.map(d => d.unitPrice))
  const maxPrice = Math.max(...data.map(d => d.unitPrice))
  const padding = (maxPrice - minPrice) * 0.1 || 0.001

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg text-neutral-900">Pool Performance</h3>
        <span className="text-sm text-neutral-500">Unit price appreciation</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#737373' }} />
          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            tickFormatter={(v) => v.toFixed(4)}
            tick={{ fontSize: 12, fill: '#737373' }}
            width={70}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(6), 'Unit Price']}
            contentStyle={{ border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '12px' }}
          />
          <Line type="monotone" dataKey="unitPrice" stroke="#171717" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
