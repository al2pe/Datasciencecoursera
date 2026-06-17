export type AssetType = 'equity' | 'option'
export type TradeSide = 'buy' | 'sell'
export type TradeState = 'filled' | 'cancelled' | 'rejected' | 'pending'
export type PlacedAgent = 'user' | 'agentic' | 'drip' | 'debit_card_reward' | string

export interface Trade {
  id: string
  account: string
  asset_type: AssetType
  symbol: string
  side: TradeSide
  order_type: string
  state: TradeState
  quantity: number
  average_price: number | null
  total_value: number | null
  fees: number
  placed_agent: PlacedAgent
  created_at: string
  executed_at: string | null
  // option-specific
  expiration_date: string | null
  strike_price: number | null
  option_type: string | null
  direction: string | null
  premium: number | null
  // journal fields
  ai_analysis: string | null
  ai_tags: string | null
  notes: string | null
  imported_at: string
}

export interface Position {
  symbol: string
  quantity: number
  average_buy_price: number
  asset_type: string
  updated_at: string
}

export interface PortfolioSnapshot {
  id: number
  snapshot_at: string
  total_value: number
  equity_value: number
  options_value: number
  crypto_value: number
  cash: number
}

export interface TradeStats {
  total_trades: number
  equity_trades: number
  option_trades: number
  agentic_trades: number
  user_trades: number
  total_buy_value: number
  total_sell_value: number
  realized_pnl: number
  symbols_traded: number
}
