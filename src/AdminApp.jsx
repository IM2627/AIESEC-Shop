import { useAuth, signOut } from './hooks/useAuth'
import AdminPanel from './components/AdminPanel'
import AdminLogin from './components/AdminLogin'
import './index.css'

export default function AdminApp() {
  const { user, isAdmin, status, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aiesec-blue to-aiesec-teal">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
          <p className="text-white mt-4 text-lg">Loading Admin Portal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-700 mb-4">{error.message || 'Unable to verify your session.'}</p>
          <button
            onClick={async () => {
              try { await signOut() } catch (_) {}
              window.location.reload()
            }}
            className="bg-aiesec-blue text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <AdminLogin />
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md">
          <div className="text-7xl mb-4">🚫</div>
          <h2 className="text-3xl font-bold text-red-600 mb-3">Access Denied</h2>
          <p className="text-gray-600 text-lg mb-6">
            Your account (<span className="font-semibold">{user?.email}</span>) does not have admin permissions.
          </p>
          <button
            onClick={async () => {
              try { await signOut() } catch (err) { alert('Sign out failed: ' + err.message) }
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl transition-all"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    )
  }

  if (status === 'authorized' && user && isAdmin) {
    return <AdminPanel user={user} />
  }

  return <AdminLogin />
}
