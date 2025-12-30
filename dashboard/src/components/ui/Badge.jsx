'use client'

const badgeVariants = {
  default: 'bg-[#1a1a1d] text-white border-border/50',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  mute: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  kick: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  ban: 'bg-red-500/10 text-red-400 border-red-500/20',
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  secondary: 'bg-muted/10 text-muted-foreground border-border/50',
}

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
        transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        ${badgeVariants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

