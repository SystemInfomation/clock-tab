'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Image from 'next/image'
import Link from 'next/link'

export default function RankChangesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rankChanges, setRankChanges] = useState([])
  const [userInfo, setUserInfo] = useState({})
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
    const userIds = new Set()
    rankChanges.forEach(change => {
      if (change.userId) userIds.add(change.userId)
      if (change.staffId) userIds.add(change.staffId)
    })

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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)] mt-16">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-border border-t-accent rounded-full mx-auto"
            />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6 lg:px-8 max-w-[1920px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-5xl font-bold text-white mb-3">Rank Changes</h1>
            <p className="text-lg text-muted-foreground">Track all promotions, demotions, and terminations</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">User ID</label>
                  <Input
                    type="text"
                    value={filters.userId}
                    onChange={(e) => setFilters({ ...filters, userId: e.target.value, page: 1 })}
                    placeholder="Enter user ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Rank</label>
                  <Input
                    type="text"
                    value={filters.rank}
                    onChange={(e) => setFilters({ ...filters, rank: e.target.value, page: 1 })}
                    placeholder="Enter rank"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rank Changes Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Rank Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Previous Rank</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">New Rank</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Staff</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankChanges.length > 0 ? (
                      rankChanges.map((change, index) => {
                        const userData = userInfo[change.userId] || {
                          displayName: change.userId,
                          avatarURL: `https://cdn.discordapp.com/embed/avatars/${parseInt(change.userId) >> 22 % 6}.png`
                        }
                        const staffData = userInfo[change.staffId] || {
                          displayName: change.staffId,
                          avatarURL: `https://cdn.discordapp.com/embed/avatars/${parseInt(change.staffId) >> 22 % 6}.png`
                        }

                        return (
                          <motion.tr
                            key={change._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-border/30 hover:bg-hover-bg/50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <Link href={`/users/${change.userId}`} className="flex items-center gap-3 group">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-border/50 group-hover:ring-accent/50 transition-all">
                                  <Image
                                    src={userData.avatarURL}
                                    alt={userData.displayName}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white group-hover:text-accent transition-colors">
                                    {userData.displayName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{change.userId}</div>
                                </div>
                              </Link>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-muted-foreground">{change.previousRank || 'N/A'}</span>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="success">
                                <Shield className="w-3 h-3 mr-1" />
                                {change.newRank}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-muted-foreground max-w-xs truncate">{change.reason}</p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-border/50">
                                  <Image
                                    src={staffData.avatarURL}
                                    alt={staffData.displayName}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                                <div>
                                  <div className="text-sm text-white">{staffData.displayName}</div>
                                  <div className="text-xs text-muted-foreground">{change.staffId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-muted-foreground">
                                {new Date(change.timestamp).toLocaleString()}
                              </span>
                            </td>
                          </motion.tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-12 text-center">
                          <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">No rank changes found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {filters.page} of {pagination.pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.pages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

