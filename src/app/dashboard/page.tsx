'use client'; 

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreatePortfolioForm from '../components/CreatePortfolioForm'; // <-- 1. IMPORT

// --- Define Types for our data ---
// ... (User interface remains the same)
interface User {  // <-- ADD THIS BLOCK BACK IN
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
      const userRes = await fetch('http://localhost:8080/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userRes.ok) throw new Error('Failed to fetch user data');
      const userData = await userRes.json();
      setUser(userData);

      // --- Fetch Portfolios (with headers) ---
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

  // ... (handleLogout remains the same)
  const handleLogout = () => { /* ... */ };

  // --- 2. CREATE HANDLER FUNCTION ---
  // This function will be called by the CreatePortfolioForm component
  const handlePortfolioCreated = (newPortfolio: Portfolio) => {
    // Add the new portfolio to our existing list to update the UI
    setPortfolios((currentPortfolios) => [...currentPortfolios, newPortfolio]);
  };

  // --- Render UI ---
  // ... (loading and error states are the same)
  if (loading) { /* ... */ }
  if (error) { /* ... */ }

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-12">
        {/* ... (header content is the same) */}
        <h1 className="text-4xl font-bold">Welcome, {user?.email}</h1>
        <button onClick={handleLogout} /* ... */ >
          Logout
        </button>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* --- Left Side: Portfolio List --- */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Your Portfolios</h2>
          <div className="grid grid-cols-1 gap-6">
            {portfolios.length > 0 ? (
              portfolios.map((portfolio) => (
                <div key={portfolio.id} className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-2">{portfolio.name}</h3>
                  <p className="text-gray-400">{portfolio.description}</p>
                </div>
              ))
            ) : (
              <p>You have no portfolios yet. Create one!</p>
            )}
          </div>
        </div>

        {/* --- 3. Right Side: Render the new form --- */}
        <div className="flex justify-center">
          <CreatePortfolioForm onPortfolioCreated={handlePortfolioCreated} />
        </div>
      </main>
    </div>
  );
}