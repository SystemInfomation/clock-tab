'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#5865f2', '#23a55a', '#faa61a', '#f23f42']

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchAnalytics()
    }
  }, [session, period])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?period=${period}`)
      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    if (!analytics) return

    const csv = [
      ['Date', 'Infractions'].join(','),
      ...analytics.infractionsByDate.map(item => [item.date, item.count].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  function exportToJSON() {
    if (!analytics) return

    const json = JSON.stringify(analytics, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5865f2] mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !analytics) return null

  const typeDistributionData = Object.entries(analytics.typeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }))

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 animate-fade-in">
        <div className="px-4 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-bold text-white mb-3">Analytics</h1>
              <p className="text-gray-400 text-lg">Visual insights into moderation data</p>
            </div>
            <div className="flex gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-[#5865f2] focus:border-[#5865f2] transition-all"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
              <button
                onClick={exportToCSV}
                className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-white hover:bg-[#1a1a1a] transition-all text-sm font-medium"
              >
                Export CSV
              </button>
              <button
                onClick={exportToJSON}
                className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-white hover:bg-[#1a1a1a] transition-all text-sm font-medium"
              >
                Export JSON
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="glass-card rounded-2xl border border-[#1f1f1f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Total Infractions</h3>
              <p className="text-4xl font-bold text-white">{analytics.totalInfractions || 0}</p>
            </div>
            <div className="glass-card rounded-2xl border border-[#1f1f1f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Average per Day</h3>
              <p className="text-4xl font-bold text-white">{analytics.averagePerDay?.toFixed(1) || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="glass-card rounded-2xl border border-[#1f1f1f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Infractions Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.infractionsByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #1f1f1f', borderRadius: '8px', color: '#fff' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Line type="monotone" dataKey="count" stroke="#5865f2" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-2xl border border-[#1f1f1f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #1f1f1f', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-[#1f1f1f] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Infractions by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111111', border: '1px solid #1f1f1f', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#5865f2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
