'use client'

import { motion } from 'framer-motion'
import { Card } from './Card'

export function StatCard({ icon: Icon, label, value, trend, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">{value}</p>
              {trend && (
                <span className={`text-sm font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
            </div>
          </div>
          {Icon && (
            <div className="p-3 rounded-xl bg-accent/10 stat-icon-glow">
              <Icon className="w-6 h-6 text-accent" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

