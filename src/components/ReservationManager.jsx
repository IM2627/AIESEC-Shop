import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ReservationManager() {
  const [reservations, setReservations] = useState([])
  const [filter, setFilter] = useState('all') // all, pending, collected, cancelled
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReservations()
  }, [filter])

  async function fetchReservations() {
    setLoading(true)
    let query = supabase
      .from('reservations')
      .select(`
        *,
        items (
          name,
          price
        )
      `)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    setReservations(data || [])
    setLoading(false)
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      await fetchReservations()
    } else {
      alert('Error updating status: ' + error.message)
    }
  }

  async function deleteReservation(id) {
    if (confirm('Are you sure you want to delete this reservation?')) {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id)

      if (!error) {
        await fetchReservations()
      } else {
        alert('Error deleting reservation: ' + error.message)
      }
    }
  }

  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    collected: reservations.filter(r => r.status === 'collected').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-semibold">Total Reservations</p>
          <p className="text-3xl font-bold text-blue-800">{stats.total}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-sm text-yellow-600 font-semibold">Pending</p>
          <p className="text-3xl font-bold text-yellow-800">{stats.pending}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-semibold">Collected</p>
          <p className="text-3xl font-bold text-green-800">{stats.collected}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <p className="text-sm text-red-600 font-semibold">Cancelled</p>
          <p className="text-3xl font-bold text-red-800">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'collected', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded font-semibold transition ${
                filter === status
                  ? 'bg-aiesec-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-xl font-bold p-6 border-b bg-gray-50">
          Reservations {filter !== 'all' && `- ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
        </h3>
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-aiesec-blue border-t-transparent"></div>
            <p className="text-gray-600 mt-2">Loading reservations...</p>
          </div>
        ) : reservations.length === 0 ? (
          <p className="p-6 text-gray-600 text-center">
            No {filter !== 'all' ? filter : ''} reservations found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Position/Dept</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium">{reservation.full_name}</p>
                        <p className="text-sm text-gray-600">{reservation.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium">{reservation.items?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">
                        {reservation.items?.price} TND each
                      </p>
                    </td>
                    <td className="px-6 py-3 font-semibold">{reservation.quantity}</td>
                    <td className="px-6 py-3 text-sm">{reservation.team || 'General'}</td>
                    <td className="px-6 py-3">
                      <select
                        value={reservation.status}
                        onChange={(e) => updateStatus(reservation.id, e.target.value)}
                        className={`px-2 py-1 rounded text-sm font-semibold border-0 cursor-pointer ${
                          reservation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : reservation.status === 'collected'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="collected">Collected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(reservation.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => deleteReservation(reservation.id)}
                        className="text-red-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
