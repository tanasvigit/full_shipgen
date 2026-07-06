import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const PasswordInput = React.forwardRef(({ className, toggleClassName, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        ref={ref}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((value) => !value)}
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center text-[#4B5563] hover:text-[#0A0E1A] hover:bg-black/[0.05] rounded-md transition-colors",
          toggleClassName,
        )}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
