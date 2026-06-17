import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { analyzeTrade, analyzePortfolio } from '@/lib/ai'
import type { Trade } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json().catch(() => ({})) as { id?: string; portfolio?: boolean }

  if (body.portfolio) {
    const trades = db.prepare<[], Trade>(
      'SELECT * FROM trades WHERE state=\'filled\' ORDER BY created_at DESC LIMIT 100'
    ).all()
    try {
      const insight = await analyzePortfolio(trades)
      return NextResponse.json({ insight })
    } catch (err) {
      return NextResponse.json(
        { error: String(err), hint: 'Add ANTHROPIC_API_KEY to trading-journal/.env.local' },
        { status: 503 }
      )
    }
  }

  if (!body.id) {
    return NextResponse.json({ error: 'Missing trade id' }, { status: 400 })
  }

  const trade = db.prepare<[string], Trade>('SELECT * FROM trades WHERE id = ?').get(body.id)
  if (!trade) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  }

  if (trade.ai_analysis) {
    return NextResponse.json({ analysis: trade.ai_analysis, tags: JSON.parse(trade.ai_tags || '[]') })
  }

  try {
    const result = await analyzeTrade(trade)
    db.prepare(
      'UPDATE trades SET ai_analysis = ?, ai_tags = ? WHERE id = ?'
    ).run(result.analysis, JSON.stringify(result.tags), body.id)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: message, hint: 'Add your ANTHROPIC_API_KEY to trading-journal/.env.local' },
      { status: 503 }
    )
  }
}
