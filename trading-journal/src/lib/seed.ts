import { getDb } from './db'
import seedData from '../../data/seed.json'

interface RawEquityOrder {
  id: string
  symbol: string
  side: string
  type: string
  state: string
  quantity: string
  average_price?: string
  fees?: string
  placed_agent?: string
  created_at: string
  last_transaction_at?: string
  dollar_based_amount?: { amount: string; currency_code: string } | null
}

interface RawOptionLeg {
  option_type?: string
  expiration_date?: string
  strike_price?: string
  executions?: Array<{ timestamp?: string }>
}

interface RawOptionOrder {
  id: string
  chain_symbol: string
  state: string
  type: string
  direction?: string
  quantity: string
  price?: string
  premium?: string
  processed_premium?: string
  placed_agent?: string
  created_at: string
  last_transaction_at?: string
  legs?: RawOptionLeg[]
}

interface RawPosition {
  symbol: string
  quantity: string
  average_buy_price: string
  type?: string
}

interface RawPortfolio {
  total_value: string
  equity_value: string
  options_value: string
  crypto_value: string
  cash: string
  snapshot_at: string
}

export function seedDatabase() {
  const db = getDb()

  const count = (db.prepare('SELECT COUNT(*) as n FROM trades').get() as { n: number }).n
  if (count > 0) return { seeded: false, trades: count }

  const insertTrade = db.prepare(`
    INSERT OR REPLACE INTO trades
      (id, account, asset_type, symbol, side, order_type, state, quantity,
       average_price, total_value, fees, placed_agent, created_at, executed_at,
       expiration_date, strike_price, option_type, direction, premium)
    VALUES
      (@id, @account, @asset_type, @symbol, @side, @order_type, @state, @quantity,
       @average_price, @total_value, @fees, @placed_agent, @created_at, @executed_at,
       @expiration_date, @strike_price, @option_type, @direction, @premium)
  `)

  const insertPosition = db.prepare(`
    INSERT OR REPLACE INTO positions (symbol, quantity, average_buy_price, asset_type)
    VALUES (@symbol, @quantity, @average_buy_price, @asset_type)
  `)

  const insertSnapshot = db.prepare(`
    INSERT INTO portfolio_snapshots (snapshot_at, total_value, equity_value, options_value, crypto_value, cash)
    VALUES (@snapshot_at, @total_value, @equity_value, @options_value, @crypto_value, @cash)
  `)

  const data = seedData as unknown as {
    equity_orders: { default: RawEquityOrder[]; agentic: RawEquityOrder[] }
    option_orders: { default: RawOptionOrder[] }
    positions: RawPosition[]
    portfolio: RawPortfolio
  }

  const runAll = db.transaction(() => {
    // equity orders — default account
    for (const o of data.equity_orders.default) {
      const qty = parseFloat(o.quantity || '0')
      const avgPrice = o.average_price ? parseFloat(o.average_price) : null
      insertTrade.run({
        id: o.id,
        account: '5UO18408',
        asset_type: 'equity',
        symbol: o.symbol,
        side: o.side,
        order_type: o.type,
        state: o.state,
        quantity: qty,
        average_price: avgPrice,
        total_value: avgPrice ? qty * avgPrice : null,
        fees: parseFloat(o.fees || '0'),
        placed_agent: o.placed_agent || 'user',
        created_at: o.created_at,
        executed_at: o.last_transaction_at || null,
        expiration_date: null,
        strike_price: null,
        option_type: null,
        direction: null,
        premium: null,
      })
    }

    // equity orders — agentic account
    for (const o of data.equity_orders.agentic) {
      const qty = parseFloat(o.quantity || '0')
      const avgPrice = o.average_price ? parseFloat(o.average_price) : null
      insertTrade.run({
        id: o.id,
        account: '635698103',
        asset_type: 'equity',
        symbol: o.symbol,
        side: o.side,
        order_type: o.type || 'market',
        state: o.state,
        quantity: qty,
        average_price: avgPrice,
        total_value: avgPrice ? qty * avgPrice : null,
        fees: parseFloat((o as RawEquityOrder & { fees?: string }).fees || '0'),
        placed_agent: o.placed_agent || 'agentic',
        created_at: o.created_at,
        executed_at: o.last_transaction_at || null,
        expiration_date: null,
        strike_price: null,
        option_type: null,
        direction: null,
        premium: null,
      })
    }

    // option orders
    for (const o of data.option_orders.default) {
      const leg = o.legs?.[0]
      const qty = parseFloat(o.quantity || '0')
      const premium = o.processed_premium ? parseFloat(o.processed_premium) : (o.premium ? parseFloat(o.premium) : null)
      insertTrade.run({
        id: o.id,
        account: '5UO18408',
        asset_type: 'option',
        symbol: o.chain_symbol,
        side: leg?.option_type === 'call' ? (o.direction === 'credit' ? 'sell' : 'buy') : (o.direction === 'credit' ? 'sell' : 'buy'),
        order_type: o.type,
        state: o.state,
        quantity: qty,
        average_price: o.price ? parseFloat(o.price) : null,
        total_value: premium,
        fees: 0,
        placed_agent: o.placed_agent || 'user',
        created_at: o.created_at,
        executed_at: o.last_transaction_at || leg?.executions?.[0]?.timestamp || null,
        expiration_date: leg?.expiration_date || null,
        strike_price: leg?.strike_price ? parseFloat(leg.strike_price) : null,
        option_type: leg?.option_type || null,
        direction: o.direction || null,
        premium: premium,
      })
    }

    // positions
    for (const p of data.positions) {
      insertPosition.run({
        symbol: p.symbol,
        quantity: parseFloat(p.quantity),
        average_buy_price: parseFloat(p.average_buy_price),
        asset_type: 'equity',
      })
    }

    // portfolio snapshot
    const port = data.portfolio
    insertSnapshot.run({
      snapshot_at: port.snapshot_at,
      total_value: parseFloat(port.total_value),
      equity_value: parseFloat(port.equity_value),
      options_value: parseFloat(port.options_value),
      crypto_value: parseFloat(port.crypto_value),
      cash: parseFloat(port.cash),
    })
  })

  runAll()

  const newCount = (db.prepare('SELECT COUNT(*) as n FROM trades').get() as { n: number }).n
  return { seeded: true, trades: newCount }
}
