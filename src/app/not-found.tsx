import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4">404 - Page Not Found</h2>
        <p className="text-lg mb-8 text-gray-400">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
} 