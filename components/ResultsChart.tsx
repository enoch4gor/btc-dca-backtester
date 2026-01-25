import React, { useState } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area
} from 'recharts';
import { SimulationResult } from '../types';
import { format } from 'date-fns';

interface ResultsChartProps {
  data: SimulationResult[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const getPayloadItem = (key: string) => payload.find((p: any) => p.dataKey === key);

    const portfolioVal = getPayloadItem('portfolioValue');
    const cashVal = getPayloadItem('cashBalance');
    const btcVal = getPayloadItem('btcValue');
    const investedVal = getPayloadItem('invested');
    const btcPrice = getPayloadItem('btcPrice');
    const liqPrice = getPayloadItem('liquidationPrice');
    const avgEntry = getPayloadItem('averageEntryPrice');
    const fgVal = getPayloadItem('fearGreedValue');
    
    const dataPoint = payload[0]?.payload;
    const returnRate = dataPoint?.returnRate || 0;
    const isPositive = returnRate >= 0;
    const isLiquidated = dataPoint?.isLiquidated;
    
    // Calculate Net Return Value
    const netReturnVal = (portfolioVal?.value || 0) - (investedVal?.value || 0);
    const isNetPositive = netReturnVal >= 0;

    return (
      <div className="bg-tech-900/90 backdrop-blur-xl border border-tech-cyan/30 p-4 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.15)] text-sm z-50 min-w-[220px]">
        <div className="flex justify-between items-center border-b border-tech-cyan/20 pb-2 mb-2">
            <span className="text-tech-cyan font-mono font-bold">{format(new Date(label), 'MMM dd, yyyy')}</span>
            {isLiquidated ? (
               <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-500 animate-pulse">
                   LIQUIDATED
               </span>
            ) : (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    ROI: {returnRate.toFixed(2)}%
                </span>
            )}
        </div>
        
        <div className="space-y-2 font-mono text-xs">
          {portfolioVal && (
            <div className="flex justify-between">
                <span className="text-gray-400">Portfolio:</span>
                <span className="text-blue-400 font-bold glow-text">${portfolioVal.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
          )}
           {investedVal && (
            <div className="flex justify-between">
                <span className="text-gray-400">Invested:</span>
                <span className="text-tech-purple font-bold">${investedVal.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
          )}
          
          <div className="h-px bg-gray-700/50 my-1"></div>
          <div className="flex justify-between">
             <span className="text-gray-400">Net Return:</span>
             <span className={`${isNetPositive ? 'text-green-400' : 'text-red-400'} font-bold`}>
                 {isNetPositive ? '+' : '-'}${Math.abs(netReturnVal).toLocaleString(undefined, {maximumFractionDigits: 0})}
             </span>
          </div>
          <div className="h-px bg-gray-700/50 my-1"></div>

          {btcVal && (
            <div className="flex justify-between">
              <span className="text-gray-500">Asset Value:</span>
              <span className="text-tech-gold">${btcVal.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
          )}
          {cashVal && (
            <div className="flex justify-between">
              <span className="text-gray-500">Cash:</span>
              <span className="text-green-500">${cashVal.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
          )}
          
          <div className="h-px bg-gray-700/50 my-1"></div>
          
          {avgEntry && (
             <div className="flex justify-between">
                <span className="text-gray-500">Avg Entry:</span>
                <span className="text-cyan-400 font-bold">${avgEntry.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
          )}
          
          {liqPrice && (
             <div className="flex justify-between">
                <span className="text-gray-500">Liquidation:</span>
                <span className="text-red-500 font-bold">${liqPrice.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
          )}

          {btcPrice && (
            <div className="flex justify-between">
                <span className="text-gray-500">BTC Price:</span>
                <span className="text-tech-gold font-bold">${btcPrice.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
          )}

          {fgVal && fgVal.value !== null && (
             <div className="flex justify-between pt-1 border-t border-gray-700/50 mt-1">
                <span className="text-gray-500">Fear & Greed:</span>
                <span className={`font-bold ${fgVal.value >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {fgVal.value}
                </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomTradeDot = (props: any) => {
  const { cx, cy, payload } = props;
  
  if (!payload.isTradeDay) return null;

  let fill = "#22c55e"; // Green default
  if (payload.action === 'rebalance_sell') fill = "#ef4444";
  if (payload.action === 'dca_deposit') fill = "#3b82f6";
  if (payload.action === 'liquidation') fill = "#ff0000";

  return (
    <g>
       {payload.action === 'liquidation' ? (
         <g>
             <circle cx={cx} cy={cy} r={8} fill="none" stroke="#ff0000" strokeWidth={2} className="animate-pulse" />
             <line x1={cx-4} y1={cy-4} x2={cx+4} y2={cy+4} stroke="#ff0000" strokeWidth={2} />
             <line x1={cx+4} y1={cy-4} x2={cx-4} y2={cy+4} stroke="#ff0000" strokeWidth={2} />
         </g>
       ) : (
         <g>
            <circle cx={cx} cy={cy} r={6} fill={fill} fillOpacity={0.3} />
            <circle cx={cx} cy={cy} r={3} fill={fill} stroke="#0f172a" strokeWidth={1} />
         </g>
       )}
    </g>
  );
};

const ResultsChart: React.FC<ResultsChartProps> = ({ data }) => {
  // State to manage visibility of chart lines
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({
    ma200: false,
    ma350: false,
    btcPrice: false,
    portfolioValue: false,
    invested: false,
    cashBalance: false,
    btcValue: true,
    averageEntryPrice: false,
    liquidationPrice: false
  });

  const handleLegendClick = (e: any) => {
    const { dataKey } = e;
    setHiddenSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  return (
    <div className="h-[500px] w-full p-0 md:p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
            syncId="btc-hud-sync"
          >
            <defs>
              <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} opacity={0.5} />
            
            <XAxis 
              dataKey="timestamp" 
              type="number"
              domain={['dataMin', 'dataMax']}
              stroke="#64748b" 
              tick={{fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono'}}
              tickFormatter={(ts) => format(new Date(ts), 'MMM yy')}
              minTickGap={50}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              width={45}
              stroke="#3b82f6" 
              tick={{fill: '#3b82f6', fontSize: 10, fontFamily: 'JetBrains Mono'}}
              tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
            />
            
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              width={45}
              stroke="#fbbf24" 
              tick={{fill: '#fbbf24', fontSize: 10, fontFamily: 'JetBrains Mono'}}
              tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              verticalAlign="top" 
              height={36} 
              onClick={handleLegendClick}
              iconType="rect"
              wrapperStyle={{ fontFamily: 'Rajdhani', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}
              formatter={(value, entry: any) => {
                  const isHidden = hiddenSeries[entry.dataKey];
                  return <span className={isHidden ? 'text-gray-600 line-through' : 'text-gray-300 hover:text-white transition-colors'}>{value}</span>;
              }}
            />
            
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="cashBalance"
              name="Cash Reserve"
              fill="url(#colorCash)"
              stroke="#10b981"
              strokeWidth={1}
              fillOpacity={1}
              hide={hiddenSeries['cashBalance']}
            />
             
             <Line
              yAxisId="left"
              type="monotone"
              dataKey="btcValue"
              name="Asset Value"
              stroke="#eab308" 
              strokeWidth={1}
              dot={false}
              hide={hiddenSeries['btcValue']}
              opacity={0.8}
            />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="portfolioValue"
              name="Total Portfolio"
              fill="url(#colorPortfolio)"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              hide={hiddenSeries['portfolioValue']}
              className="drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            />

             <Line
              yAxisId="left"
              type="monotone"
              dataKey="invested"
              name="Invested"
              stroke="#a78bfa" 
              strokeWidth={2}
              dot={false}
              hide={hiddenSeries['invested']}
              opacity={1}
            />
            
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="btcPrice"
              name="BTC Price"
              stroke="#fbbf24"
              strokeWidth={1}
              dot={<CustomTradeDot />}
              activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff' }}
              hide={hiddenSeries['btcPrice']}
              opacity={0.5}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ma200"
              name="200D MA"
              stroke="#f97316"
              strokeWidth={1}
              dot={false}
              hide={hiddenSeries['ma200']}
              opacity={0.7}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ma350"
              name="350D MA"
              stroke="#10b981"
              strokeWidth={1}
              dot={false}
              hide={hiddenSeries['ma350']}
              opacity={0.7}
            />

            {/* New Lines for Leverage */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="averageEntryPrice"
              name="Avg Entry"
              stroke="#22d3ee" // Cyan
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              hide={hiddenSeries['averageEntryPrice']}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="liquidationPrice"
              name="Liquidation"
              stroke="#ef4444" // Red
              strokeWidth={2}
              dot={false}
              hide={hiddenSeries['liquidationPrice']}
            />
            
            {/* Hidden line for F&G data access in tooltip */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="fearGreedValue"
              name="F&G"
              stroke="transparent"
              dot={false}
              hide={true}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
    </div>
  );
};

export default ResultsChart;