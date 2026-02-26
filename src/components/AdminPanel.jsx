import { useState, lazy, Suspense } from 'react'
import { signOut } from '../hooks/useAuth'

// Lazy load heavy components
const ItemManager = lazy(() => import('./ItemManager'))
const ReservationManager = lazy(() => import('./ReservationManager'))

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center animate-fadeIn">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-aiesec-blue border-t-transparent"></div>
      <p className="text-gray-600 mt-4 font-medium">Loading...</p>
    </div>
  </div>
)

export default function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('items')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-aiesec-blue via-blue-600 to-aiesec-teal text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-extrabold mb-1 flex items-center gap-3 justify-center md:justify-start">
                <span className="text-5xl">🛠️</span>
                Admin Dashboard
              </h1>
              <p className="text-blue-100 text-sm">AIESEC LC Shop Management System</p>
            </div>
            <div className="flex items-center gap-4 bg-white bg-opacity-10 backdrop-blur-sm px-5 py-3 rounded-xl">
              <div className="text-right">
                <p className="text-xs text-blue-100">Signed in as</p>
                <p className="text-sm font-semibold">{user?.email}</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await signOut()
                  } catch (err) {
                    alert('Sign out failed: ' + (err.message || 'Unknown error'))
                  }
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-5 py-2.5 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 btn-ripple"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex gap-2">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-4 px-6 font-bold transition-all relative ${
              activeTab === 'items'
                ? 'text-aiesec-blue'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              Manage Items
            </span>
            {activeTab === 'items' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-aiesec-blue to-blue-600 rounded-t-lg"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`py-4 px-6 font-bold transition-all relative ${
              activeTab === 'reservations'
                ? 'text-aiesec-blue'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              Reservations
            </span>
            {activeTab === 'reservations' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-aiesec-blue to-blue-600 rounded-t-lg"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <div className="animate-fadeIn">
            {activeTab === 'items' && <ItemManager />}
            {activeTab === 'reservations' && <ReservationManager />}
          </div>
        </Suspense>
      </main>
    </div>
  )
}
