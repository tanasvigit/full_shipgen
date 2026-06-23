type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-600 border-green-200',
  danger: 'bg-red-50 text-red-600 border-red-200',
  warning: 'bg-amber-50 text-amber-600 border-amber-200',
  info: 'bg-slate-100 text-slate-700 border-slate-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-green-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-slate-500',
  neutral: 'bg-slate-400',
};

export default function StatusBadge({ label, variant = 'neutral', dot = false, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {label}
    </span>
  );
}
