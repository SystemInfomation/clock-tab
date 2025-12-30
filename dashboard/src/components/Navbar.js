'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Moderation Dashboard
            </Link>
            <div className="ml-10 flex items-baseline space-x-1">
              <Link href="/" className="text-gray-700 hover:bg-gray-100 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="/infractions" className="text-gray-700 hover:bg-gray-100 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Infractions
              </Link>
              <Link href="/rank-changes" className="text-gray-700 hover:bg-gray-100 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Rank Changes
              </Link>
              <Link href="/analytics" className="text-gray-700 hover:bg-gray-100 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Analytics
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {session && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{session.user.name}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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

