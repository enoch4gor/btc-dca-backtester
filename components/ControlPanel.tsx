import React, { useState, useEffect } from 'react';
import { Frequency, StrategyConfig, RebalanceFrequency } from '../types';
import { Calendar, DollarSign, Clock, Settings2, Gauge, Activity, PieChart, RefreshCw, Sliders, Zap, TriangleAlert, Wallet, HelpCircle, X } from 'lucide-react';

interface ControlPanelProps {
  config: StrategyConfig;
  setConfig: React.Dispatch<React.SetStateAction<StrategyConfig>>;
  minDate: string;
  maxDate: string;
}

const HELP_CONTENT: Record<string, { title: string; text: string }> = {
  initialCapital: {
    title: "Initial Capital",
    text: "The lump sum of money you start with on Day 1. This buys Bitcoin immediately at the beginning of the timeline, establishing your starting position before any recurring (DCA) investments begin."
  },
  dcaAmount: {
    title: "DCA Amount",
    text: "Dollar-Cost Averaging (DCA) means investing a fixed amount of money at regular intervals (like $100 every week). This strategy helps smooth out your average entry price over time, reducing the risk of buying everything at a peak."
  },
  fearGreed: {
    title: "Fear & Greed Filter",
    text: "A smart filter that attempts to 'buy the dip'. It pauses your buying when the market is 'Greedy' (prices are hyped/high) and only allows buying when the market is 'Fearful' (prices are low) or Neutral."
  },
  trendFilter: {
    title: "Trend Filter (Moving Average)",
    text: "A safety mechanism that only allows buying when the price is considered 'cheap' relative to its long-term trend. It uses the 200-day or 350-day average price as a baseline; if the current price is above this line, it waits."
  },
  kelly: {
    title: "Kelly Rebalance",
    text: "An advanced portfolio strategy. Instead of just buying, it maintains a specific percentage of Bitcoin in your portfolio (e.g., 80% BTC, 20% Cash). It automatically buys when BTC drops to restore the ratio, and sells some when BTC skyrockets to lock in profits."
  },
  leverage: {
    title: "Leverage Protocol",
    text: "WARNING: This involves borrowing money to multiply your trade size. While 2x leverage doubles your potential profit, it also doubles your risk. If the price drops significantly, your entire account can be wiped out (Liquidated). Not recommended for beginners."
  }
};

// Helper component to delay updates until blur or Enter key
const BufferedNumberInput = ({ value, onCommit, className, ...props }: any) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    const num = parseFloat(localValue);
    if (!isNaN(num) && num !== value) {
      onCommit(num);
    } else {
      // Revert if invalid or empty
      if (isNaN(num)) setLocalValue(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="number"
      className={className}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({ config, setConfig, minDate, maxDate }) => {
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

  const handleChange = (field: keyof StrategyConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const getFearGreedLabel = (val: number) => {
    if (val <= 25) return <span className="text-red-500 font-bold glow-text">Extreme Fear</span>;
    if (val <= 45) return <span className="text-orange-400 font-bold">Fear</span>;
    if (val <= 55) return <span className="text-gray-400 font-bold">Neutral</span>;
    if (val <= 75) return <span className="text-green-400 font-bold">Greed</span>;
    return <span className="text-green-500 font-bold glow-text">Extreme Greed</span>;
  };

  const InputWrapper = ({ label, icon: Icon, helpKey, children }: any) => (
    <div className="group w-full">
      <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-mono text-tech-cyan/70 flex items-center gap-2 uppercase tracking-wider group-focus-within:text-tech-cyan transition-colors">
            {Icon && <Icon className="w-3 h-3" />} {label}
          </label>
          {helpKey && (
             <button 
               onClick={(e) => { e.preventDefault(); setActiveHelp(helpKey); }}
               className="text-tech-700 hover:text-tech-cyan transition-colors p-0.5"
               aria-label="Info"
             >
                <HelpCircle className="w-3.5 h-3.5" />
             </button>
          )}
      </div>
      {children}
    </div>
  );

  const baseInputClass = "w-full min-w-0 max-w-full bg-tech-900/50 border border-tech-700 rounded-md p-2.5 text-base md:text-sm text-gray-200 font-mono focus:ring-1 focus:ring-tech-cyan focus:border-tech-cyan focus:outline-none transition-all duration-300 hover:border-tech-cyan/50 backdrop-blur-sm";

  return (
    <>
      {/* Help Modal Overlay */}
      {activeHelp && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveHelp(null)}
        >
          <div 
            className="bg-tech-900 border border-tech-cyan rounded-xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(6,182,212,0.2)] relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveHelp(null)} 
              className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-4 text-tech-cyan">
                <HelpCircle className="w-5 h-5" />
                <h3 className="text-lg font-display tracking-wider font-bold">{HELP_CONTENT[activeHelp].title}</h3>
            </div>
            <p className="text-sm font-mono text-gray-300 leading-relaxed border-t border-tech-700/50 pt-4">
                {HELP_CONTENT[activeHelp].text}
            </p>
          </div>
        </div>
      )}

      <div className="glass-panel p-6 rounded-xl h-full flex flex-col gap-6 relative overflow-hidden">
        {/* Decorative scan line for panel */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tech-cyan/50 to-transparent"></div>

        <div className="flex items-center gap-3 border-b border-tech-700/50 pb-4">
          <div className="bg-tech-cyan/10 p-2 rounded-lg border border-tech-cyan/20">
              <Settings2 className="text-tech-cyan w-5 h-5" />
          </div>
          <div>
              <h2 className="text-lg font-display font-bold text-white tracking-wide">CONFIGURATION</h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase">Strategy Parameters</p>
          </div>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* 1. Date Range */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-white/80 border-l-2 border-tech-cyan pl-2">
              <Calendar className="w-4 h-4 text-tech-cyan" /> 
              <span className="text-sm font-bold font-display tracking-wider">TIMEFRAME</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <InputWrapper label="Start Date">
                <input
                  type="date"
                  className={`${baseInputClass} appearance-none`}
                  value={config.startDate}
                  min={minDate}
                  max={config.endDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                />
              </InputWrapper>
              <InputWrapper label="End Date">
                <input
                  type="date"
                  className={`${baseInputClass} appearance-none`}
                  value={config.endDate}
                  min={config.startDate}
                  max={maxDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                />
              </InputWrapper>
            </div>
          </section>

          {/* 2. Capital Injection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-white/80 border-l-2 border-tech-purple pl-2">
              <DollarSign className="w-4 h-4 text-tech-purple" /> 
              <span className="text-sm font-bold font-display tracking-wider">CAPITAL INJECTION</span>
            </div>
            
            <InputWrapper label="Initial Capital ($)" icon={Wallet} helpKey="initialCapital">
               <BufferedNumberInput
                min="0"
                className={baseInputClass}
                value={config.initialInvestment}
                onCommit={(val: number) => handleChange('initialInvestment', val)}
              />
            </InputWrapper>

            <InputWrapper label="DCA Amount ($)" icon={DollarSign} helpKey="dcaAmount">
               <BufferedNumberInput
                min="1"
                className={baseInputClass}
                value={config.amount}
                onCommit={(val: number) => handleChange('amount', val)}
              />
            </InputWrapper>

            <InputWrapper label="Frequency" icon={Clock}>
               <select
                className={baseInputClass}
                value={config.frequency}
                onChange={(e) => handleChange('frequency', e.target.value as Frequency)}
              >
                <option value={Frequency.DAILY}>Daily</option>
                <option value={Frequency.WEEKLY}>Weekly</option>
                <option value={Frequency.MONTHLY}>Monthly</option>
              </select>
            </InputWrapper>
            
            {config.frequency === Frequency.WEEKLY && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                 <InputWrapper label="Day of Week">
                    <select
                      className={baseInputClass}
                      value={config.dayOfWeek}
                      onChange={(e) => handleChange('dayOfWeek', parseInt(e.target.value))}
                    >
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                          <option key={i} value={i}>{day}</option>
                      ))}
                    </select>
                 </InputWrapper>
              </div>
            )}

            {config.frequency === Frequency.MONTHLY && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                 <InputWrapper label="Day of Month">
                    <select
                      className={baseInputClass}
                      value={config.dayOfMonth}
                      onChange={(e) => handleChange('dayOfMonth', parseInt(e.target.value))}
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                        </option>
                      ))}
                    </select>
                 </InputWrapper>
              </div>
            )}
          </section>

          {/* DIVIDER: DCA Condition */}
          <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-tech-700/50"></div>
              </div>
              <div className="relative flex justify-center">
                  <span className="bg-tech-800/80 px-4 text-[10px] text-tech-cyan/60 font-mono uppercase tracking-widest backdrop-blur-sm border border-tech-700/30 rounded-full">
                      DCA Condition
                  </span>
              </div>
          </div>

          {/* 3. Fear & Greed Filter */}
          <section className="space-y-4">
              <div className="flex items-center justify-between border-l-2 border-green-500 pl-2">
                  <div className="flex items-center gap-2 text-white/80">
                      <Gauge className={`w-4 h-4 text-green-500`} />
                      <span className="text-sm font-bold font-display tracking-wider">FEAR & GREED FILTER</span>
                      <button onClick={() => setActiveHelp('fearGreed')} className="text-tech-700 hover:text-green-500 transition-colors ml-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={config.enableFearGreedFilter}
                          onChange={(e) => handleChange('enableFearGreedFilter', e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-tech-800 peer-focus:outline-none border border-tech-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500 peer-checked:after:bg-white peer-checked:border-green-500/50 shadow-inner"></div>
                  </label>
              </div>

              {config.enableFearGreedFilter && (
                  <div className="bg-tech-900/40 p-3 rounded border border-green-500/20 animate-in fade-in slide-in-from-top-2">
                      <div className="flex justify-between items-center mb-2 text-xs font-mono">
                           <span className="text-gray-400">Max Index:</span>
                           <span className="text-green-400 font-bold">{config.fearGreedThreshold}</span>
                      </div>
                      <input
                          type="range"
                          min="5"
                          max="95"
                          className="w-full h-1.5 bg-tech-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                          value={config.fearGreedThreshold}
                          onChange={(e) => handleChange('fearGreedThreshold', parseInt(e.target.value))}
                      />
                      <div className="mt-2 text-center text-xs">
                          {getFearGreedLabel(config.fearGreedThreshold)}
                      </div>
                  </div>
              )}
          </section>

          {/* 4. Trend Filter (MA) */}
          <section className="space-y-4">
              <div className="flex items-center justify-between border-l-2 border-tech-cyan pl-2">
                  <div className="flex items-center gap-2 text-white/80">
                      <Activity className="w-4 h-4 text-tech-cyan" />
                      <span className="text-sm font-bold font-display tracking-wider">TREND FILTER (MA)</span>
                      <button onClick={() => setActiveHelp('trendFilter')} className="text-tech-700 hover:text-tech-cyan transition-colors ml-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={config.enableMaFilter}
                          onChange={(e) => handleChange('enableMaFilter', e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-tech-800 peer-focus:outline-none border border-tech-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tech-cyan peer-checked:after:bg-white peer-checked:border-tech-cyan/50 shadow-inner"></div>
                  </label>
              </div>

              {config.enableMaFilter && (
                 <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                     {['200', '350'].map((type) => (
                         <button
                           key={type}
                           onClick={() => handleChange('maThresholdType', type)}
                           className={`p-2 rounded border text-xs font-mono transition-all ${config.maThresholdType === type 
                              ? 'bg-tech-cyan/20 border-tech-cyan text-tech-cyan shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                              : 'bg-tech-900 border-tech-700 text-gray-500 hover:border-gray-500'}`}
                         >
                           {type} DMA
                         </button>
                     ))}
                 </div>
              )}
          </section>

          {/* DIVIDER: Advanced Strategy */}
          <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-tech-700/50"></div>
              </div>
              <div className="relative flex justify-center">
                  <span className="bg-tech-800/80 px-4 text-[10px] text-tech-cyan/60 font-mono uppercase tracking-widest backdrop-blur-sm border border-tech-700/30 rounded-full">
                      Advanced Strategy
                  </span>
              </div>
          </div>

          {/* 5. Kelly Rebalance */}
          <section className="space-y-4">
             <div className="flex items-center justify-between border-l-2 border-tech-gold pl-2">
              <div className="flex items-center gap-2 text-white/80">
                <PieChart className="w-4 h-4 text-tech-gold" /> 
                <span className="text-sm font-bold font-display tracking-wider">KELLY REBALANCE</span>
                <button onClick={() => setActiveHelp('kelly')} className="text-tech-700 hover:text-tech-gold transition-colors ml-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={config.enableKellyRebalance}
                  onChange={(e) => handleChange('enableKellyRebalance', e.target.checked)}
                />
                <div className="w-9 h-5 bg-tech-800 peer-focus:outline-none border border-tech-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tech-gold peer-checked:after:bg-white peer-checked:border-tech-gold/50 shadow-inner"></div>
              </label>
            </div>

            {config.enableKellyRebalance && (
               <div className="bg-tech-800/30 p-4 rounded-lg border border-tech-gold/20 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                     <div className="flex justify-between items-end">
                        <label className="text-xs font-mono text-tech-gold/80 uppercase">Target Ratio</label>
                        <span className="text-xs font-bold text-tech-gold font-mono">{config.targetRatio}% BTC</span>
                     </div>
                     <input
                      type="range"
                      min="1"
                      max="100"
                      className="w-full h-1.5 bg-tech-900 rounded-lg appearance-none cursor-pointer accent-tech-gold"
                      value={config.targetRatio}
                      onChange={(e) => handleChange('targetRatio', parseInt(e.target.value))}
                    />
                  </div>

                  <InputWrapper label="Rebalance Interval" icon={RefreshCw}>
                    <select
                      className={baseInputClass}
                      value={config.rebalanceFrequency}
                      onChange={(e) => handleChange('rebalanceFrequency', e.target.value as RebalanceFrequency)}
                    >
                      <option value={RebalanceFrequency.EVERY_DCA}>Per Trade / DCA</option>
                      <option value={RebalanceFrequency.DAILY}>Daily</option>
                      <option value={RebalanceFrequency.WEEKLY}>Weekly</option>
                      <option value={RebalanceFrequency.MONTHLY}>Monthly</option>
                    </select>
                  </InputWrapper>
               </div>
            )}
          </section>

          {/* 6. Leverage Protocol */}
          <section className="space-y-4">
             <div className="flex items-center justify-between border-l-2 border-red-500 pl-2">
              <div className="flex items-center gap-2 text-white/80">
                <Zap className="w-4 h-4 text-red-500" /> 
                <span className="text-sm font-bold font-display tracking-wider text-red-100">LEVERAGE PROTOCOL</span>
                <button onClick={() => setActiveHelp('leverage')} className="text-tech-700 hover:text-red-500 transition-colors ml-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={config.enableLeverage}
                  onChange={(e) => handleChange('enableLeverage', e.target.checked)}
                />
                <div className="w-9 h-5 bg-tech-800 peer-focus:outline-none border border-tech-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500 peer-checked:after:bg-white peer-checked:border-red-500/50 shadow-inner"></div>
              </label>
            </div>

            {config.enableLeverage && (
               <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                     <div className="flex justify-between items-end">
                        <label className="text-xs font-mono text-red-400 uppercase font-bold">Multiplier</label>
                        <span className="text-lg font-bold text-red-500 font-display glow-text">{config.leverage.toFixed(1)}x</span>
                     </div>
                     <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.1"
                      className="w-full h-1.5 bg-tech-900 rounded-lg appearance-none cursor-pointer accent-red-500"
                      value={config.leverage}
                      onChange={(e) => handleChange('leverage', parseFloat(e.target.value))}
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                      <span>1.0x</span>
                      <span>10.0x</span>
                    </div>
                  </div>

                  <div className="flex gap-2 items-start p-2 bg-red-950/40 rounded border border-red-900/50">
                      <TriangleAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-200/80 leading-relaxed font-mono">
                          <span className="font-bold text-red-400">WARNING:</span> DCAing into a leveraged position increases your Liquidation Price. 
                          A market drop of <span className="text-white font-bold">{(100/config.leverage).toFixed(1)}%</span> will result in total loss of capital.
                      </p>
                  </div>
               </div>
            )}
          </section>

        </div>
      </div>
    </>
  );
};

export default ControlPanel;