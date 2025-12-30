'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileWarning, Sparkles, ArrowRight, AlertTriangle, Mic, UserX, Ban, Shield, TrendingUp, Clock } from 'lucide-react'
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

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-muted-foreground"
            >
              Loading dashboard...
            </motion.p>
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
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent/70" />
                Monitor and manage moderation activities in real-time
              </p>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <StatCard
                icon={FileWarning}
                label="Total Infractions"
                value={stats?.totalInfractions?.toLocaleString() || '0'}
                delay={0.1}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <StatCard
                icon={Sparkles}
                label="Total Rank Changes"
                value={stats?.totalRankChanges?.toLocaleString() || '0'}
                delay={0.2}
              />
            </motion.div>
          </div>

          {/* Panels Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Infractions Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileWarning className="w-5 h-5 text-accent" />
                      Recent Infractions
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {stats?.recentInfractions?.length || 0} recent
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.recentInfractions?.length > 0 ? (
                      stats.recentInfractions.map((infraction, index) => {
                        const userData = userInfo[infraction.userId] || {
                          displayName: infraction.userId,
                          avatarURL: getDiscordAvatar(infraction.userId)
                        }
                        const TypeIcon = typeIcons[infraction.type] || FileWarning
                        const timeAgo = getTimeAgo(new Date(infraction.timestamp))

                        return (
                          <motion.div
                            key={infraction._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.08 }}
                            whileHover={{ x: 4 }}
                            className="group"
                          >
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-hover-bg/30 to-hover-bg/10 border border-border/30 hover:border-border/60 hover:bg-hover-bg/40 transition-all duration-300 cursor-pointer">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-border/50 group-hover:ring-accent/30 flex-shrink-0 transition-all"
                              >
                                <Image
                                  src={userData.avatarURL}
                                  alt={userData.displayName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant={typeBadgeVariants[infraction.type] || 'default'} className="text-xs">
                                    <TypeIcon className="w-3 h-3 mr-1" />
                                    {infraction.type.toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-white mb-1 group-hover:text-accent transition-colors">
                                  {userData.displayName}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {infraction.reason || 'No reason provided'}
                                </p>
                                <Link
                                  href={`/users/${infraction.userId}`}
                                  className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors group/link"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View profile
                                  <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                      >
                        <div className="relative w-20 h-20 mx-auto mb-4">
                          <div className="absolute inset-0 bg-accent/10 rounded-full blur-xl" />
                          <FileWarning className="w-12 h-12 text-muted-foreground/50 mx-auto relative" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">No recent infractions</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">All clear! 🎉</p>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/30 bg-hover-bg/20">
                  <Link href="/infractions" className="w-full">
                    <Button variant="ghost" className="w-full justify-between group/btn hover:bg-hover-bg/50">
                      <span>View all infractions</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Recent Rank Changes Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-accent" />
                      Recent Rank Changes
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {stats?.recentRankChanges?.length || 0} recent
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.recentRankChanges?.length > 0 ? (
                      stats.recentRankChanges.map((change, index) => {
                        const userData = userInfo[change.userId] || {
                          displayName: change.userId,
                          avatarURL: getDiscordAvatar(change.userId)
                        }
                        const timeAgo = getTimeAgo(new Date(change.timestamp))

                        return (
                          <motion.div
                            key={change._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.08 }}
                            whileHover={{ x: 4 }}
                            className="group"
                          >
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-hover-bg/30 to-hover-bg/10 border border-border/30 hover:border-border/60 hover:bg-hover-bg/40 transition-all duration-300 cursor-pointer">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-border/50 group-hover:ring-green-400/30 flex-shrink-0 transition-all"
                              >
                                <Image
                                  src={userData.avatarURL}
                                  alt={userData.displayName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant="success" className="text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    {change.newRank}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-white mb-1 group-hover:text-green-400 transition-colors">
                                  {userData.displayName}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {change.reason || 'No reason provided'}
                                </p>
                                <Link
                                  href={`/users/${change.userId}`}
                                  className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors group/link"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View profile
                                  <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                      >
                        <div className="relative w-20 h-20 mx-auto mb-4">
                          <div className="absolute inset-0 bg-green-400/10 rounded-full blur-xl" />
                          <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto relative" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">No recent rank changes</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">All quiet on the promotion front</p>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/30 bg-hover-bg/20">
                  <Link href="/rank-changes" className="w-full">
                    <Button variant="ghost" className="w-full justify-between group/btn hover:bg-hover-bg/50">
                      <span>View all rank changes</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

