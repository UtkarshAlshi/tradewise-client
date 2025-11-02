'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Define Types ---
interface Strategy {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  userId: string;
}

export default function StrategiesPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/strategies', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch strategies');
        }

        const data: Strategy[] = await res.json();
        setStrategies(data);
      } catch (err: any) {
        setError(err.message);
        // Check for auth errors specifically
        if (err.message.includes('401') || err.message.includes('403')) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  return (
    <div className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
          &larr; Back to Dashboard
        </Link>
      </nav>

      {/* --- THIS IS THE MODIFIED HEADER --- */}
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold">My Strategies</h1>
        <Link
          href="/strategies/new"
          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200"
        >
          Create New Strategy
        </Link>
      </header>
      {/* --- END OF MODIFICATION --- */}

      <main>
        {loading && <p>Loading strategies...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.length > 0 ? (
              strategies.map((strategy) => (
                <div key={strategy.id} className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-2">{strategy.name}</h3>
                  <p className="text-gray-400">{strategy.description}</p>
                  {/* We will add "Run Backtest" buttons here later */}
                </div>
              ))
            ) : (
              <p>You have not created any strategies yet.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
