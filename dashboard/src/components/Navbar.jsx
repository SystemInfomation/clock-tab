'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { getDiscordAvatar } from '@/lib/discord'
import Image from 'next/image'
import { Button } from './ui/Button'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const userAvatar = session?.user?.image || (session?.user?.id ? getDiscordAvatar(session.user.id) : null)

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
          {/* Left: Logo */}
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2 group">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-xl font-bold gradient-text"
              >
                Moderation Dashboard
              </motion.span>
            </Link>

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

