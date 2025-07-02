export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Seite nicht gefunden</h2>
        <p className="text-gray-400 mb-8">
          Die angeforderte Seite existiert nicht.
        </p>
        <a 
          href="/" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Zurück zur Startseite
        </a>
      </div>
    </div>
  )
} 