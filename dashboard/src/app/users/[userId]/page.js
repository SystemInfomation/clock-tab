'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'

const typeColors = {
  warning: 'bg-yellow-100 text-yellow-800',
  mute: 'bg-blue-100 text-blue-800',
  kick: 'bg-orange-100 text-orange-800',
  ban: 'bg-red-100 text-red-800'
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
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) return null

  const stats = userData?.stats || {}
  const infractions = userData?.infractions || []
  const rankChanges = userData?.rankChanges || []

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">User Profile</h1>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">User ID: {userId}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Points</p>
                <p className="text-2xl font-bold">{stats.totalPoints || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Rank</p>
                <p className="text-2xl font-bold">{stats.currentRank || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Infractions</p>
                <p className="text-2xl font-bold">{stats.totalInfractions || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Action</p>
                <p className="text-sm font-medium">
                  {stats.lastActionDate ? new Date(stats.lastActionDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Warnings</p>
                <p className="text-lg font-semibold">{stats.warnings || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mutes</p>
                <p className="text-lg font-semibold">{stats.mutes || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kicks</p>
                <p className="text-lg font-semibold">{stats.kicks || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bans</p>
                <p className="text-lg font-semibold">{stats.bans || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Infraction History</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {infractions.length > 0 ? (
                    infractions.map((infraction) => (
                      <div key={infraction._id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${typeColors[infraction.type] || 'bg-gray-100 text-gray-800'}`}>
                            {infraction.type.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(infraction.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{infraction.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">Points: {infraction.points}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No infractions</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Rank Change History</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {rankChanges.length > 0 ? (
                    rankChanges.map((change) => (
                      <div key={change._id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between items-center">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
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
                        <p className="text-sm text-gray-600 mt-1">{change.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No rank changes</p>
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

