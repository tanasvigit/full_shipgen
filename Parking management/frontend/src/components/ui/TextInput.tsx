import type { InputHTMLAttributes } from 'react';

const inputClassName =
  'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export default function TextInput({ className = '', ...props }: TextInputProps) {
  return <input className={`${inputClassName} ${className}`.trim()} {...props} />;
}
