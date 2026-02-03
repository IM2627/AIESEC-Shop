import { useAuth } from './hooks/useAuth'
import AdminPanel from './components/AdminPanel'
import AdminLogin from './components/AdminLogin'
import './index.css'

export default function AdminApp() {
  const { user, isAdmin, loading } = useAuth()

  // Show loading state
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

  // Show admin panel if user is logged in and is an admin
  if (user && isAdmin) {
    return <AdminPanel />
  }

  // Show admin login by default
  return <AdminLogin />
}
