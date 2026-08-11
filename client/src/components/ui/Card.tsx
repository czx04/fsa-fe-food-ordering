import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
}) => {
  const hoverStyle = hoverable
    ? 'transition duration-200 hover:-translate-y-1 hover:shadow-lg'
    : ''

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ${hoverStyle} ${className}`.trim()}
    >
      {children}
    </div>
  )
}
