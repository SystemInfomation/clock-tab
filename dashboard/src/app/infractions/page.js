'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useWebSocket } from '@/components/WebSocketProvider'

const typeColors = {
  warning: 'bg-yellow-100 text-yellow-800',
  mute: 'bg-blue-100 text-blue-800',
  kick: 'bg-orange-100 text-orange-800',
  ban: 'bg-red-100 text-red-800'
}

export default function InfractionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { socket } = useWebSocket()
  const [infractions, setInfractions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    userId: '',
    page: 1
  })
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    fetchInfractions()
  }, [session, filters])

  useEffect(() => {
    if (socket) {
      socket.on('infraction_created', (infraction) => {
        setInfractions(prev => [infraction, ...prev])
      })

      socket.on('infraction_deleted', ({ id }) => {
        setInfractions(prev => prev.filter(inf => inf._id !== id))
      })

      return () => {
        socket.off('infraction_created')
        socket.off('infraction_deleted')
      }
    }
  }, [socket])

  async function fetchInfractions() {
    if (!session) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.userId) params.append('userId', filters.userId)
      params.append('page', filters.page)
      params.append('limit', '50')

      const res = await fetch(`/api/infractions?${params}`)
      const data = await res.json()
      setInfractions(data.infractions || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching infractions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this infraction?')) return

    try {
      const res = await fetch(`/api/infractions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setInfractions(prev => prev.filter(inf => inf._id !== id))
      }
    } catch (error) {
      console.error('Error deleting infraction:', error)
      alert('Failed to delete infraction')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Infractions</h1>

          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Types</option>
                  <option value="warning">Warning</option>
                  <option value="mute">Mute</option>
                  <option value="kick">Kick</option>
                  <option value="ban">Ban</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value, page: 1 })}
                  placeholder="Enter user ID"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {infractions.length > 0 ? (
                  infractions.map((infraction) => (
                    <tr key={infraction._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColors[infraction.type] || 'bg-gray-100 text-gray-800'}`}>
                          {infraction.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <a href={`/users/${infraction.userId}`} className="text-indigo-600 hover:text-indigo-900">
                          {infraction.userId}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{infraction.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{infraction.staffId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{infraction.points}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(infraction.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(infraction._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No infractions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="mt-4 flex justify-center space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {filters.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.pages}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

