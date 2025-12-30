'use client'

import { motion } from 'framer-motion'

const buttonVariants = {
  default: 'bg-[#1a1a1d] text-white border border-border/50 hover:bg-[#222225] hover:border-accent/50',
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20',
  secondary: 'bg-transparent text-foreground border border-border hover:bg-hover-bg',
  ghost: 'bg-transparent text-foreground hover:bg-hover-bg',
  destructive: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
}

export function Button({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  onClick,
  disabled = false,
  ...props
}) {
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    default: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
  }

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-xl font-medium
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background
        disabled:opacity-50 disabled:cursor-not-allowed
        ${buttonVariants[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  )
}

