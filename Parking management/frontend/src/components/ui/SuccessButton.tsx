import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface SuccessButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
}

export default function SuccessButton({
  children,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: SuccessButtonProps) {
  return (
    <button
      type={type}
      className={`px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-green-600/20 hover:-translate-y-0.5 transition-all ${
        fullWidth ? 'w-full' : ''
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
