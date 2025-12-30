'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getDiscordAvatar } from '@/lib/discord'
import Image from 'next/image'

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

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 animate-fade-in">
        <div className="px-4 sm:px-0">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-3">Dashboard Overview</h1>
            <p className="text-gray-400 text-lg">Monitor and manage moderation activities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-card rounded-2xl p-6 card-shadow hover-glow transition-all border border-[#1f1f1f]">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-14 h-14 gradient-bg-blue rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Total Infractions</p>
                    <p className="text-4xl font-bold text-white mt-1">{stats?.totalInfractions || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 card-shadow hover-glow transition-all border border-[#1f1f1f]">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-14 h-14 gradient-bg-purple rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Total Rank Changes</p>
                    <p className="text-4xl font-bold text-white mt-1">{stats?.totalRankChanges || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl border border-[#1f1f1f] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#1f1f1f] bg-gradient-to-r from-[#111111] to-[#1a1a1a]">
                <h3 className="text-lg font-semibold text-white">Recent Infractions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats?.recentInfractions?.length > 0 ? (
                    stats.recentInfractions.map((infraction) => {
                      const avatarUrl = getDiscordAvatar(infraction.userId)
                      return (
                        <div key={infraction._id} className="flex items-start gap-4 p-4 rounded-xl bg-[#111111] hover:bg-[#1a1a1a] transition-all border border-[#1f1f1f]">
                          <div className="flex-shrink-0">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#1f1f1f]">
                              <Image
                                src={avatarUrl}
                                alt={infraction.userId}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                infraction.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                infraction.type === 'mute' ? 'bg-blue-500/20 text-blue-400' :
                                infraction.type === 'kick' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {infraction.type.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(infraction.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 truncate">{infraction.reason}</p>
                            <Link href={`/users/${infraction.userId}`} className="text-xs text-[#5865f2] hover:text-[#4752c4] mt-1 inline-block">
                              View user →
                            </Link>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-4 text-sm text-gray-500">No recent infractions</p>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <Link href="/infractions" className="inline-flex items-center text-sm font-medium text-[#5865f2] hover:text-[#4752c4] transition-colors">
                    View all infractions
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-[#1f1f1f] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#1f1f1f] bg-gradient-to-r from-[#111111] to-[#1a1a1a]">
                <h3 className="text-lg font-semibold text-white">Recent Rank Changes</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats?.recentRankChanges?.length > 0 ? (
                    stats.recentRankChanges.map((change) => {
                      const avatarUrl = getDiscordAvatar(change.userId)
                      return (
                        <div key={change._id} className="flex items-start gap-4 p-4 rounded-xl bg-[#111111] hover:bg-[#1a1a1a] transition-all border border-[#1f1f1f]">
                          <div className="flex-shrink-0">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#1f1f1f]">
                              <Image
                                src={avatarUrl}
                                alt={change.userId}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                {change.newRank}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(change.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 truncate">{change.reason}</p>
                            <Link href={`/users/${change.userId}`} className="text-xs text-[#5865f2] hover:text-[#4752c4] mt-1 inline-block">
                              View user →
                            </Link>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <p className="mt-4 text-sm text-gray-500">No recent rank changes</p>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <Link href="/rank-changes" className="inline-flex items-center text-sm font-medium text-[#5865f2] hover:text-[#4752c4] transition-colors">
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
