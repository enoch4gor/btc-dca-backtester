import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { FearGreedPoint } from '../types';
import { format } from 'date-fns';

interface FearGreedChartProps {
  data: FearGreedPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const classification = payload[0].payload.classification;
    
    let colorClass = "text-yellow-500";
    if (val <= 25) colorClass = "text-red-500";
    else if (val <= 45) colorClass = "text-orange-400";
    else if (val >= 75) colorClass = "text-green-500";
    else if (val >= 55) colorClass = "text-green-400";

    return (
      <div className="bg-tech-900/90 backdrop-blur border border-gray-700 p-2 rounded text-xs font-mono shadow-xl">
        <p className="text-gray-400 mb-1">{format(new Date(label), 'yyyy-MM-dd')}</p>
        <div className="flex items-baseline gap-2">
            <span className={`${colorClass} font-bold text-lg`}>{val}</span>
            <span className="text-gray-300 uppercase">{classification}</span>
        </div>
      </div>
    );
  }
  return null;
};

const FearGreedChart: React.FC<FearGreedChartProps> = ({ data }) => {
  return (
    <div className="glass-panel p-4 rounded-xl border border-tech-700/50 shadow-lg h-[200px] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-50">
        <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest text-right">Fear & Greed Index</h3>
      </div>
      
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, bottom: 0, left: 0 }}
            syncId="btc-hud-sync"
          >
            <defs>
              <linearGradient id="fearGreedGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                <stop offset="25%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#eab308" stopOpacity={0.3} />
                <stop offset="75%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} opacity={0.3} />
            
            <XAxis 
              dataKey="date" 
              type="number"
              domain={['dataMin', 'dataMax']}
              hide
            />
            
            <YAxis 
              orientation="left" 
              width={40}
              domain={[0, 100]}
              stroke="#475569" 
              tick={{fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono'}}
              axisLine={false}
              tickLine={false}
            />

             <YAxis 
              yAxisId="right"
              orientation="right" 
              width={40}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="5 5" opacity={0.3} />
            <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="5 5" opacity={0.3} />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#94a3b8"
              strokeWidth={1} 
              strokeOpacity={0.3}
              fill="url(#fearGreedGradient)"
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FearGreedChart;