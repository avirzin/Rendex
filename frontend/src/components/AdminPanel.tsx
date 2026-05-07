'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACTS, RENDEX_TOKEN_ABI } from '@/lib/contracts'

export function AdminPanel() {
  const { address } = useAccount()
  const { data: owner } = useReadContract({
    address: CONTRACTS.rendexToken,
    abi: RENDEX_TOKEN_ABI,
    functionName: 'owner',
  })

  const { writeContract, data: txHash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase()
  if (!isOwner) return null

  const handleRebase = () => {
    writeContract({
      address: CONTRACTS.rendexToken,
      abi: RENDEX_TOKEN_ABI,
      functionName: 'rebase',
    })
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-8">
      <h3 className="text-lg text-neutral-900 mb-1">Admin</h3>
      <p className="text-sm text-neutral-500 mb-6">Owner wallet detected.</p>

      <button
        onClick={handleRebase}
        disabled={isPending || isConfirming}
        className="bg-neutral-900 text-white px-6 py-3 rounded-lg text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Trigger Rebase'}
      </button>

      {isSuccess && (
        <p className="mt-4 text-sm text-neutral-600">
          ✓ Rebase confirmed.{' '}
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            View on Etherscan
          </a>
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500">
          {(error as Error).message.includes('rebase not ready')
            ? 'Rebase not ready — wait 24h since the last rebase.'
            : (error as Error).message.slice(0, 100)}
        </p>
      )}
    </div>
  )
}
