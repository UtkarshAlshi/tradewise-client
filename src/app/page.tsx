import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">Welcome to TradeWise</h1>
      <div className="flex gap-4">
        <Link href="/register" className="text-lg text-blue-400 hover:text-blue-300">
          Register
        </Link>
        <span className="text-gray-500">|</span>
        <Link href="/login" className="text-lg text-blue-400 hover:text-blue-300">
          Login
        </Link>
      </div>
    </main>
  );
}