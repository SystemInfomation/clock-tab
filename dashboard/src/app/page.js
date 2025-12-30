'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchStats() {
      try {
        const [infractionsRes, rankChangesRes] = await Promise.all([
          fetch('/api/infractions?limit=5'),
          fetch('/api/rank-changes?limit=5')
        ])

        const infractionsData = await infractionsRes.json()
        const rankChangesData = await rankChangesRes.json()

        setStats({
          recentInfractions: infractionsData.infractions || [],
          recentRankChanges: rankChangesData.rankChanges || [],
          totalInfractions: infractionsData.pagination?.total || 0,
          totalRankChanges: rankChangesData.pagination?.total || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchStats()
    }
  }, [session])

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

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">Monitor and manage moderation activities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white overflow-hidden rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 gradient-bg-blue rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Infractions</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalInfractions || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 gradient-bg-purple rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Rank Changes</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalRankChanges || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="text-lg font-semibold text-gray-900">Recent Infractions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats?.recentInfractions?.length > 0 ? (
                    stats.recentInfractions.map((infraction) => (
                      <div key={infraction._id} className="flex items-start justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {infraction.type.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(infraction.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 truncate">{infraction.reason}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No recent infractions</p>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <Link href="/infractions" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                    View all infractions
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <h3 className="text-lg font-semibold text-gray-900">Recent Rank Changes</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats?.recentRankChanges?.length > 0 ? (
                    stats.recentRankChanges.map((change) => (
                      <div key={change._id} className="flex items-start justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {change.newRank}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(change.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 truncate">{change.reason}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No recent rank changes</p>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <Link href="/rank-changes" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                    View all rank changes
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

