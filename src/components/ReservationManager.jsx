import { useEffect, useMemo, useState } from 'react'
import { formatCurrency, formatDateLabel } from '../lib/formatters'
import { normalizeReservationRecord } from '../lib/reservationRecord'
import { supabase } from '../lib/supabase'

export default function ReservationManager() {
  const [reservations, setReservations] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReservations()
  }, [filter])

  async function fetchReservations() {
    setLoading(true)

    try {
      let query = supabase
        .from('reservations')
        .select(
          `
            *,
            items (
              name,
              price
            )
          `,
        )
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setReservations((data || []).map(normalizeReservationRecord))
    } catch (error) {
      alert(`Error loading reservations: ${error.message}`)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase.from('reservations').update({ status: newStatus }).eq('id', id)

    if (error) {
      alert(`Error updating status: ${error.message}`)
      return
    }

    await fetchReservations()
  }

  async function deleteReservation(id) {
    if (!confirm('Are you sure you want to delete this reservation?')) {
      return
    }

    const { error } = await supabase.from('reservations').delete().eq('id', id)

    if (error) {
      alert(`Error deleting reservation: ${error.message}`)
      return
    }

    await fetchReservations()
  }

  const stats = useMemo(
    () => ({
      total: reservations.length,
      pending: reservations.filter((reservation) => reservation.status === 'pending').length,
      collected: reservations.filter((reservation) => reservation.status === 'collected').length,
      cancelled: reservations.filter((reservation) => reservation.status === 'cancelled').length,
    }),
    [reservations],
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-600">Total Reservations</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-yellow-700">Pending</p>
          <p className="mt-2 text-3xl font-bold text-yellow-900">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-700">Collected</p>
          <p className="mt-2 text-3xl font-bold text-green-900">{stats.collected}</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">Cancelled</p>
          <p className="mt-2 text-3xl font-bold text-red-900">{stats.cancelled}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'collected', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === status ? 'bg-aiesec-blue text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <h3 className="border-b bg-gray-50 p-6 text-xl font-bold">
          Reservations {filter !== 'all' ? `- ${filter.charAt(0).toUpperCase() + filter.slice(1)}` : ''}
        </h3>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-aiesec-blue border-t-transparent" />
            <p className="mt-2 text-gray-600">Loading reservations...</p>
          </div>
        ) : reservations.length === 0 ? (
          <p className="p-6 text-center text-gray-600">No reservations found for this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Size</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Position</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Max Delivery</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b align-top hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{reservation.full_name}</p>
                        <p className="mt-1 text-sm text-gray-500">{reservation.phone_number || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{reservation.items?.name || 'N/A'}</p>
                      <p className="mt-1 text-sm text-gray-500">{formatCurrency(reservation.items?.price || 0)} each</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{reservation.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{reservation.size || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{reservation.position || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{reservation.phone_number || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatDateLabel(reservation.maximum_delivery_date)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={reservation.status}
                        onChange={(event) => updateStatus(reservation.id, event.target.value)}
                        className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold ${
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(reservation.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => deleteReservation(reservation.id)} className="font-medium text-red-600 hover:underline">
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
