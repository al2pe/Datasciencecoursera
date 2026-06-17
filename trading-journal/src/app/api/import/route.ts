import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = seedDatabase()
    return NextResponse.json({
      ok: true,
      message: result.seeded
        ? `Imported ${result.trades} trades from Robinhood seed data.`
        : `Database already has ${result.trades} trades. No new import needed.`,
      ...result,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}
