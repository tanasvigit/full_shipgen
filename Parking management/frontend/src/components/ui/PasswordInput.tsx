import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const DEFAULT_CLASS =
  'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10';

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={className ? `${DEFAULT_CLASS} ${className}` : DEFAULT_CLASS}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((value) => !value)}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

export default PasswordInput;
