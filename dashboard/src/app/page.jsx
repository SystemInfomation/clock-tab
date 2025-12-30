'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileWarning, Sparkles, ArrowRight, AlertTriangle, Mic, UserX, Ban, Shield } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getDiscordAvatar } from '@/lib/discord'
import Image from 'next/image'

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

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [userInfo, setUserInfo] = useState({})
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

  useEffect(() => {
    if (stats) {
      fetchUserInfo()
    }
  }, [stats])

  async function fetchUserInfo() {
    if (!stats) return

    const userIds = new Set()
    stats.recentInfractions?.forEach(inf => {
      if (inf.userId) userIds.add(inf.userId)
    })
    stats.recentRankChanges?.forEach(change => {
      if (change.userId) userIds.add(change.userId)
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

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6 lg:px-8 max-w-[1920px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header Section */}
          <div className="mb-10">
            <h1 className="text-5xl font-bold text-white mb-3">Dashboard Overview</h1>
            <p className="text-lg text-muted-foreground">Monitor and manage moderation activities</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <StatCard
              icon={FileWarning}
              label="Total Infractions"
              value={stats?.totalInfractions?.toLocaleString() || '0'}
              delay={0.1}
            />
            <StatCard
              icon={Sparkles}
              label="Total Rank Changes"
              value={stats?.totalRankChanges?.toLocaleString() || '0'}
              delay={0.2}
            />
          </div>

          {/* Panels Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Infractions Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Infractions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentInfractions?.length > 0 ? (
                    stats.recentInfractions.map((infraction, index) => {
                      const userData = userInfo[infraction.userId] || {
                        displayName: infraction.userId,
                        avatarURL: getDiscordAvatar(infraction.userId)
                      }
                      const TypeIcon = typeIcons[infraction.type] || FileWarning

                      return (
                        <motion.div
                          key={infraction._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-4 p-4 rounded-xl bg-hover-bg/50 border border-border/30 hover:border-border/50 transition-colors"
                        >
                          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-border/50 flex-shrink-0">
                            <Image
                              src={userData.avatarURL}
                              alt={userData.displayName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={typeBadgeVariants[infraction.type] || 'default'}>
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {infraction.type.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(infraction.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-white mb-1">{userData.displayName}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{infraction.reason}</p>
                            <Link
                              href={`/users/${infraction.userId}`}
                              className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover mt-2 transition-colors"
                            >
                              View user <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12">
                      <FileWarning className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">No recent infractions</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/infractions" className="w-full">
                  <Button variant="ghost" className="w-full justify-between">
                    View all infractions
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Recent Rank Changes Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Rank Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentRankChanges?.length > 0 ? (
                    stats.recentRankChanges.map((change, index) => {
                      const userData = userInfo[change.userId] || {
                        displayName: change.userId,
                        avatarURL: getDiscordAvatar(change.userId)
                      }

                      return (
                        <motion.div
                          key={change._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-4 p-4 rounded-xl bg-hover-bg/50 border border-border/30 hover:border-border/50 transition-colors"
                        >
                          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-border/50 flex-shrink-0">
                            <Image
                              src={userData.avatarURL}
                              alt={userData.displayName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="success">
                                <Shield className="w-3 h-3 mr-1" />
                                {change.newRank}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(change.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-white mb-1">{userData.displayName}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{change.reason}</p>
                            <Link
                              href={`/users/${change.userId}`}
                              className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover mt-2 transition-colors"
                            >
                              View user <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">No recent rank changes</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/rank-changes" className="w-full">
                  <Button variant="ghost" className="w-full justify-between">
                    View all rank changes
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

