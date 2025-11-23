'use client';

import { useState } from 'react';

// --- Types ---
interface BacktestModalProps {
  strategyId: string;
  strategyName: string;
  onClose: () => void;
}

interface BacktestReport {
  strategyName: string;
  symbol: string;
  totalTrades: number;
  totalProfitLoss: number;
  totalReturnPercent: number;
  winRatePercent: number;
  maxDrawdownPercent: number;
}

export default function BacktestModal({ strategyId, strategyName, onClose }: BacktestModalProps) {
  // --- Form State ---
  const [symbol, setSymbol] = useState('IBM'); // Default to IBM for testing
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [initialCash, setInitialCash] = useState('10000');

  // --- UI State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<BacktestReport | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication failed. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          strategyId: strategyId,
          symbol: symbol.toUpperCase(),
          startDate: startDate,
          endDate: endDate,
          initialCash: parseFloat(initialCash),
        }),
      });

      const data: BacktestReport = await res.json();

      if (!res.ok || data.strategyName === 'Error') {
        // Handle custom error from our backend
        throw new Error(data.symbol || 'Failed to run backtest.');
      }
      
      setReport(data); // Success!
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // --- Modal Overlay ---
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-white"
        >
          &times;
        </button>
        
        <h2 className="text-3xl font-bold mb-6 text-center">Run Backtest</h2>
        <h3 className="text-xl text-blue-300 mb-6 text-center">{strategyName}</h3>

        {/* --- Main Content: Form or Report --- */}
        {loading ? (
          <div className="text-center p-12">
            <p className="text-xl">Running backtest...</p>
            <p className="text-gray-400">This may take a moment.</p>
          </div>
        ) : report ? (
          // --- 2. Report View ---
          <ReportDisplay report={report} onReset={() => setReport(null)} />
        ) : (
          // --- 1. Form View ---
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              {/* Symbol */}
              <div>
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                <input
                  type="text" id="symbol" value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  required className="w-full px-3 py-2 bg-gray-700 rounded-md"
                />
              </div>
              {/* Initial Cash */}
              <div>
                <label htmlFor="initialCash" className="block text-sm font-medium text-gray-300 mb-2">Initial Cash ($)</label>
                <input
                  type="number" id="initialCash" value={initialCash}
                  onChange={(e) => setInitialCash(e.target.value)}
                  required className="w-full px-3 py-2 bg-gray-700 rounded-md"
                />
              </div>
              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <input
                  type="date" id="startDate" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required className="w-full px-3 py-2 bg-gray-700 rounded-md"
                />
              </div>
              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <input
                  type="date" id="endDate" value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required className="w-full px-3 py-2 bg-gray-700 rounded-md"
                />
              </div>
            </div>

            {error && <p className="text-center mt-4 text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full mt-6 py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md"
            >
              Run Test
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// --- Helper component to display the report ---
function ReportDisplay({ report, onReset }: { report: BacktestReport, onReset: () => void }) {
  const isProfit = report.totalProfitLoss >= 0;

  return (
    <div>
      <h4 className="text-2xl font-bold text-center mb-6">Backtest Report: {report.symbol}</h4>
      <div className="grid grid-cols-3 gap-4 text-center">
        <ReportMetric label="Total Return" value={`${report.totalReturnPercent.toFixed(2)}%`} isProfit={isProfit} />
        <ReportMetric label="Profit/Loss" value={`$${report.totalProfitLoss.toFixed(2)}`} isProfit={isProfit} />
        <ReportMetric label="Win Rate" value={`${report.winRatePercent.toFixed(2)}%`} />
        <ReportMetric label="Total Trades" value={report.totalTrades.toString()} />
        <ReportMetric label="Max Drawdown" value={`${report.maxDrawdownPercent.toFixed(2)}%`} isProfit={false} />
      </div>
      <button
        onClick={onReset}
        className="w-full mt-8 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md"
      >
        Run New Test
      </button>
    </div>
  );
}

function ReportMetric({ label, value, isProfit }: { label: string, value: string, isProfit?: boolean }) {
  let colorClass = 'text-white';
  if (isProfit === true) colorClass = 'text-green-500';
  if (isProfit === false) colorClass = 'text-red-500';

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}