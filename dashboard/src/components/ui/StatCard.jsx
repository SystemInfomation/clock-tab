'use client'

import { motion } from 'framer-motion'
import { Card } from './Card'

export function StatCard({ icon: Icon, label, value, trend, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Card className={`relative overflow-hidden group ${className}`}>
        {/* Gradient background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="flex items-start justify-between relative z-10">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              {label}
            </p>
            <div className="flex items-baseline gap-3">
              <motion.p
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: delay + 0.1 }}
                className="text-4xl font-bold text-white tracking-tight"
              >
                {value}
              </motion.p>
              {trend && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + 0.2 }}
                  className={`text-sm font-semibold flex items-center gap-1 px-2 py-1 rounded-md ${
                    trend > 0 
                      ? 'text-green-400 bg-green-400/10' 
                      : 'text-red-400 bg-red-400/10'
                  }`}
                >
                  <span>{trend > 0 ? '↑' : '↓'}</span>
                  {Math.abs(trend)}%
                </motion.span>
              )}
            </div>
          </div>
          {Icon && (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="p-4 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 stat-icon-glow group-hover:border-accent/40 transition-all"
            >
              <Icon className="w-7 h-7 text-accent" />
            </motion.div>
          )}
        </div>
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Card>
    </motion.div>
  )
}

