import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔐 Attempting login for:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      console.log('📊 Supabase response:', { data, error })

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      if (data?.session) {
        console.log('✅ Login successful! User:', data.user.email)
        // AuthApp.jsx will automatically detect the session change
        // and render AdminPanel instead of AdminLogin
      } else {
        throw new Error('No session returned from Supabase')
      }
    } catch (err) {
      console.error('❌ Login failed:', err)
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-aiesec-blue to-aiesec-teal flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-white opacity-5 rounded-full -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-64 h-64 bg-white opacity-5 rounded-full top-1/2 -right-32"></div>
        <div className="absolute w-80 h-80 bg-white opacity-5 rounded-full -bottom-40 left-1/3"></div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-md relative z-10 animate-slideUp">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-aiesec-blue to-blue-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <div className="text-6xl mb-3 animate-scaleIn">🔐</div>
            <h1 className="text-3xl font-extrabold mb-2">Admin Portal</h1>
            <p className="text-blue-100 text-sm">AIESEC LC Shop Dashboard</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <span className="text-lg">📧</span>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@aiesec-elmanar.tn"
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-aiesec-blue focus:ring-4 focus:ring-blue-50 transition-all disabled:bg-gray-50"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <span className="text-lg">🔑</span>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-aiesec-blue focus:ring-4 focus:ring-blue-50 transition-all disabled:bg-gray-50"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-shake">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-aiesec-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 btn-ripple"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></span>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🚀</span> Sign In to Dashboard
              </span>
            )}
          </button>

          {/* Security badge */}
          <div className="text-center pt-4">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <span>🔒</span> Secure authentication via Supabase
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
