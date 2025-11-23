'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// --- Define Types ---
interface LeaderboardEntry {
  rank: number;
  portfolioName: string;
  userEmail: string;
  totalGainLossPercent: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/leaderboard');
        if (!res.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const data = await res.json();
        setEntries(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []); // Runs once on page load

  return (
    <div className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
          &larr; Back to Dashboard
        </Link>
      </nav>

      <header className="mb-12">
        <h1 className="text-4xl font-bold">Top Performing Portfolios</h1>
      </header>

      <main className="max-w-4xl mx-auto">
        {loading && <p>Loading leaderboard...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && !error && (
          <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Portfolio</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Return %</th>
                </tr>
              </thead>
              <tbody>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <tr key={entry.rank} className="border-b border-gray-700">
                      <td className="p-4 font-bold text-2xl">{entry.rank}</td>
                      <td className="p-4">{entry.portfolioName}</td>
                      <td className="p-4 text-gray-400">{entry.userEmail}</td>
                      <td className="p-4 font-bold text-green-500">
                        {entry.totalGainLossPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-400">
                      No ranked portfolios yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}