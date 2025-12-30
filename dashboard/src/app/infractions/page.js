'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getDiscordAvatar } from '@/lib/discord'
import Image from 'next/image'
import Link from 'next/link'

const typeColors = {
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  mute: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  kick: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ban: 'bg-red-500/20 text-red-400 border-red-500/30'
}

export default function InfractionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
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
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5865f2] mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 animate-fade-in">
        <div className="px-4 sm:px-0">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-3">Infractions</h1>
            <p className="text-gray-400 text-lg">View and manage all moderation actions</p>
          </div>

          <div className="glass-card rounded-2xl border border-[#1f1f1f] mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                  className="w-full bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-[#5865f2] focus:border-[#5865f2] transition-all"
                >
                  <option value="">All Types</option>
                  <option value="warning">Warning</option>
                  <option value="mute">Mute</option>
                  <option value="kick">Kick</option>
                  <option value="ban">Ban</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">User ID</label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value, page: 1 })}
                  placeholder="Enter user ID"
                  className="w-full bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#5865f2] focus:border-[#5865f2] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-[#1f1f1f] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#1f1f1f]">
                <thead className="bg-[#111111]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-[#111111] divide-y divide-[#1f1f1f]">
                  {infractions.length > 0 ? (
                    infractions.map((infraction) => {
                      const avatarUrl = getDiscordAvatar(infraction.userId)
                      const staffAvatarUrl = getDiscordAvatar(infraction.staffId)
                      return (
                        <tr key={infraction._id} className="hover:bg-[#1a1a1a] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/users/${infraction.userId}`} className="flex items-center gap-3 group">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#1f1f1f] group-hover:ring-[#5865f2] transition-all">
                                <Image
                                  src={avatarUrl}
                                  alt={infraction.userId}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <span className="text-sm font-medium text-white group-hover:text-[#5865f2] transition-colors">
                                {infraction.userId}
                              </span>
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-full border ${typeColors[infraction.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                              {infraction.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">{infraction.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#1f1f1f]">
                                <Image
                                  src={staffAvatarUrl}
                                  alt={infraction.staffId}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <span className="text-sm text-gray-400">{infraction.staffId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-sm font-semibold text-gray-200 bg-[#1a1a1a] rounded-lg border border-[#1f1f1f]">
                              {infraction.points}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(infraction.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDelete(infraction._id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-4 text-sm text-gray-500">No infractions found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-4 py-2 bg-[#111111] border border-[#1f1f1f] rounded-lg text-white hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-300">
                Page {filters.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.pages}
                className="px-4 py-2 bg-[#111111] border border-[#1f1f1f] rounded-lg text-white hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
