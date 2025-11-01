'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Define our data types (we'll reuse some) ---
interface AssetAnalytics {
  assetId: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  totalCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface PortfolioAnalytics {
  portfolioId: string;
  portfolioName: string;
  totalValue: number;
  totalPurchaseCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  assets: AssetAnalytics[];
}

export default function PortfolioDetailPage() {
  const router = useRouter();
  const params = useParams(); // Gets the [id] from the URL
  const portfolioId = params.id as string; // e.g., "123e4567-..."

  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!portfolioId) return; // Don't fetch if ID isn't ready

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/portfolios/${portfolioId}/analytics`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch portfolio analytics');
        }

        const data: PortfolioAnalytics = await res.json();
        setAnalytics(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [portfolioId, router]); // Re-run if portfolioId changes

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading portfolio...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center text-red-500">Error: {error}</div>;
  }

  if (!analytics) {
    return <div className="flex min-h-screen items-center justify-center">Portfolio not found.</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
          &larr; Back to Dashboard
        </Link>
      </nav>

      {/* --- 1. Header & Analytics Summary --- */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{analytics.portfolioName}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Total Value</div>
            <div className="text-2xl font-bold">${analytics.totalValue.toFixed(2)}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Total Cost</div>
            <div className="text-2xl font-bold">${analytics.totalPurchaseCost.toFixed(2)}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Gain / Loss</div>
            <div className={`text-2xl font-bold ${analytics.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${analytics.totalGainLoss.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Return %</div>
            <div className={`text-2xl font-bold ${analytics.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {analytics.totalGainLossPercent.toFixed(2)}%
            </div>
          </div>
        </div>
      </header>

      {/* --- 2. Assets List --- */}
      <main>
        <h2 className="text-2xl font-semibold mb-6">Assets</h2>
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4">Symbol</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Avg. Cost</th>
                <th className="p-4">Current Price</th>
                <th className="p-4">Market Value</th>
                <th className="p-4">Gain / Loss</th>
              </tr>
            </thead>
            <tbody>
              {analytics.assets.length > 0 ? (
                analytics.assets.map((asset) => (
                  <tr key={asset.assetId} className="border-b border-gray-700">
                    <td className="p-4 font-bold">{asset.symbol}</td>
                    <td className="p-4">{asset.quantity}</td>
                    <td className="p-4">${asset.purchasePrice.toFixed(2)}</td>
                    <td className="p-4">${asset.currentPrice.toFixed(2)}</td>
                    <td className="p-4">${asset.marketValue.toFixed(2)}</td>
                    <td className={`p-4 ${asset.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {asset.gainLoss.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-400">
                    No assets in this portfolio yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* We will add the "Add Asset" form here */}
      </main>
    </div>
  );
}