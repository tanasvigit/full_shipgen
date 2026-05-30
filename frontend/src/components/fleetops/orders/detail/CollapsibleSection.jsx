import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  testId,
  sticky = false,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`bg-white border border-black/[0.08] rounded-md overflow-hidden ${
        sticky ? "sticky top-4 z-10" : ""
      }`}
      data-testid={testId}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 border-b border-black/[0.08] text-left hover:bg-[#F9FAFB]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="overline">{title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="p-4">{children}</div>}
    </section>
  );
}
