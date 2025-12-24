import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

function StockTicker({ symbol = 'QTZM' }) {
  const [quote, setQuote] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setError(false);
        setIsLive(false);
        const data = await api.getStockQuote(symbol);
        setQuote(data);
        setIsLive(true);
        
        setTimeout(() => setIsLive(false), 2000);
      } catch (err) {
        console.error('Failed to fetch stock quote:', err);
        setError(true);
      }
    };

    fetchQuote();
    const interval = setInterval(fetchQuote, 15000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <span className="text-sm text-red-600 dark:text-red-400">
          Failed to load stock price
        </span>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center gap-3 bg-white dark:bg-dark-card px-4 py-2 rounded-lg shadow-sm animate-pulse">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    );
  }

  const isPositive = quote.change >= 0;

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-dark-card px-4 py-3 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border">
      <span className="text-2xl">🎯</span>
      
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">{quote.symbol}</span>
          <span className="text-2xl font-semibold">
            ${quote.price.toFixed(2)}
          </span>
        </div>
        
        <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded ${
          isPositive 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>
            {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
          </span>
        </div>

        {isLive && (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-medium">LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockTicker;