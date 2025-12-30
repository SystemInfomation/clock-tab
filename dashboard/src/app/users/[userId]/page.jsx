'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, Mic, UserX, Ban, Shield } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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

export default function UserPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params.userId
  const [userData, setUserData] = useState(null)
  const [discordUser, setDiscordUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session && userId) {
      fetchUserData()
      fetchDiscordUser()
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

  async function fetchDiscordUser() {
    try {
      const res = await fetch(`/api/discord/user/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setDiscordUser(data)
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Failed to fetch Discord user:', res.status, errorData)
        // Set fallback data if API fails
        setDiscordUser({
          id: userId,
          username: 'Unknown User',
          displayName: 'Unknown User',
          avatarURL: getDiscordAvatar(userId)
        })
      }
    } catch (error) {
      console.error('Error fetching Discord user:', error)
      // Set fallback data on error
      setDiscordUser({
        id: userId,
        username: 'Unknown User',
        displayName: 'Unknown User',
        avatarURL: getDiscordAvatar(userId)
      })
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

  const stats = userData?.stats || {}
  const infractions = userData?.infractions || []
  const rankChanges = userData?.rankChanges || []
  const avatarUrl = discordUser?.avatarURL || getDiscordAvatar(userId)
  const displayName = discordUser?.displayName || discordUser?.username || userId

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6 lg:px-8 max-w-[1920px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="pt-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-border/50">
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{displayName}</h1>
                  <p className="text-muted-foreground">ID: {userId}</p>
                  {discordUser?.username && (
                    <p className="text-sm text-muted-foreground/70">@{discordUser.username}</p>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-hover-bg/50 border border-border/30">
                  <p className="text-sm text-muted-foreground mb-2">Total Points</p>
                  <p className="text-3xl font-bold text-white">{stats.totalPoints || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-hover-bg/50 border border-border/30">
                  <p className="text-sm text-muted-foreground mb-2">Current Rank</p>
                  <p className="text-2xl font-bold text-white">{stats.currentRank || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-xl bg-hover-bg/50 border border-border/30">
                  <p className="text-sm text-muted-foreground mb-2">Total Infractions</p>
                  <p className="text-3xl font-bold text-white">{stats.totalInfractions || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-hover-bg/50 border border-border/30">
                  <p className="text-sm text-muted-foreground mb-2">Last Action</p>
                  <p className="text-sm font-medium text-white">
                    {stats.lastActionDate ? new Date(stats.lastActionDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Type Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-hover-bg/30 border border-border/20">
                  <p className="text-xs text-muted-foreground mb-1">Warnings</p>
                  <p className="text-xl font-semibold text-white">{stats.warnings || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-hover-bg/30 border border-border/20">
                  <p className="text-xs text-muted-foreground mb-1">Mutes</p>
                  <p className="text-xl font-semibold text-white">{stats.mutes || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-hover-bg/30 border border-border/20">
                  <p className="text-xs text-muted-foreground mb-1">Kicks</p>
                  <p className="text-xl font-semibold text-white">{stats.kicks || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-hover-bg/30 border border-border/20">
                  <p className="text-xs text-muted-foreground mb-1">Bans</p>
                  <p className="text-xl font-semibold text-white">{stats.bans || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Infraction History */}
            <Card>
              <CardHeader>
                <CardTitle>Infraction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {infractions.length > 0 ? (
                    infractions.map((infraction, index) => {
                      const TypeIcon = typeIcons[infraction.type] || AlertTriangle
                      return (
                        <motion.div
                          key={infraction._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="pb-4 border-b border-border/30 last:border-0 last:pb-0"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <Badge variant={typeBadgeVariants[infraction.type] || 'default'}>
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {infraction.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(infraction.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-white mt-2">{infraction.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">Points: {infraction.points}</p>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12">
                      <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">No infractions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rank Change History */}
            <Card>
              <CardHeader>
                <CardTitle>Rank Change History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {rankChanges.length > 0 ? (
                    rankChanges.map((change, index) => (
                      <motion.div
                        key={change._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="pb-4 border-b border-border/30 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="success">
                            <Shield className="w-3 h-3 mr-1" />
                            {change.newRank}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(change.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        {change.previousRank && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Previous: {change.previousRank}
                          </p>
                        )}
                        <p className="text-sm text-white mt-2">{change.reason}</p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">No rank changes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

