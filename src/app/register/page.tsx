// This tells Next.js to run this component on the client
'use client'; 

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  // 1. Create state variables for the form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // To show success/error messages

  // 2. Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // Stop the form from reloading the page
    event.preventDefault(); 
    setMessage(''); // Clear previous messages

    try {
      // 3. Make the API call to our backend
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // 4. Handle the response
      if (res.ok) {
        // We're using .text() because our backend sends a plain string
        const successMessage = await res.text();
        setMessage(`Success: ${successMessage}`);
        // Clear the form
        setEmail('');
        setPassword('');
      } else {
        // Handle errors
        const errorMessage = await res.text();
        setMessage(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('Error: Failed to connect to the server.');
    }
  };

  // 5. The JSX (HTML) for the form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200"
          >
            Register
          </button>
        </form>

        {/* 6. Display success/error messages */}
        {message && (
          <p className="text-center mt-4 text-sm text-gray-300">{message}</p>
        )}

        <p className="text-center mt-6 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}