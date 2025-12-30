'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { getDiscordAvatar } from '@/lib/discord'
import Image from 'next/image'
import { Button } from './ui/Button'
import { Bot, Users } from 'lucide-react'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const userAvatar = session?.user?.image || (session?.user?.id ? getDiscordAvatar(session.user.id) : null)
  
  // Discord URLs from environment variables
  const discordBotUrl = process.env.NEXT_PUBLIC_DISCORD_BOT_INVITE_URL
  const discordServerUrl = process.env.NEXT_PUBLIC_DISCORD_SERVER_INVITE_URL

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/infractions', label: 'Infractions' },
    { href: '/rank-changes', label: 'Rank Changes' },
    { href: '/analytics', label: 'Analytics' },
  ]

  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Discord Links */}
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              {/* Discord Bot Icon */}
              <motion.a
                href={discordBotUrl || '#'}
                target={discordBotUrl ? '_blank' : undefined}
                rel={discordBotUrl ? 'noopener noreferrer' : undefined}
                whileHover={{ scale: discordBotUrl ? 1.1 : 1 }}
                whileTap={{ scale: discordBotUrl ? 0.95 : 1 }}
                onClick={(e) => {
                  if (!discordBotUrl) {
                    e.preventDefault();
                  }
                }}
                className={`p-2 rounded-lg bg-hover-bg/50 hover:bg-hover-bg border border-border/50 transition-all group ${
                  discordBotUrl 
                    ? 'hover:border-accent/50 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                title={discordBotUrl ? 'Discord Bot Invite' : 'Discord Bot URL not configured'}
              >
                <Bot className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </motion.a>
              
              {/* Discord Server Icon */}
              <motion.a
                href={discordServerUrl || '#'}
                target={discordServerUrl ? '_blank' : undefined}
                rel={discordServerUrl ? 'noopener noreferrer' : undefined}
                whileHover={{ scale: discordServerUrl ? 1.1 : 1 }}
                whileTap={{ scale: discordServerUrl ? 0.95 : 1 }}
                onClick={(e) => {
                  if (!discordServerUrl) {
                    e.preventDefault();
                  }
                }}
                className={`p-2 rounded-lg bg-hover-bg/50 hover:bg-hover-bg border border-border/50 transition-all group ${
                  discordServerUrl 
                    ? 'hover:border-accent/50 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                title={discordServerUrl ? 'Discord Server Invite' : 'Discord Server URL not configured'}
              >
                <Users className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </motion.a>
              
              <Link href="/" className="flex items-center gap-2 group">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="text-xl font-bold gradient-text"
                >
                  Moderation Dashboard
                </motion.span>
              </Link>
            </div>

            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-4 py-2 text-sm font-medium rounded-lg
                    transition-all duration-200
                    ${isActive(link.href)
                      ? 'text-white bg-hover-bg'
                      : 'text-muted-foreground hover:text-white hover:bg-hover-bg'
                    }
                  `}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg bg-hover-bg border border-border/50 -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-4">
            {session && (
              <>
                <div className="flex items-center gap-3">
                  {userAvatar && (
                    <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-border/50 ring-offset-2 ring-offset-background">
                      <Image
                        src={userAvatar}
                        alt={session.user.name || 'User'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-white">
                    {session.user.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-white"
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

