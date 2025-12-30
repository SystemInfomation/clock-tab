'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getDiscordAvatar } from '@/lib/discord'
import Image from 'next/image'

const typeColors = {
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  mute: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  kick: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ban: 'bg-red-500/20 text-red-400 border-red-500/30'
}

export default function UserPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params.userId
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session && userId) {
      fetchUserData()
    }
  }, [session, userId])

  async function fetchUserData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}`)
      const data = await res.json()
      setUserData(data)
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
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

  const stats = userData?.stats || {}
  const infractions = userData?.infractions || []
  const rankChanges = userData?.rankChanges || []
  const avatarUrl = getDiscordAvatar(userId)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 animate-fade-in">
        <div className="px-4 sm:px-0">
          <div className="glass-card rounded-2xl border border-[#1f1f1f] p-8 mb-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#1f1f1f]">
                <Image
                  src={avatarUrl}
                  alt={userId}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">User Profile</h1>
                <p className="text-gray-400 text-lg">ID: {userId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f]">
                <p className="text-sm text-gray-400 mb-2">Total Points</p>
                <p className="text-3xl font-bold text-white">{stats.totalPoints || 0}</p>
              </div>
              <div className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f]">
                <p className="text-sm text-gray-400 mb-2">Current Rank</p>
                <p className="text-2xl font-bold text-white">{stats.currentRank || 'N/A'}</p>
              </div>
              <div className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f]">
                <p className="text-sm text-gray-400 mb-2">Total Infractions</p>
                <p className="text-3xl font-bold text-white">{stats.totalInfractions || 0}</p>
              </div>
              <div className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f]">
                <p className="text-sm text-gray-400 mb-2">Last Action</p>
                <p className="text-sm font-medium text-gray-300">
                  {stats.lastActionDate ? new Date(stats.lastActionDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#111111] rounded-lg p-3 border border-[#1f1f1f]">
                <p className="text-xs text-gray-400 mb-1">Warnings</p>
                <p className="text-xl font-semibold text-white">{stats.warnings || 0}</p>
              </div>
              <div className="bg-[#111111] rounded-lg p-3 border border-[#1f1f1f]">
                <p className="text-xs text-gray-400 mb-1">Mutes</p>
                <p className="text-xl font-semibold text-white">{stats.mutes || 0}</p>
              </div>
              <div className="bg-[#111111] rounded-lg p-3 border border-[#1f1f1f]">
                <p className="text-xs text-gray-400 mb-1">Kicks</p>
                <p className="text-xl font-semibold text-white">{stats.kicks || 0}</p>
              </div>
              <div className="bg-[#111111] rounded-lg p-3 border border-[#1f1f1f]">
                <p className="text-xs text-gray-400 mb-1">Bans</p>
                <p className="text-xl font-semibold text-white">{stats.bans || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl border border-[#1f1f1f]">
              <div className="px-6 py-5 border-b border-[#1f1f1f]">
                <h3 className="text-lg font-semibold text-white">Infraction History</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {infractions.length > 0 ? (
                    infractions.map((infraction) => (
                      <div key={infraction._id} className="border-b border-[#1f1f1f] pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${typeColors[infraction.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                            {infraction.type.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(infraction.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-2">{infraction.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">Points: {infraction.points}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">No infractions</p>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-[#1f1f1f]">
              <div className="px-6 py-5 border-b border-[#1f1f1f]">
                <h3 className="text-lg font-semibold text-white">Rank Change History</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {rankChanges.length > 0 ? (
                    rankChanges.map((change) => (
                      <div key={change._id} className="border-b border-[#1f1f1f] pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            {change.newRank}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(change.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        {change.previousRank && (
                          <p className="text-xs text-gray-500 mt-1">
                            Previous: {change.previousRank}
                          </p>
                        )}
                        <p className="text-sm text-gray-300 mt-2">{change.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">No rank changes</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
