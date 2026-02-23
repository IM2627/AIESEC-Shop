import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ReservationForm({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    team: '',
    quantity: 1
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (!supabase) {
      setError('Database not configured. Please contact support.')
      setLoading(false)
      return
    }

    const qty = parseInt(formData.quantity, 10)

    if (isNaN(qty) || qty < 1) {
      setError('Quantity must be at least 1.')
      setLoading(false)
      return
    }

    if (qty > item.stock) {
      setError(`Only ${item.stock} item${item.stock === 1 ? '' : 's'} available.`)
      setLoading(false)
      return
    }

    try {
      // Use a single atomic RPC call to prevent race conditions where two
      // users could simultaneously reserve the last item.
      const { error } = await supabase.rpc('create_reservation', {
        p_item_id: item.id,
        p_full_name: formData.full_name.trim(),
        p_email: formData.email.trim().toLowerCase(),
        p_team: formData.team.trim() || 'General',
        p_quantity: qty,
      })

      if (error) throw error

      setMessage('✓ Reservation confirmed! You will be contacted when your item is ready for collection.')

      setTimeout(() => {
        onSuccess()
      }, 2500)
    } catch (err) {
      if (err.message?.includes('Insufficient stock')) {
        setError('Sorry, this item is no longer available in the requested quantity. Please refresh and try again.')
      } else {
        setError(err.message || 'Failed to create reservation. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-slideUp">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-aiesec-blue to-aiesec-teal p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <span>🎽</span> Reserve Item
              </h2>
              <p className="text-blue-100 text-sm">{item.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-all"
              disabled={loading}
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Item Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl mb-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-xs text-gray-600">Price per unit</p>
                  <p className="text-xl font-bold text-aiesec-blue">{item.price} TND</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <div className="text-right">
                  <p className="text-xs text-gray-600">In stock</p>
                  <p className="text-xl font-bold text-green-600">{item.stock}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <span className="text-lg">👤</span>
                Full Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-aiesec-blue focus:ring-4 focus:ring-blue-50 transition-all"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <span className="text-lg">📧</span>
                Email Address *
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-aiesec-blue focus:ring-4 focus:ring-blue-50 transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.tn"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1.5 ml-1">We'll use this to follow up on your reservation</p>
            </div>

            {/* Position/Department */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <span className="text-lg">💼</span>
                Position/Department
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-aiesec-blue focus:ring-4 focus:ring-blue-50 transition-all"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                placeholder="e.g., Marketing Manager, Finance Dept"
                disabled={loading}
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <span className="text-lg">🔢</span>
                Quantity * <span className="text-xs font-normal text-gray-500">(Available: {item.stock})</span>
              </label>
              <input
                type="number"
                min="1"
                max={item.stock}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-aiesec-blue focus:ring-4 focus:ring-blue-50 transition-all"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                disabled={loading}
              />
              {parseInt(formData.quantity, 10) > 0 && (
                <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-700">
                    💳 Total: <span className="text-lg">{(item.price * parseInt(formData.quantity, 10)).toFixed(2)} TND</span>
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-shake">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                <span className="text-lg">✓</span>
                <span>{message}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-aiesec-blue to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 btn-ripple"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Processing...
                  </span>
                ) : (
                  '✓ Confirm'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
