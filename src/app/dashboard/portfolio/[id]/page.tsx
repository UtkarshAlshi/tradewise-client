'use client';

import { useEffect, useState, useCallback, useRef } from 'react'; // <-- Import useRef
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AddAssetForm from '@/app/components/AddAssetForm';
import { useWebSocket } from '@/app/context/WebSocketContext'; // <-- 1. IMPORT
import { StompSubscription } from '@stomp/stompjs'; // <-- Import

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

  const { subscribe, isConnected } = useWebSocket(); // <-- 2. CALL HOOK
  // Ref to hold our active subscriptions
  const subscriptionsRef = useRef<StompSubscription[]>([]);

  // Wrap fetch logic in useCallback
  const fetchAnalytics = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/portfolios/${portfolioId}/analytics`,
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
      setError(''); // Clear previous errors on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [portfolioId, router]); // Dependencies for the callback

  // Update useEffect
  useEffect(() => {
    if (portfolioId) {
      setLoading(true); // Set loading true when we fetch
      fetchAnalytics();
    }
  }, [portfolioId, fetchAnalytics]); // Run when ID or fetch function changes

  // --- 3. ADD NEW useEffect FOR WEBSOCKETS ---
  useEffect(() => {
    // Don't subscribe until we have data AND the websocket is ready
    if (!analytics || !isConnected) {
      return;
    }

    // Unsubscribe from any old topics first
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    subscriptionsRef.current = [];

    // 4. Subscribe to a topic for each asset
    analytics.assets.forEach((asset) => {
      const topic = `/topic/prices/${asset.symbol}`;
      const subscription = subscribe(topic, (priceUpdate: { symbol: string, price: number }) => {
        
        // 5. Update state when a new price arrives
        setAnalytics((currentAnalytics) => {
          if (!currentAnalytics) return null;
          
          let newTotalValue = 0;
          
          // Create a new assets array with the updated price
          const newAssets = currentAnalytics.assets.map(a => {
            if (a.symbol === priceUpdate.symbol) {
              // Ensure price is treated as a number
              const newPrice = Number(priceUpdate.price);
              const newMarketValue = a.quantity * newPrice;
              const newGainLoss = newMarketValue - a.totalCost;
              const newGainLossPercent = a.totalCost === 0 ? 0 : (newGainLoss / a.totalCost) * 100;
              
              newTotalValue += newMarketValue;
              
              return {
                ...a,
                currentPrice: newPrice,
                marketValue: newMarketValue,
                gainLoss: newGainLoss,
                gainLossPercent: newGainLossPercent,
              };
            }
            newTotalValue += a.marketValue;
            return a;
          });
          
          // Calculate new portfolio totals
          const newTotalGainLoss = newTotalValue - currentAnalytics.totalPurchaseCost;
          const newTotalGainLossPercent = currentAnalytics.totalPurchaseCost === 0 ? 0 : (newTotalGainLoss / currentAnalytics.totalPurchaseCost) * 100;

          return {
            ...currentAnalytics,
            totalValue: newTotalValue,
            totalGainLoss: newTotalGainLoss,
            totalGainLossPercent: newTotalGainLossPercent,
            assets: newAssets,
          };
        });
      });

      if (subscription) {
        subscriptionsRef.current.push(subscription);
      }
    });

    // Cleanup function when component unmounts or data changes
    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    };
  }, [analytics, isConnected, subscribe]); // Re-run when these change
  
  // Create the handler function
  const handleAssetAdded = () => {
    setLoading(true); // Show loading feedback
    fetchAnalytics(); // Refetch all data; the useEffect above will handle new subscriptions
  };

  // Update loading logic
  if (loading && !analytics) { // Only show full-page loading on first load
    return <div className="flex min-h-screen items-center justify-center">Loading portfolio...</div>;
  }

  if (error && !analytics) { // Only show full-page error if data never loaded
    return <div className="flex min-h-screen items-center justify-center text-red-500">Error: {error}</div>;
  }

  if (!analytics) {
    return <div className="flex min-h-screen items-center justify-center">Portfolio not found.</div>;
  }

  return (
    <div className="min-h-screen p-8">
      {/* --- 6. Add a connection status indicator --- */}
      <nav className="mb-6 flex justify-between items-center">
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
          &larr; Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
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

      {/* --- Main Layout --- */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* --- Asset List (Left/Main) --- */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-6">Assets</h2>
          {loading && <p className="text-sm text-gray-400 mb-2">Refreshing data...</p>} {/* Show refresh indicator */}
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
        </div>
        
        {/* --- Add Asset Form (Right/Sidebar) --- */}
        <div className="lg:col-span-1">
          <AddAssetForm 
            portfolioId={portfolioId} 
            onAssetAdded={handleAssetAdded} 
          />
        </div>
      </main>
    </div>
  );
}