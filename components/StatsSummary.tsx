import React from 'react';
import { StrategyStats } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Activity, Repeat, Target, Bitcoin, Gauge, Coins, CalendarClock, ArrowDownToLine } from 'lucide-react';

interface StatsSummaryProps {
  stats: StrategyStats;
}

const StatCard = ({ label, value, subValue, icon: Icon, colorClass, borderClass }: any) => (
  <div className={`relative glass-panel p-4 rounded-xl overflow-hidden group hover:border-opacity-50 transition-all duration-300 ${borderClass}`}>
    <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        <Icon className="w-12 h-12" />
    </div>
    
    <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-md bg-opacity-20 ${colorClass.replace('text-', 'bg-')}`}>
                <Icon className={`w-4 h-4 ${colorClass}`} />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">{label}</span>
        </div>
        
        <div className="text-xl lg:text-2xl font-display font-bold text-white tracking-wide glow-text break-words">
            {value}
        </div>
        {subValue && (
            <div className={`text-xs font-mono mt-1 font-bold ${colorClass}`}>
                {subValue}
            </div>
        )}
    </div>
  </div>
);

const StatsSummary: React.FC<StatsSummaryProps> = ({ stats }) => {
  const isProfit = stats.totalReturn >= 0;
  
  const getFGColor = (val: number | null) => {
    if (val === null) return "text-gray-400";
    if (val <= 25) return "text-red-500";
    if (val <= 45) return "text-orange-400";
    if (val <= 55) return "text-gray-400";
    if (val <= 75) return "text-green-400";
    return "text-green-500";
  };

  const fgColor = getFGColor(stats.currentFearGreed);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Row 1: Market & Strategy Meta */}
      <StatCard 
        label="BTC Price" 
        value={`$${stats.currentBTCPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        icon={Bitcoin}
        colorClass="text-tech-gold"
        borderClass="border-tech-gold/30"
      />

       <StatCard 
        label="Fear & Greed" 
        value={stats.currentFearGreed ?? "N/A"}
        subValue="CURRENT INDEX"
        icon={Gauge}
        colorClass={fgColor}
        borderClass={`border-current opacity-80 ${fgColor.replace('text-', 'border-')}/30`}
      />

       <StatCard 
        label="Avg Entry Price" 
        value={`$${stats.averageEntryPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        icon={ArrowDownToLine}
        colorClass="text-cyan-400"
        borderClass="border-cyan-500/30"
      />

      <StatCard 
        label="Executions" 
        value={stats.tradesCount}
        subValue={`${stats.rebalanceCount} REBALANCES`}
        icon={Repeat}
        colorClass="text-tech-cyan"
        borderClass="border-tech-cyan/30"
      />

      <StatCard 
        label="Timeframe" 
        value={stats.durationDays}
        subValue="DAYS DURATION"
        icon={CalendarClock}
        colorClass="text-gray-300"
        borderClass="border-gray-500/30"
      />

      {/* Row 2: Financial Performance */}
      <StatCard 
        label="Invested Capital" 
        value={`$${stats.totalInvested.toLocaleString()}`}
        icon={Target}
        colorClass="text-tech-purple"
        borderClass="border-tech-purple/30"
      />

      <StatCard 
        label="Portfolio Value" 
        value={`$${stats.finalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        subValue="TOTAL ASSETS"
        icon={Wallet}
        colorClass="text-blue-400"
        borderClass="border-blue-500/30"
      />

      <StatCard 
        label="Net Return" 
        value={`${stats.totalReturn < 0 ? '-' : ''}$${Math.abs(stats.totalReturn).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        subValue={isProfit ? "PROFIT" : "LOSS"}
        icon={isProfit ? TrendingUp : TrendingDown}
        colorClass={isProfit ? "text-green-400" : "text-red-400"}
        borderClass={isProfit ? "border-green-500/30" : "border-red-500/30"}
      />

      <StatCard 
        label="ROI %" 
        value={`${stats.percentageReturn.toFixed(2)}%`}
        icon={Activity}
        colorClass={isProfit ? "text-green-400" : "text-red-400"}
        borderClass={isProfit ? "border-green-500/30" : "border-red-500/30"}
      />

      <StatCard 
        label="BTC Accumulated" 
        value={`${stats.finalBTCAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}`}
        subValue="COINS HELD"
        icon={Coins}
        colorClass="text-orange-300"
        borderClass="border-orange-500/30"
      />
    </div>
  );
};

export default StatsSummary;