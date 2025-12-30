'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { getDiscordAvatar } from '@/lib/discord'
import Image from 'next/image'

export default function Navbar() {
  const { data: session } = useSession()
  const userAvatar = session?.user?.image || (session?.user?.id ? getDiscordAvatar(session.user.id) : null)

  return (
    <nav className="bg-[#111111] border-b border-[#1f1f1f] backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold gradient-text hover:opacity-80 transition-opacity">
              Moderation Dashboard
            </Link>
            <div className="ml-10 flex items-baseline space-x-1">
              <Link href="/" className="text-gray-300 hover:bg-[#1a1a1a] hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all">
                Home
              </Link>
              <Link href="/infractions" className="text-gray-300 hover:bg-[#1a1a1a] hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all">
                Infractions
              </Link>
              <Link href="/rank-changes" className="text-gray-300 hover:bg-[#1a1a1a] hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all">
                Rank Changes
              </Link>
              <Link href="/analytics" className="text-gray-300 hover:bg-[#1a1a1a] hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all">
                Analytics
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {session && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {userAvatar && (
                    <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#5865f2] ring-offset-2 ring-offset-[#111111]">
                      <Image
                        src={userAvatar}
                        alt={session.user.name || 'User'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-200">{session.user.name}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-[#1f1f1f] hover:border-[#2f2f2f]"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

