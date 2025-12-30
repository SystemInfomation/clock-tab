'use client'

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`
        flex h-10 w-full rounded-xl border border-border/50 bg-background px-4 py-2 text-sm
        text-white placeholder:text-muted-foreground
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background
        disabled:cursor-not-allowed disabled:opacity-50
        transition-colors
        ${className}
      `}
      {...props}
    />
  )
}

export function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`
        flex h-10 w-full rounded-xl border border-border/50 bg-background px-4 py-2 text-sm
        text-white
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background
        disabled:cursor-not-allowed disabled:opacity-50
        transition-colors
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  )
}

