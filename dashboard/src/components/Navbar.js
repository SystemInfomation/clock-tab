'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              Moderation Dashboard
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/" className="hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link href="/infractions" className="hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Infractions
              </Link>
              <Link href="/rank-changes" className="hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Rank Changes
              </Link>
              <Link href="/analytics" className="hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Analytics
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {session && (
              <div className="flex items-center space-x-4">
                <span className="text-sm">{session.user.name}</span>
                <button
                  onClick={() => signOut()}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md text-sm font-medium"
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

