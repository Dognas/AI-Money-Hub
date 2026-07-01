import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950">
      <div className="text-center">
        <div className="text-6xl mb-4">💸</div>
        <h1 className="text-4xl font-black gradient-text mb-2">404</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Page not found</p>
        <Link href="/" className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-2xl btn-gradient">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
