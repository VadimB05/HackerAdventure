'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Server-Fehler</h2>
        <p className="text-gray-400 mb-8">
          Es ist ein unerwarteter Fehler aufgetreten.
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Erneut versuchen
          </button>
          <a 
            href="/" 
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  )
} 