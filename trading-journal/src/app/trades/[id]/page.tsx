'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'

interface Trade {
  id: string
  account: string
  symbol: string
  side: string
  asset_type: string
  order_type: string
  state: string
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
  ai_analysis: string | null
  ai_tags: string | null
  notes: string | null
}

function fmt(n: number | null | undefined, decimals = 2) {
  if (n == null) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default function TradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [trade, setTrade] = useState<Trade | null>(null)
  const [analysis, setAnalysis] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    fetch(`/api/trades/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.trade) {
          setTrade(d.trade)
          setNotes(d.trade.notes || '')
          if (d.trade.ai_analysis) setAnalysis(d.trade.ai_analysis)
          if (d.trade.ai_tags) setTags(JSON.parse(d.trade.ai_tags))
        }
      })
  }, [id])

  function analyzeWithAI() {
    setLoading(true)
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setAnalysis(`⚠ ${d.hint || d.error}`)
        } else {
          setAnalysis(d.analysis)
          setTags(d.tags || [])
          if (trade) setTrade({ ...trade, ai_analysis: d.analysis, ai_tags: JSON.stringify(d.tags) })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  function saveNotes() {
    setSavingNotes(true)
    fetch(`/api/trades/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }).finally(() => setSavingNotes(false))
  }

  if (!trade) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Loading trade...</div>
  )

  const isOption = trade.asset_type === 'option'
  const value = trade.total_value ?? trade.premium

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/trades" className="text-gray-500 hover:text-white transition-colors text-sm">← Trades</Link>
        <span className="text-gray-700">/</span>
        <span className="font-mono font-bold text-lg">{trade.symbol}</span>
        <span className={`badge ${trade.side === 'buy' ? 'badge-buy' : 'badge-sell'} text-sm px-3 py-1`}>
          {trade.side.toUpperCase()}
        </span>
        {isOption && <span className="badge badge-option">Option</span>}
        {trade.placed_agent === 'agentic' && <span className="badge badge-agentic">AI-placed</span>}
      </div>

      {/* Trade summary */}
      <div className="card">
        <h2 className="font-semibold mb-4">Trade Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Symbol', value: trade.symbol },
            { label: 'Side', value: trade.side.toUpperCase() },
            { label: 'Asset Type', value: trade.asset_type },
            { label: 'Order Type', value: trade.order_type },
            { label: 'State', value: trade.state },
            { label: 'Placed By', value: trade.placed_agent },
            { label: 'Quantity', value: trade.quantity.toFixed(trade.quantity % 1 === 0 ? 0 : 6) },
            { label: 'Avg Price', value: fmt(trade.average_price) },
            { label: 'Total Value', value: fmt(value) },
            { label: 'Fees', value: fmt(trade.fees) },
            { label: 'Created', value: new Date(trade.created_at).toLocaleString() },
            { label: 'Executed', value: trade.executed_at ? new Date(trade.executed_at).toLocaleString() : '—' },
          ].map(item => (
            <div key={item.label}>
              <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
              <div className="text-sm font-medium">{item.value}</div>
            </div>
          ))}

          {isOption && [
            { label: 'Option Type', value: trade.option_type?.toUpperCase() || '—' },
            { label: 'Strike Price', value: fmt(trade.strike_price) },
            { label: 'Expiration', value: trade.expiration_date || '—' },
            { label: 'Direction', value: trade.direction || '—' },
            { label: 'Premium', value: fmt(trade.premium) },
          ].map(item => (
            <div key={item.label}>
              <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
              <div className="text-sm font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">AI Analysis</h2>
          <button
            onClick={analyzeWithAI}
            disabled={loading}
            className="text-xs bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {loading ? '⟳ Analyzing...' : analysis ? '↻ Re-analyze' : '✦ Analyze with AI'}
          </button>
        </div>

        {analysis ? (
          <div className="space-y-3">
            <div className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-300 leading-relaxed">{analysis}</p>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="badge-tag badge">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Click &ldquo;Analyze with AI&rdquo; to get Claude&apos;s analysis of this trade — insights on position sizing, timing, risk/reward, and suggested tags.
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="card">
        <h2 className="font-semibold mb-3">Journal Notes</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add your personal notes about this trade — why you placed it, what you learned, etc."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-600 resize-none"
          rows={4}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={saveNotes}
            disabled={savingNotes}
            className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-600">Trade ID: {trade.id}</div>
    </div>
  )
}
