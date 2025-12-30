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
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">📋</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Infractions</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats?.totalInfractions || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">⭐</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Rank Changes</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats?.totalRankChanges || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Infractions</h3>
                <div className="space-y-3">
                  {stats?.recentInfractions?.length > 0 ? (
                    stats.recentInfractions.map((infraction) => (
                      <div key={infraction._id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between">
                          <span className="font-medium">{infraction.type.toUpperCase()}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(infraction.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{infraction.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No recent infractions</p>
                  )}
                </div>
                <div className="mt-4">
                  <Link href="/infractions" className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    View all infractions →
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Rank Changes</h3>
                <div className="space-y-3">
                  {stats?.recentRankChanges?.length > 0 ? (
                    stats.recentRankChanges.map((change) => (
                      <div key={change._id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between">
                          <span className="font-medium">{change.newRank}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(change.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{change.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No recent rank changes</p>
                  )}
                </div>
                <div className="mt-4">
                  <Link href="/rank-changes" className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    View all rank changes →
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

