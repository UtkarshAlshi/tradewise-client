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
      // 3. Build API URL from env with fallback
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const url = `${apiBase.replace(/\/$/, '')}/api/auth/register`;

      // 4. Use AbortController to avoid hanging requests
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s

      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      // 5. Handle the response more defensively
      const contentType = res.headers.get('content-type') || '';
      let payload: string = '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        // Try to pick a meaningful message from JSON
        payload = json?.message ?? JSON.stringify(json);
      } else {
        payload = await res.text();
      }

      if (res.ok) {
        setMessage(`Success: ${payload}`);
        setEmail('');
        setPassword('');
      } else {
        setMessage(`Error: ${payload || res.statusText}`);
      }
    } catch (error) {
      // Distinguish abort vs network errors
      // DOMException name check covers AbortError in browsers
      // TypeScript's DOMException may not be available in Node, but in browser this is fine
      if ((error as any)?.name === 'AbortError') {
        console.error('Registration request aborted (timeout)');
        setMessage('Error: Request timed out. Please try again.');
      } else {
        console.error('Registration error:', error);
        setMessage('Error: Failed to connect to the server. Check that the backend is running and CORS is configured.');
      }
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