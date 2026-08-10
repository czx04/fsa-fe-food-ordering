import React from 'react'

export interface BadgeProps {
  variant?: 'orange' | 'amber' | 'blue' | 'gray' | 'danger'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'orange',
  size = 'md',
  children,
  className = '',
}) => {
  const variantStyles = {
    orange: 'bg-orange-50 text-orange-600 border border-orange-200/60',
    amber: 'bg-amber-50 text-amber-600 border border-amber-200/60',
    blue: 'bg-blue-50 text-blue-600 border border-blue-200/60',
    gray: 'bg-slate-100 text-slate-600 border border-slate-200/60',
    danger: 'bg-rose-50 text-rose-600 border border-rose-200/60',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span
      className={`inline-flex items-center font-bold rounded-lg ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()}
    >
      {children}
    </span>
  )
}
