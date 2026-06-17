'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Stats {
  total_trades: number
  equity_trades: number
  option_trades: number
  agentic_trades: number
  user_trades: number
  symbols_traded: number
  total_buy_value: number
  total_sell_value: number
}

interface MonthData { month: string; trades: number; buy_value: number; sell_value: number }
interface TopSymbol { symbol: string; trades: number; asset_type: string }
interface Snapshot { total_value: number; equity_value: number; options_value: number; crypto_value: number; cash: number; snapshot_at: string }
interface Position { symbol: string; quantity: number; average_buy_price: number }

interface PortfolioData {
  snapshot: Snapshot
  stats: Stats
  byMonth: MonthData[]
  topSymbols: TopSymbol[]
  positions: Position[]
}

interface RecentTrade {
  id: string
  symbol: string
  side: string
  asset_type: string
  quantity: number
  average_price: number
  total_value: number
  placed_agent: string
  created_at: string
}

function fmt(n: number | null | undefined, decimals = 2) {
  if (n == null) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtNum(n: number) {
  return n.toLocaleString('en-US')
}

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([])
  const [insight, setInsight] = useState<string>('')
  const [loadingInsight, setLoadingInsight] = useState(false)

  useEffect(() => {
    fetch('/api/portfolio').then(r => r.json()).then(setPortfolio)
    fetch('/api/trades?limit=10').then(r => r.json()).then(d => setRecentTrades(d.trades))
  }, [])

  function getInsight() {
    setLoadingInsight(true)
    fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ portfolio: true }) })
      .then(r => r.json())
      .then(d => {
        setInsight(d.insight || d.error || 'Analysis unavailable.')
        setLoadingInsight(false)
      })
      .catch(() => { setInsight('AI analysis requires ANTHROPIC_API_KEY in .env.local'); setLoadingInsight(false) })
  }

  const s = portfolio?.snapshot
  const stats = portfolio?.stats

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
          {s && <p className="text-sm text-gray-400 mt-1">Snapshot: {new Date(s.snapshot_at).toLocaleDateString()}</p>}
        </div>
        <button
          onClick={getInsight}
          disabled={loadingInsight}
          className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {loadingInsight ? '⟳ Analyzing...' : '✦ AI Portfolio Insight'}
        </button>
      </div>

      {insight && (
        <div className="card border-purple-800 bg-purple-950/30">
          <div className="flex items-start gap-3">
            <span className="text-purple-400 text-lg mt-0.5">✦</span>
            <div>
              <p className="text-sm font-medium text-purple-300 mb-1">AI Portfolio Analysis</p>
              <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio value row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Value', value: s?.total_value },
          { label: 'Equity', value: s?.equity_value },
          { label: 'Crypto', value: s?.crypto_value },
          { label: 'Cash', value: s?.cash },
          { label: 'Options', value: s?.options_value },
        ].map(item => (
          <div key={item.label} className="card">
            <div className="stat-value text-white">{fmt(item.value)}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Trade stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Trades', value: fmtNum(stats?.total_trades ?? 0), sub: 'filled orders' },
          { label: 'Equity / Options', value: `${stats?.equity_trades ?? 0} / ${stats?.option_trades ?? 0}`, sub: 'trade types' },
          { label: 'Agentic Trades', value: fmtNum(stats?.agentic_trades ?? 0), sub: `of ${stats?.total_trades ?? 0} total` },
          { label: 'Symbols Traded', value: fmtNum(stats?.symbols_traded ?? 0), sub: 'unique tickers' },
        ].map(item => (
          <div key={item.label} className="card">
            <div className="stat-value text-green-400">{item.value}</div>
            <div className="stat-label">{item.label}</div>
            <div className="text-xs text-gray-600 mt-1">{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly activity chart */}
        <div className="card">
          <h2 className="font-semibold mb-4">Monthly Trade Activity</h2>
          {portfolio?.byMonth && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[...portfolio.byMonth].reverse()}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [v, 'trades']}
                />
                <Bar dataKey="trades" radius={[4, 4, 0, 0]}>
                  {portfolio.byMonth.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#22c55e' : '#374151'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top symbols */}
        <div className="card">
          <h2 className="font-semibold mb-4">Most Traded Symbols</h2>
          <div className="space-y-2">
            {portfolio?.topSymbols.map((s, i) => (
              <div key={s.symbol} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                <Link href={`/trades?symbol=${s.symbol}`} className="font-mono font-semibold text-sm hover:text-green-400 transition-colors w-16">
                  {s.symbol}
                </Link>
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full"
                    style={{ width: `${(s.trades / (portfolio.topSymbols[0]?.trades || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">{s.trades} trades</span>
                <span className={`badge ${s.asset_type === 'option' ? 'badge-option' : 'badge-tag'}`}>{s.asset_type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Positions */}
      {portfolio?.positions && portfolio.positions.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Open Positions</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {portfolio.positions.map(p => (
              <Link
                key={p.symbol}
                href={`/trades?symbol=${p.symbol}`}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-green-800 transition-colors"
              >
                <div className="font-mono font-bold text-sm">{p.symbol}</div>
                <div className="text-xs text-gray-400 mt-1">{p.quantity.toFixed(p.quantity % 1 === 0 ? 0 : 4)} shares</div>
                <div className="text-xs text-gray-500">avg {fmt(p.average_buy_price)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent trades */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Trades</h2>
          <Link href="/trades" className="text-xs text-green-400 hover:text-green-300">View all →</Link>
        </div>
        <div className="space-y-2">
          {recentTrades.map(t => (
            <Link
              key={t.id}
              href={`/trades/${t.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
            >
              <span className={`badge ${t.side === 'buy' ? 'badge-buy' : 'badge-sell'} w-10 justify-center`}>
                {t.side.toUpperCase()}
              </span>
              <span className="font-mono font-semibold text-sm w-16">{t.symbol}</span>
              {t.asset_type === 'option' && <span className="badge badge-option">option</span>}
              {t.placed_agent === 'agentic' && <span className="badge badge-agentic">AI</span>}
              <span className="text-xs text-gray-400 flex-1">
                {t.quantity.toFixed(4)} @ {fmt(t.average_price)}
              </span>
              <span className="text-sm font-medium">{fmt(t.total_value)}</span>
              <span className="text-xs text-gray-600">{t.created_at.slice(0, 10)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
