'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

interface Trade {
  id: string
  symbol: string
  side: string
  asset_type: string
  order_type: string
  quantity: number
  average_price: number | null
  total_value: number | null
  fees: number
  placed_agent: string
  created_at: string
  executed_at: string | null
  expiration_date: string | null
  strike_price: number | null
  option_type: string | null
  direction: string | null
  premium: number | null
  ai_tags: string | null
  state: string
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function TradesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [trades, setTrades] = useState<Trade[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const asset = searchParams.get('asset') || ''
  const agent = searchParams.get('agent') || ''
  const symbol = searchParams.get('symbol') || ''
  const side = searchParams.get('side') || ''
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = 50

  const fetchTrades = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (asset) params.set('asset', asset)
    if (agent) params.set('agent', agent)
    if (symbol) params.set('symbol', symbol)
    if (side) params.set('side', side)
    params.set('limit', String(limit))
    params.set('offset', String(offset))

    fetch(`/api/trades?${params}`)
      .then(r => r.json())
      .then(d => { setTrades(d.trades); setTotal(d.total); setLoading(false) })
  }, [asset, agent, symbol, side, offset])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  function setFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value); else p.delete(key)
    p.delete('offset')
    router.push(`/trades?${p}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trade History</h1>
        <span className="text-sm text-gray-400">{total.toLocaleString()} trades</span>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Asset</label>
          <select
            value={asset}
            onChange={e => setFilter('asset', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg text-sm px-3 py-1.5 text-white focus:outline-none focus:border-green-600"
          >
            <option value="">All</option>
            <option value="equity">Equity</option>
            <option value="option">Options</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Agent</label>
          <select
            value={agent}
            onChange={e => setFilter('agent', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg text-sm px-3 py-1.5 text-white focus:outline-none focus:border-green-600"
          >
            <option value="">All</option>
            <option value="user">User</option>
            <option value="agentic">Agentic (AI)</option>
            <option value="drip">Drip</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Side</label>
          <select
            value={side}
            onChange={e => setFilter('side', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg text-sm px-3 py-1.5 text-white focus:outline-none focus:border-green-600"
          >
            <option value="">All</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        {symbol && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Symbol:</span>
            <span className="badge bg-gray-700 text-white border border-gray-600">{symbol}</span>
            <button onClick={() => setFilter('symbol', '')} className="text-xs text-gray-500 hover:text-red-400">✕</button>
          </div>
        )}
        {(asset || agent || symbol || side) && (
          <button
            onClick={() => router.push('/trades')}
            className="text-xs text-red-400 hover:text-red-300 ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Trade table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">Date</th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">Symbol</th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">Side</th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">Type</th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">Qty</th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">Avg Price</th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">Value</th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">Placed By</th>
              <th className="px-4 py-3 text-xs text-gray-400 font-medium">AI Tags</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : trades.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No trades found.</td></tr>
            ) : trades.map((t, i) => (
              <tr
                key={t.id}
                className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-900/30'}`}
              >
                <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                  {t.created_at.slice(0, 10)}
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/trades/${t.id}`} className="font-mono font-semibold hover:text-green-400 transition-colors">
                    {t.symbol}
                  </Link>
                  {t.asset_type === 'option' && t.option_type && (
                    <div className="text-xs text-gray-500">{t.strike_price} {t.option_type} {t.expiration_date?.slice(5)}</div>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`badge ${t.side === 'buy' ? 'badge-buy' : 'badge-sell'}`}>
                    {t.side.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`badge ${t.asset_type === 'option' ? 'badge-option' : 'badge-tag'}`}>
                    {t.asset_type}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  {t.quantity % 1 === 0 ? t.quantity : t.quantity.toFixed(4)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{fmt(t.average_price)}</td>
                <td className="px-4 py-2.5 font-mono text-xs font-medium">{fmt(t.total_value ?? t.premium)}</td>
                <td className="px-4 py-2.5">
                  {t.placed_agent === 'agentic'
                    ? <span className="badge badge-agentic">AI</span>
                    : <span className="text-xs text-gray-500">{t.placed_agent}</span>
                  }
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {t.ai_tags && JSON.parse(t.ai_tags).map((tag: string) => (
                      <span key={tag} className="badge-tag badge text-[10px]">{tag}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setFilter('offset', String(Math.max(0, offset - limit)))}
              className="text-sm px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              ← Prev
            </button>
            <button
              disabled={offset + limit >= total}
              onClick={() => setFilter('offset', String(offset + limit))}
              className="text-sm px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TradesPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading trades...</div>}>
      <TradesContent />
    </Suspense>
  )
}
