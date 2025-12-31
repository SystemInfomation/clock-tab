'use client'

import { motion } from 'framer-motion'

export function Card({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2 } : {}}
      className={`
        bg-gradient-to-b from-[#111113] to-[#0f0f11] backdrop-blur-xl
        rounded-3xl overflow-hidden
        border border-white/5
        shadow-2xl shadow-black/40
        ${hover ? 'hover:border-white/10 hover:shadow-2xl hover:shadow-black/60' : ''}
        transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 pt-6 pb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold leading-tight tracking-tight text-white ${className}`}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-gray-400 leading-relaxed mt-1 ${className}`}>
      {children}
    </p>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-6 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.02] ${className}`}>
      {children}
    </div>
  )
}

