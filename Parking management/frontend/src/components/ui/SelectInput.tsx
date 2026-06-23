import type { SelectHTMLAttributes } from 'react';

const selectClassName =
  'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement>;

export default function SelectInput({ className = '', children, ...props }: SelectInputProps) {
  return (
    <select className={`${selectClassName} ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
