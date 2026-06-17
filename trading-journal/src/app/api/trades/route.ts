import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import type { Trade } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  seedDatabase()
  const db = getDb()

  const { searchParams } = req.nextUrl
  const asset = searchParams.get('asset')
  const agent = searchParams.get('agent')
  const symbol = searchParams.get('symbol')
  const side = searchParams.get('side')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  const conditions: string[] = []
  const params: Record<string, string | number> = {}

  if (asset) { conditions.push('asset_type = @asset'); params.asset = asset }
  if (agent) { conditions.push('placed_agent = @agent'); params.agent = agent }
  if (symbol) { conditions.push('symbol = @symbol'); params.symbol = symbol.toUpperCase() }
  if (side) { conditions.push('side = @side'); params.side = side }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const trades = db.prepare<Record<string, string | number>, Trade>(
    `SELECT * FROM trades ${where} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`
  ).all({ ...params, limit, offset })

  const total = (db.prepare<Record<string, string | number>, { n: number }>(
    `SELECT COUNT(*) as n FROM trades ${where}`
  ).get(params) as { n: number }).n

  return NextResponse.json({ trades, total, limit, offset })
}
