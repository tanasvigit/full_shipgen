import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Native input password field with visibility toggle (YMS forms using FIELD_CLASS). */
export default function PasswordField({ className, toggleClassName, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={cn(className, "pr-10")}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((value) => !value)}
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors",
          toggleClassName,
        )}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
