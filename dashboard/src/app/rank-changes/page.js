'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import Link from 'next/link'

export default function RankChangesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rankChanges, setRankChanges] = useState([])
  const [userInfo, setUserInfo] = useState({}) // Map of userId -> user info
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    userId: '',
    rank: '',
    page: 1
  })
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    fetchRankChanges()
  }, [session, filters])

  useEffect(() => {
    // Fetch user info for all unique user IDs
    if (rankChanges.length > 0) {
      fetchUserInfo()
    }
  }, [rankChanges])

  async function fetchRankChanges() {
    if (!session) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.rank) params.append('rank', filters.rank)
      params.append('page', filters.page)
      params.append('limit', '50')

      const res = await fetch(`/api/rank-changes?${params}`)
      const data = await res.json()
      setRankChanges(data.rankChanges || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching rank changes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserInfo() {
    // Get all unique user IDs (users and staff)
    const userIds = new Set()
    rankChanges.forEach(change => {
      if (change.userId) userIds.add(change.userId)
      if (change.staffId) userIds.add(change.staffId)
    })

    // Fetch user info for all users in parallel
    const userInfoPromises = Array.from(userIds).map(async (userId) => {
      try {
        const res = await fetch(`/api/discord/user/${userId}`)
        if (res.ok) {
          const data = await res.json()
          return { userId, data }
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error)
      }
      return { userId, data: null }
    })

    const results = await Promise.all(userInfoPromises)
    const userInfoMap = {}
    results.forEach(({ userId, data }) => {
      if (data) {
        userInfoMap[userId] = data
      }
    })

    setUserInfo(userInfoMap)
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
            <h1 className="text-5xl font-bold text-white mb-3">Rank Changes</h1>
            <p className="text-gray-400 text-lg">Track all promotions, demotions, and terminations</p>
          </div>

          <div className="glass-card rounded-2xl border border-[#1f1f1f] mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rank</label>
                <input
                  type="text"
                  value={filters.rank}
                  onChange={(e) => setFilters({ ...filters, rank: e.target.value, page: 1 })}
                  placeholder="Enter rank"
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Previous Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">New Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-[#111111] divide-y divide-[#1f1f1f]">
                  {rankChanges.length > 0 ? (
                    rankChanges.map((change) => {
                      const userData = userInfo[change.userId] || {
                        displayName: change.userId,
                        avatarURL: `https://cdn.discordapp.com/embed/avatars/${parseInt(change.userId) >> 22 % 6}.png`
                      }
                      const staffData = userInfo[change.staffId] || {
                        displayName: change.staffId,
                        avatarURL: `https://cdn.discordapp.com/embed/avatars/${parseInt(change.staffId) >> 22 % 6}.png`
                      }

                      return (
                        <tr key={change._id} className="hover:bg-[#1a1a1a] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/users/${change.userId}`} className="flex items-center gap-3 group">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#1f1f1f] group-hover:ring-[#5865f2] transition-all">
                                <Image
                                  src={userData.avatarURL}
                                  alt={userData.displayName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white group-hover:text-[#5865f2] transition-colors">
                                  {userData.displayName || change.userId}
                                </div>
                                <div className="text-xs text-gray-500">{change.userId}</div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{change.previousRank || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1.5 inline-flex text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                              {change.newRank}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">{change.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#1f1f1f]">
                                <Image
                                  src={staffData.avatarURL}
                                  alt={staffData.displayName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div>
                                <div className="text-sm text-gray-300">{staffData.displayName || change.staffId}</div>
                                <div className="text-xs text-gray-500">{change.staffId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(change.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <p className="mt-4 text-sm text-gray-500">No rank changes found</p>
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
