'use client'; 

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreatePortfolioForm from '../components/CreatePortfolioForm';
import Link from 'next/link'; // Import Link

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
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  
    const fetchData = async () => {
      try {
        // --- Fetch User Data (with headers) ---
        const userRes = await fetch('http://localhost:8000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        if (!userRes.ok) throw new Error('Failed to fetch user data');
        const userData = await userRes.json();
        setUser(userData);
  
        // --- Fetch Portfolios (with headers) ---
        const portfoliosRes = await fetch('http://localhost:8000/api/portfolios', {
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

  // --- CREATE HANDLER FUNCTION ---
  const handlePortfolioCreated = (newPortfolio: Portfolio) => {
    setPortfolios((currentPortfolios) => [...currentPortfolios, newPortfolio]);
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
      {/* --- THIS IS THE MODIFIED HEADER --- */}
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-6"> {/* Added more gap */}
          <h1 className="text-4xl font-bold">Welcome, {user?.email}</h1>
          <Link href="/leaderboard" className="text-lg text-blue-400 hover:text-blue-300">
            Leaderboard
          </Link>
          {/* --- ADD THIS LINK --- */}
          <Link href="/strategies" className="text-lg text-blue-400 hover:text-blue-300">
            My Strategies
          </Link>
          {/* --- END OF ADDITION --- */}
        </div>
        <button
          onClick={handleLogout}
          className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition duration-200"
        >
          Logout
        </button>
      </header>
      {/* --- END OF MODIFIED HEADER --- */}

      <main className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* --- Left Side: Portfolio List --- */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Your Portfolios</h2>
          <div className="grid grid-cols-1 gap-6">
            {portfolios.length > 0 ? (
              portfolios.map((portfolio) => (
                
                <Link 
                  href={`/dashboard/portfolio/${portfolio.id}`} 
                  key={portfolio.id}
                  className="block bg-gray-800 p-6 rounded-lg shadow-md hover:bg-gray-700 transition-colors"
                >
                  <h3 className="text-xl font-bold mb-2">{portfolio.name}</h3>
                  <p className="text-gray-400">{portfolio.description}</p>
                </Link>

              ))
            ) : (
              <p>You have no portfolios yet. Create one!</p>
            )}
          </div>
        </div>

        {/* --- Right Side: Render the new form --- */}
        <div className="flex justify-center">
          <CreatePortfolioForm onPortfolioCreated={handlePortfolioCreated} />
        </div>
      </main>
    </div>
  );
}