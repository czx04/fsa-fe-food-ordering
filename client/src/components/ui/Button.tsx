import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'pagination'
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
      'bg-[#ff5a1f] text-white hover:bg-[#e94e16] hover:-translate-y-px focus:ring-4 focus:ring-[#ff5a1f]/20 border-0',
    outline:
      'border border-[#e7ece8] bg-white text-[#17201a] hover:border-[#ff5a1f] hover:text-[#ff5a1f] hover:-translate-y-px focus:ring-4 focus:ring-[#ff5a1f]/10',
    ghost:
      'bg-transparent text-[#68736c] hover:bg-[#f7faf7] hover:text-[#17201a]',
    pagination:
      'grid h-[38px] w-[38px] place-items-center rounded-[9px] border border-[#e7ece8] bg-white text-[#17201a] hover:border-[#ff5a1f] hover:text-[#ff5a1f]',
  }

  const sizeStyles = {
    sm: 'min-h-[36px] px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'min-h-[44px] px-5 py-2.5 text-sm rounded-[10px] gap-2',
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
