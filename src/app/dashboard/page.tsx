'use client'; // This component runs on the client

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// --- Define Types for our data ---
interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface Portfolio {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  userId: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Get the token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      // 2. If no token, redirect to login
      router.push('/login');
      return;
    }

    // 3. If token exists, fetch data
    const fetchData = async () => {
      try {
        // --- Fetch User Data ---
        const userRes = await fetch('http://localhost:8080/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!userRes.ok) throw new Error('Failed to fetch user data');
        const userData = await userRes.json();
        setUser(userData);

        // --- Fetch Portfolios ---
        const portfoliosRes = await fetch('http://localhost:8080/api/portfolios', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!portfoliosRes.ok) throw new Error('Failed to fetch portfolios');
        const portfoliosData = await portfoliosRes.json();
        setPortfolios(portfoliosData);

      } catch (err: any) {
        setError(err.message);
        // If token is invalid, backend sends 401/403, we should log out
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // --- Handle Logout ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // --- Render UI ---
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold">Welcome, {user?.email}</h1>
        <button
          onClick={handleLogout}
          className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition duration-200"
        >
          Logout
        </button>
      </header>

      <main>
        <h2 className="text-2xl font-semibold mb-6">Your Portfolios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.length > 0 ? (
            portfolios.map((portfolio) => (
              <div key={portfolio.id} className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2">{portfolio.name}</h3>
                <p className="text-gray-400">{portfolio.description}</p>
              </div>
            ))
          ) : (
            <p>You have no portfolios yet.</p>
          )}

          {/* We'll add a "Create New Portfolio" button here later */}
        </div>
      </main>
    </div>
  );
}