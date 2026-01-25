import React from 'react';
import { SimulationResult } from '../types';
import { History, Terminal } from 'lucide-react';
import { format } from 'date-fns';

interface TradeJournalProps {
  data: SimulationResult[];
}

const TradeJournal: React.FC<TradeJournalProps> = ({ data }) => {
  // Filter for trade days and reverse to show most recent first
  const trades = data.filter(d => d.isTradeDay).reverse();

  const getActionBadge = (action: string) => {
    switch (action) {
        case 'rebalance_buy':
            return <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-green-900/40 text-green-400 text-[10px] font-mono border border-green-500/30 uppercase tracking-wider">REBAL BUY</span>;
        case 'rebalance_sell':
            return <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-red-900/40 text-red-400 text-[10px] font-mono border border-red-500/30 uppercase tracking-wider">REBAL SELL</span>;
        case 'dca_deposit':
             return <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-blue-900/40 text-blue-400 text-[10px] font-mono border border-blue-500/30 uppercase tracking-wider">DEPOSIT</span>;
        default:
            return <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-tech-cyan/20 text-tech-cyan text-[10px] font-mono border border-tech-cyan/30 uppercase tracking-wider">DCA BUY</span>;
    }
  };

  return (
    <div className="glass-panel rounded-xl flex flex-col max-h-[600px] border border-tech-700/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-tech-cyan via-tech-purple to-transparent"></div>
      
      <div className="p-4 border-b border-tech-700/50 flex items-center justify-between bg-tech-800/30">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-tech-gold/10 rounded border border-tech-gold/20">
                <Terminal className="text-tech-gold w-4 h-4" />
            </div>
            <div>
                <h2 className="text-lg font-display font-bold text-white tracking-wide">TRANSACTION LOG</h2>
                <p className="text-[10px] text-gray-500 font-mono uppercase">Ledger Records</p>
            </div>
        </div>
        <div className="text-[10px] font-mono text-gray-500">
            {trades.length} EVENTS LOGGED
        </div>
      </div>
      
      <div className="overflow-auto custom-scrollbar bg-tech-900/20">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-tech-900/90 text-gray-500 sticky top-0 z-10 backdrop-blur-md shadow-sm font-mono text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 font-normal">Date</th>
              <th className="p-4 font-normal">Operation</th>
              <th className="p-4 font-normal text-right">Value ($)</th>
              <th className="p-4 font-normal text-right">BTC Price</th>
              <th className="p-4 font-normal text-right">Assets</th>
              <th className="p-4 font-normal text-right">Cash</th>
              <th className="p-4 font-normal text-right">BTC Holdings</th>
              <th className="p-4 font-normal text-right">Return</th>
              <th className="p-4 font-normal text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tech-700/30 font-mono text-xs">
            {trades.map((trade) => {
              const isPositive = trade.returnRate >= 0;
              return (
                <tr key={trade.timestamp} className="hover:bg-tech-cyan/5 transition-colors group">
                  <td className="p-4 text-white/80 group-hover:text-tech-cyan transition-colors">
                    {format(new Date(trade.date), 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4">
                    {getActionBadge(trade.action)}
                  </td>
                  <td className="p-4 text-right text-gray-300">
                    {trade.actionAmount?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-4 text-right text-gray-500">
                    {trade.btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                   <td className="p-4 text-right text-tech-gold/80">
                    {trade.btcValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                   <td className="p-4 text-right text-green-400/80">
                    {trade.cashBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-4 text-right text-orange-300/80 font-bold">
                    {trade.btcAmount.toFixed(4)}
                  </td>
                   <td className={`p-4 text-right font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{trade.returnRate.toFixed(1)}%
                  </td>
                  <td className="p-4 text-right text-blue-300 font-bold group-hover:text-blue-100 glow-text">
                    {trade.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                </tr>
              );
            })}
             {trades.length === 0 && (
                <tr>
                    <td colSpan={9} className="p-12 text-center text-gray-600 font-mono">
                        // NO TRANSACTION DATA FOUND
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeJournal;