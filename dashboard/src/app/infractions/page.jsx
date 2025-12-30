'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileWarning, AlertTriangle, Mic, UserX, Ban, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import Image from 'next/image'
import Link from 'next/link'

const typeIcons = {
  warning: AlertTriangle,
  mute: Mic,
  kick: UserX,
  ban: Ban,
}

const typeBadgeVariants = {
  warning: 'warning',
  mute: 'mute',
  kick: 'kick',
  ban: 'ban',
}

export default function InfractionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [infractions, setInfractions] = useState([])
  const [userInfo, setUserInfo] = useState({})
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
    if (infractions.length > 0) {
      fetchUserInfo()
    }
  }, [infractions])

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

  async function fetchUserInfo() {
    const userIds = new Set()
    infractions.forEach(inf => {
      if (inf.userId) userIds.add(inf.userId)
      if (inf.staffId) userIds.add(inf.staffId)
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
            <h1 className="text-5xl font-bold text-white mb-3">Infractions</h1>
            <p className="text-lg text-muted-foreground">View and manage all moderation actions</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Type</label>
                  <Select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                  >
                    <option value="">All Types</option>
                    <option value="warning">Warning</option>
                    <option value="mute">Mute</option>
                    <option value="kick">Kick</option>
                    <option value="ban">Ban</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">User ID</label>
                  <Input
                    type="text"
                    value={filters.userId}
                    onChange={(e) => setFilters({ ...filters, userId: e.target.value, page: 1 })}
                    placeholder="Enter user ID"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Infractions Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Infractions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Staff</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Points</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {infractions.length > 0 ? (
                      infractions.map((infraction, index) => {
                        const userData = userInfo[infraction.userId] || {
                          displayName: infraction.userId,
                          avatarURL: `https://cdn.discordapp.com/embed/avatars/${(parseInt(infraction.userId) >> 22) % 6}.png?size=256`
                        }
                        const staffData = userInfo[infraction.staffId] || {
                          displayName: infraction.staffId,
                          avatarURL: `https://cdn.discordapp.com/embed/avatars/${(parseInt(infraction.staffId) >> 22) % 6}.png?size=256`
                        }
                        const TypeIcon = typeIcons[infraction.type] || FileWarning

                        return (
                          <motion.tr
                            key={infraction._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-border/30 hover:bg-hover-bg/50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <Link href={`/users/${infraction.userId}`} className="flex items-center gap-3 group">
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
                                  <div className="text-xs text-muted-foreground">{infraction.userId}</div>
                                </div>
                              </Link>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant={typeBadgeVariants[infraction.type] || 'default'}>
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {infraction.type.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-muted-foreground max-w-xs truncate">{infraction.reason}</p>
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
                                  <div className="text-xs text-muted-foreground">{infraction.staffId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold text-white bg-hover-bg border border-border/50">
                                {infraction.points}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-muted-foreground">
                                {new Date(infraction.timestamp).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(infraction._id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </motion.tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-12 text-center">
                          <FileWarning className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">No infractions found</p>
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

