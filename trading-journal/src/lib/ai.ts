import Anthropic from '@anthropic-ai/sdk'
import type { Trade } from '@/types'

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI analysis.')
  return new Anthropic({ apiKey })
}

export async function analyzeTrade(trade: Trade): Promise<{ analysis: string; tags: string[] }> {
  const context = trade.asset_type === 'option'
    ? `${trade.direction === 'credit' ? 'Sold' : 'Bought'} ${trade.quantity} ${trade.option_type} option contract(s) on ${trade.symbol}, strike $${trade.strike_price}, expiring ${trade.expiration_date}. Premium: $${trade.premium?.toFixed(2)}. Direction: ${trade.direction}.`
    : `${trade.side === 'buy' ? 'Bought' : 'Sold'} ${trade.quantity.toFixed(4)} shares of ${trade.symbol} at $${trade.average_price?.toFixed(2)} per share. Total value: $${trade.total_value?.toFixed(2)}. Order type: ${trade.order_type}.`

  const prompt = `You are a trading journal assistant helping analyze individual trades. Analyze this trade and provide concise, useful insights.

Trade details:
- Symbol: ${trade.symbol}
- Asset type: ${trade.asset_type}
- ${context}
- Date: ${new Date(trade.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
- Placed by: ${trade.placed_agent === 'agentic' ? 'AI agent (automated)' : trade.placed_agent}
- Account: ${trade.account}

Provide a JSON response with:
1. "analysis": 2-3 sentences analyzing the trade — comment on position sizing, timing context if notable, risk/reward for the instrument type, and any patterns worth noting
2. "tags": array of 3-5 short tags (e.g. "momentum", "options-premium", "small-cap", "agentic", "partial-share", "covered-call", etc.)

Return ONLY valid JSON, no markdown.`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'

  try {
    const parsed = JSON.parse(text) as { analysis: string; tags: string[] }
    return {
      analysis: parsed.analysis || 'Analysis unavailable.',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
    }
  } catch {
    return { analysis: text, tags: [] }
  }
}

export async function analyzePortfolio(trades: Trade[]): Promise<string> {
  const equityTrades = trades.filter(t => t.asset_type === 'equity')
  const optionTrades = trades.filter(t => t.asset_type === 'option')
  const agenticTrades = trades.filter(t => t.placed_agent === 'agentic')

  const symbols = Array.from(new Set(trades.map(t => t.symbol)))
  const recentSymbols = Array.from(new Set(trades.slice(0, 20).map(t => t.symbol)))

  const prompt = `You are a trading journal assistant. Analyze this trader's overall trading activity and provide portfolio-level insights.

Summary:
- Total trades: ${trades.length} (${equityTrades.length} equity, ${optionTrades.length} options)
- AI-placed trades: ${agenticTrades.length} of ${trades.length}
- Unique symbols traded: ${symbols.length}
- Recent symbols (last 20 trades): ${recentSymbols.join(', ')}
- Date range: ${trades.at(-1)?.created_at?.slice(0,10)} to ${trades[0]?.created_at?.slice(0,10)}

Top traded symbols by frequency:
${Object.entries(
  trades.reduce((acc: Record<string, number>, t) => { acc[t.symbol] = (acc[t.symbol] || 0) + 1; return acc }, {})
).sort((a,b) => b[1]-a[1]).slice(0,10).map(([s,n]) => `- ${s}: ${n} trades`).join('\n')}

Write 3-4 sentences of portfolio-level observations: trading style, concentration, use of AI agents, options activity, and any notable patterns. Be specific and actionable.`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}
