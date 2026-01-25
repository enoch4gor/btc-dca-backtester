import React, { useState, useEffect, useMemo } from 'react';
import { fetchBTCData } from './services/binance';
import { fetchFearAndGreedData } from './services/fearAndGreed';
import { calculateDCA } from './utils/calculator';
import { BTCPricePoint, StrategyConfig, Frequency, FearGreedPoint, RebalanceFrequency } from './types';
import ControlPanel from './components/ControlPanel';
import StatsSummary from './components/StatsSummary';
import ResultsChart from './components/ResultsChart';
import FearGreedChart from './components/FearGreedChart';
import TradeJournal from './components/TradeJournal';
import ParticleBackground from './components/Background';
import { format, isBefore, isAfter, isSameDay } from 'date-fns';
import { Bitcoin, AlertCircle, Loader2, Info, Cpu, WifiOff } from 'lucide-react';

// Helper to replace missing startOfDay from date-fns
const startOfDay = (date: Date | number): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper to replace missing subYears from date-fns
const subYears = (date: Date | number, amount: number): Date => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() - amount);
  return d;
};

const App: React.FC = () => {
  // Application State
  const [rawData, setRawData] = useState<BTCPricePoint[]>([]);
  const [fearGreedRawData, setFearGreedRawData] = useState<FearGreedPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  // Strategy Configuration State
  const [config, setConfig] = useState<StrategyConfig>({
    startDate: format(subYears(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    amount: 100,
    frequency: Frequency.WEEKLY,
    dayOfWeek: 1, // Monday
    dayOfMonth: 1,
    
    // Portfolio settings
    initialInvestment: 10000,
    enableKellyRebalance: false,
    targetRatio: 80, // 80% BTC
    rebalanceFrequency: RebalanceFrequency.MONTHLY,

    // Leverage Settings
    enableLeverage: false,
    leverage: 1.0,

    enableFearGreedFilter: false,
    fearGreedThreshold: 25,
    enableMaFilter: false,
    maThresholdType: '200',
  });

  // Load Data on Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Parallel fetch
        const [btcResult, fearGreedResult] = await Promise.all([
            fetchBTCData(),
            fetchFearAndGreedData()
        ]);

        setRawData(btcResult.data);
        setIsFallback(btcResult.isFallback);
        setFearGreedRawData(fearGreedResult);
        
        // Update end date to latest available if currently set to today
        if (btcResult.data.length > 0) {
          const lastDate = btcResult.data[btcResult.data.length - 1].date;
          setConfig(prev => ({
            ...prev,
            endDate: format(new Date(lastDate), 'yyyy-MM-dd')
          }));
        }
      } catch (err) {
        setError("Failed to load application data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Derived State: Calculations
  const { timeline, stats } = useMemo(() => {
    if (rawData.length === 0) {
       return { 
         timeline: [], 
         stats: { 
           totalInvested: 0, finalPortfolioValue: 0, totalReturn: 0, percentageReturn: 0, 
           tradesCount: 0, rebalanceCount: 0, currentBTCPrice: 0, finalCashBalance: 0, finalBTCValue: 0,
           isLiquidated: false, liquidationDate: null,
           finalBTCAmount: 0, averageEntryPrice: 0, currentFearGreed: null, durationDays: 0
         }
       };
    }
    return calculateDCA(rawData, fearGreedRawData, config);
  }, [rawData, fearGreedRawData, config]);

  // Derived State: Filtered F&G Data
  const filteredFearGreed = useMemo(() => {
    if (fearGreedRawData.length === 0) return [];
    
    const start = startOfDay(new Date(config.startDate));
    const end = startOfDay(new Date(config.endDate));
    
    // We only want data that overlaps with the current strategy window
    return fearGreedRawData.filter(p => {
        const d = startOfDay(new Date(p.date));
        return (isAfter(d, start) || isSameDay(d, start)) && 
               (isBefore(d, end) || isSameDay(d, end));
    }).map(p => ({
        ...p,
        dateStr: format(new Date(p.date), 'yyyy-MM-dd')
    }));
  }, [fearGreedRawData, config.startDate, config.endDate]);

  // Derived State: Min/Max dates for controls
  const minDate = rawData.length > 0 ? format(new Date(rawData[0].date), 'yyyy-MM-dd') : '';
  const maxDate = rawData.length > 0 ? format(new Date(rawData[rawData.length - 1].date), 'yyyy-MM-dd') : '';

  return (
    <div className="min-h-screen relative text-gray-100 overflow-hidden">
      <ParticleBackground />
      
      {/* Decorative HUD Elements */}
      <div className="fixed top-0 left-0 w-64 h-64 border-l border-t border-tech-cyan/20 rounded-tl-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-64 h-64 border-r border-b border-tech-cyan/20 rounded-br-3xl pointer-events-none" />
      
      {/* Main Container - Reduced padding on mobile (p-2) for wider chart */}
      <div className="relative z-10 p-2 md:p-4 lg:p-6">
        {/* Header */}
        <header className="w-full mb-8 flex items-center justify-between glass-panel p-4 rounded-xl border-l-4 border-l-tech-gold">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-tech-gold/20 rounded-full blur-md group-hover:bg-tech-gold/40 transition-all duration-500"></div>
              <div className="relative bg-tech-900/80 p-3 rounded-full border border-tech-gold/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                <Bitcoin className="w-8 h-8 text-tech-gold" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-wider text-white glow-text uppercase">
                BTC Strategy <span className="text-tech-cyan">HUD</span>
              </h1>
              <div className="flex items-center gap-2 text-tech-cyan/60 text-xs font-mono tracking-widest uppercase">
                <Cpu className="w-3 h-3" />
                <span>System Online</span>
                <span className="w-1 h-1 bg-tech-cyan rounded-full animate-pulse" />
                <span>v2.5.0</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-end">
            <div className="text-right">
              <span className="text-xs text-gray-500 font-mono block">MARKET STATUS</span>
              {isFallback ? (
                <span className="text-sm font-bold text-red-400 flex items-center gap-1 animate-pulse">
                  <WifiOff className="w-3 h-3" />
                  CONNECTION FAIL
                </span>
              ) : (
                <span className="text-sm font-bold text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  LIVE CONNECTION
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="w-full">
          {/* Liquidation Warning Banner */}
          {stats.isLiquidated && (
            <div className="mb-6 glass-panel border-l-4 border-l-red-500 bg-red-900/20 text-red-200 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-8 h-8 flex-shrink-0 animate-pulse text-red-500" />
              <div>
                <p className="font-display font-bold tracking-wide text-lg text-red-500 uppercase glow-text">CRITICAL FAILURE: POSITION LIQUIDATED</p>
                <p className="text-sm opacity-90 font-mono">
                  Market price hit liquidation threshold on {format(new Date(stats.liquidationDate || ''), 'yyyy-MM-dd')}. Total loss of capital.
                </p>
              </div>
            </div>
          )}

          {/* API Error / Fallback Warning */}
          {isFallback && !loading && (
            <div className="mb-6 glass-panel border-l-4 border-l-yellow-500 text-yellow-200 p-4 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <Info className="w-5 h-5 flex-shrink-0 animate-pulse" />
              <div>
                <p className="font-display font-bold tracking-wide">SIMULATION MODE ACTIVE</p>
                <p className="text-sm opacity-80 font-mono">
                  Binance Uplink Failed. Engaging Synthetic Market Generator.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 glass-panel border-l-4 border-l-red-500 text-red-200 p-4 rounded-r-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-mono">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-tech-cyan/20 blur-xl rounded-full"></div>
                <Loader2 className="w-16 h-16 text-tech-cyan animate-spin relative z-10" />
              </div>
              <p className="text-tech-cyan font-display tracking-widest animate-pulse">INITIALIZING SYSTEM DATA...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Sidebar: Controls */}
              <div className="lg:col-span-3 xl:col-span-3">
                <ControlPanel 
                  config={config} 
                  setConfig={setConfig} 
                  minDate={minDate} 
                  maxDate={maxDate} 
                />
              </div>

              {/* Right Content: Charts & Stats */}
              <div className="lg:col-span-9 xl:col-span-9 space-y-6">
                <StatsSummary stats={stats} />
                
                <div className="relative space-y-1">
                   {/* Main Chart */}
                   <div className="relative group">
                       <div className="absolute -inset-0.5 bg-gradient-to-r from-tech-cyan to-tech-purple opacity-20 group-hover:opacity-40 transition duration-500 blur rounded-xl"></div>
                       <div className="relative glass-panel rounded-xl overflow-hidden">
                           {/* Removed chart overlay badge here */}
                           <ResultsChart data={timeline} />
                       </div>
                   </div>
                   
                   {/* Fear & Greed Chart */}
                   {filteredFearGreed.length > 0 && (
                      <div className="relative group mt-6">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-green-500 opacity-10 group-hover:opacity-20 transition duration-500 blur rounded-xl"></div>
                        <div className="relative">
                          <FearGreedChart data={filteredFearGreed} />
                        </div>
                      </div>
                   )}
                </div>

                <TradeJournal data={timeline} />

                {/* Data disclaimer */}
                <div className="text-center mt-12 mb-4">
                   <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-gray-700/50">
                      <div className={`w-2 h-2 rounded-full ${isFallback ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
                      <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                        {isFallback 
                          ? "Source: Synthetic Generator [Demo]" 
                          : "Source: Binance API [Live] • Alternative.me"}
                      </p>
                   </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;