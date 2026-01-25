export interface BTCPricePoint {
  date: number; // Timestamp
  price: number;
}

export enum Frequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  NEVER = 'never'
}

export enum RebalanceFrequency {
  EVERY_DCA = 'every_dca',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface StrategyConfig {
  startDate: string;
  endDate: string;
  
  // DCA Settings
  amount: number; // Periodic injection amount
  frequency: Frequency;
  dayOfWeek: number; 
  dayOfMonth: number; 

  // Portfolio / Kelly Settings
  initialInvestment: number;
  enableKellyRebalance: boolean;
  targetRatio: number; // Percentage (0-100) for BTC
  rebalanceFrequency: RebalanceFrequency;

  // Leverage Settings
  enableLeverage: boolean;
  leverage: number; // 1.0 to 10.0

  // Conditionals
  enableFearGreedFilter: boolean;
  fearGreedThreshold: number; 
  enableMaFilter: boolean;
  maThresholdType: '200' | '350';
}

export interface SimulationResult {
  date: string;
  timestamp: number;
  btcPrice: number;
  
  // Portfolio State
  cashBalance: number;
  btcAmount: number;
  btcValue: number;
  portfolioValue: number; // cash + btcValue
  totalInvested: number; // Cumulative capital injected (Initial + DCA)
  invested: number;
  returnRate: number; // Percentage return ((Portfolio - Invested) / Invested) * 100
  
  // Leverage Specifics
  averageEntryPrice: number | null;
  liquidationPrice: number | null;
  isLiquidated: boolean;

  // Actions
  action: 'none' | 'dca_buy' | 'rebalance_buy' | 'rebalance_sell' | 'dca_deposit' | 'liquidation';
  actionAmount: number; // USD value of the action
  isTradeDay: boolean;

  // Indicators
  ma200: number | null;
  ma350: number | null;
  fearGreedValue: number | null;
}

export interface StrategyStats {
  totalInvested: number;
  finalPortfolioValue: number;
  totalReturn: number;
  percentageReturn: number;
  tradesCount: number;
  rebalanceCount: number;
  currentBTCPrice: number;
  finalCashBalance: number;
  finalBTCValue: number;
  isLiquidated: boolean;
  liquidationDate: string | null;
  
  // New Stats
  finalBTCAmount: number;
  averageEntryPrice: number;
  currentFearGreed: number | null;
  durationDays: number;
}

export interface FearGreedPoint {
  date: number;
  value: number;
  classification: string;
}