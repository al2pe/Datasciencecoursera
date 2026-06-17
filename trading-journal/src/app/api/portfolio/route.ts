import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'

export const dynamic = 'force-dynamic'

export async function GET() {
  seedDatabase()
  const db = getDb()

  const snapshot = db.prepare('SELECT * FROM portfolio_snapshots ORDER BY snapshot_at DESC LIMIT 1').get()
  const positions = db.prepare('SELECT * FROM positions ORDER BY symbol').all()

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_trades,
      SUM(CASE WHEN asset_type='equity' THEN 1 ELSE 0 END) as equity_trades,
      SUM(CASE WHEN asset_type='option' THEN 1 ELSE 0 END) as option_trades,
      SUM(CASE WHEN placed_agent='agentic' THEN 1 ELSE 0 END) as agentic_trades,
      SUM(CASE WHEN placed_agent='user' THEN 1 ELSE 0 END) as user_trades,
      COUNT(DISTINCT symbol) as symbols_traded,
      SUM(CASE WHEN side='buy' AND total_value IS NOT NULL THEN total_value ELSE 0 END) as total_buy_value,
      SUM(CASE WHEN side='sell' AND total_value IS NOT NULL THEN total_value ELSE 0 END) as total_sell_value
    FROM trades
    WHERE state='filled'
  `).get()

  const byMonth = db.prepare(`
    SELECT
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as trades,
      SUM(CASE WHEN side='buy' AND total_value IS NOT NULL THEN total_value ELSE 0 END) as buy_value,
      SUM(CASE WHEN side='sell' AND total_value IS NOT NULL THEN total_value ELSE 0 END) as sell_value
    FROM trades
    WHERE state='filled'
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `).all()

  const topSymbols = db.prepare(`
    SELECT symbol, COUNT(*) as trades, asset_type
    FROM trades
    WHERE state='filled'
    GROUP BY symbol
    ORDER BY trades DESC
    LIMIT 10
  `).all()

  return NextResponse.json({ snapshot, positions, stats, byMonth, topSymbols })
}
