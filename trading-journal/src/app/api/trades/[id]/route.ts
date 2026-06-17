import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import type { Trade } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const trade = db.prepare<[string], Trade>('SELECT * FROM trades WHERE id = ?').get(id)
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ trade })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const body = await req.json().catch(() => ({})) as { notes?: string }
  if (typeof body.notes === 'string') {
    db.prepare('UPDATE trades SET notes = ? WHERE id = ?').run(body.notes, id)
  }
  const trade = db.prepare<[string], Trade>('SELECT * FROM trades WHERE id = ?').get(id)
  return NextResponse.json({ trade })
}
