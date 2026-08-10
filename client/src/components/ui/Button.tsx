import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'pagination'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition duration-150 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40'

  const variantStyles = {
    primary:
      'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.99] focus:ring-4 focus:ring-orange-500/20 border-0 shadow-sm shadow-orange-500/20',
    secondary:
      'bg-orange-100 text-orange-600 hover:bg-orange-200 active:scale-[0.99] focus:ring-4 focus:ring-orange-500/10 border-0',
    outline:
      'border border-slate-200 bg-white text-slate-800 hover:border-orange-500 hover:text-orange-600 active:scale-[0.99] focus:ring-4 focus:ring-orange-500/10',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    pagination:
      'grid h-[38px] w-[38px] place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-orange-500 hover:text-orange-600',
  }

  const sizeStyles = {
    sm: 'min-h-[36px] px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'min-h-[44px] px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'min-h-[48px] px-6 py-3 text-base rounded-xl gap-2.5',
  }

  const widthStyle = fullWidth ? 'w-full' : ''

  const combinedClasses = `${baseStyles} ${variantStyles[variant]} ${
    variant === 'pagination' ? '' : sizeStyles[size]
  } ${widthStyle} ${className}`.trim()

  return (
    <button type={type} className={combinedClasses} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
