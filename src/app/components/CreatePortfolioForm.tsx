'use client';

import { useState } from 'react';

// --- Define the types ---
interface Portfolio {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  userId: string;
}

// Define the type for the props this component will receive
interface CreatePortfolioFormProps {
  onPortfolioCreated: (newPortfolio: Portfolio) => void;
}

export default function CreatePortfolioForm({ onPortfolioCreated }: CreatePortfolioFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to create a portfolio.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        const newPortfolio = await res.json();
        // Call the function passed from the parent (dashboard)
        onPortfolioCreated(newPortfolio); 
        
        // Clear the form
        setName('');
        setDescription('');
      } else {
        const errorMessage = await res.text();
        setError(`Error: ${errorMessage}`);
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-md mt-12">
      <h3 className="text-2xl font-bold text-center mb-6">Create New Portfolio</h3>
      <form onSubmit={handleSubmit}>
        {/* Name Input */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Portfolio Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Description Input */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 disabled:bg-gray-500"
        >
          {loading ? 'Creating...' : 'Create Portfolio'}
        </button>

        {/* Error Message */}
        {error && (
          <p className="text-center mt-4 text-sm text-red-400">{error}</p>
        )}
      </form>
    </div>
  );
}