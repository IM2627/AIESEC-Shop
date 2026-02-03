import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ReservationForm from './ReservationForm'

export default function PublicShop() {
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
    
    // Only subscribe if supabase is available
    if (!supabase) {
      console.error('Supabase not initialized')
      return
    }

    // Subscribe to real-time updates on items table
    const subscription = supabase
      .channel('items-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'items' }, 
        () => fetchItems()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchItems() {
    setLoading(true)
    
    if (!supabase) {
      console.error('Supabase not initialized')
      setItems([])
      setLoading(false)
      return
    }

    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timed out')), 10000)
      )

      const fetchPromise = supabase
        .from('items')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])
      
      if (error) {
        console.error('Error fetching items:', error)
        setItems([])
      } else {
        setItems(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-aiesec-blue via-blue-600 to-aiesec-teal text-white py-16 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -ml-32 -mb-32"></div>
        <div className="max-w-6xl mx-auto px-4 relative z-10 animate-slideDown">
          <h1 className="text-5xl font-extrabold mb-2 flex items-center gap-3">
            <span className="text-6xl">🎽</span>
            AIESEC LC Shop
          </h1>
          <p className="text-xl text-blue-100">✨ LC University - El Manar</p>
          <p className="text-sm text-blue-200 mt-2">Quality merchandise for our community</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-aiesec-blue border-t-transparent"></div>
            <p className="text-gray-600 mt-4">Loading merchandise...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-lg">No items available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item, index) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover transform transition-all duration-300 animate-scaleIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Item Image */}
                <div className="h-56 bg-gradient-to-br from-aiesec-blue to-aiesec-teal flex items-center justify-center relative overflow-hidden group">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <span className="text-white text-7xl transform group-hover:scale-110 transition-transform duration-300">📦</span>
                  )}
                  {item.stock === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">OUT OF STOCK</span>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="p-5">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{item.name}</h2>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{item.description || 'No description available'}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-extrabold bg-gradient-to-r from-aiesec-orange to-red-500 bg-clip-text text-transparent">
                        {item.price}
                      </span>
                      <span className="text-lg font-semibold text-gray-600">TND</span>
                    </div>
                    {item.stock > 0 ? (
                      <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                        ✓ {item.stock} left
                      </span>
                    ) : (
                      <span className="bg-gradient-to-r from-red-400 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                        ✗ Sold Out
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedItem(item)}
                    disabled={item.stock === 0}
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-300 btn-ripple ${
                      item.stock > 0
                        ? 'bg-gradient-to-r from-aiesec-blue to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {item.stock > 0 ? '🛒 Reserve Now' : '❌ Unavailable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white py-10 mt-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <p className="text-xl font-semibold text-gray-200 mb-2">© 2024 AIESEC LC University - El Manar</p>
          <p className="text-sm text-gray-400">Built with <span className="text-red-400 animate-pulse">❤️</span> by AIESEC Members</p>
          <p className="text-xs text-gray-500 mt-3">Empowering youth through leadership and exchange</p>
        </div>
      </footer>

      {/* Reservation Modal */}
      {selectedItem && (
        <ReservationForm
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => {
            setSelectedItem(null)
            fetchItems() // Refresh items after reservation
          }}
        />
      )}
    </div>
  )
}
