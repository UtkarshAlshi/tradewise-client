'use client';

import { useState } from 'react';

// Define the component's props
interface AddAssetFormProps {
  portfolioId: string;
  onAssetAdded: () => void; // A function to call to refresh the parent
}

export default function AddAssetForm({ portfolioId, onAssetAdded }: AddAssetFormProps) {
  // Form state
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/portfolios/${portfolioId}/assets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            symbol: symbol,
            quantity: parseFloat(quantity),
            purchasePrice: parseFloat(purchasePrice),
            purchaseDate: `${purchaseDate}:00`, // Add seconds for LocalDateTime
          }),
        }
      );

      if (res.ok) {
        // Success!
        onAssetAdded(); // Call the parent's refresh function
        // Clear the form
        setSymbol('');
        setQuantity('');
        setPurchasePrice('');
        setPurchaseDate('');
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
    <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-md h-fit">
      <h3 className="text-2xl font-bold text-center mb-6">Add New Asset</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-2">
            Symbol (e.g., AAPL, IBM)
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            required
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            step="0.000001"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-300 mb-2">
            Purchase Price (per unit)
          </label>
          <input
            type="number"
            id="purchasePrice"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            required
            step="0.01"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-300 mb-2">
            Purchase Date & Time
          </label>
          <input
            type="datetime-local"
            id="purchaseDate"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 disabled:bg-gray-500"
        >
          {loading ? 'Adding...' : 'Add Asset'}
        </button>

        {error && (
          <p className="text-center mt-4 text-sm text-red-400">{error}</p>
        )}
      </form>
    </div>
  );
}