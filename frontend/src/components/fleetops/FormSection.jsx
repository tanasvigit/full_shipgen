import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
  className,
  testId,
}) {
  if (!collapsible) {
    return (
      <section className={cn("bg-white border border-black/[0.08] rounded-md p-5 space-y-4", className)} data-testid={testId}>
        <div>
          <h3 className="font-display font-bold text-sm tracking-tight text-[#0A0E1A]">{title}</h3>
          {description && <p className="text-xs text-[#4B5563] mt-1">{description}</p>}
        </div>
        {children}
      </section>
    );
  }

  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("bg-white border border-black/[0.08] rounded-md", className)} data-testid={testId}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-[#F5F6F8]/80 rounded-t-md">
        <div>
          <h3 className="font-display font-bold text-sm tracking-tight text-[#0A0E1A]">{title}</h3>
          {description && <p className="text-xs text-[#4B5563] mt-0.5">{description}</p>}
        </div>
        <ChevronDown className="h-4 w-4 text-[#4B5563] shrink-0" />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-5 pb-5 space-y-4 border-t border-black/[0.06]">{children}</CollapsibleContent>
    </Collapsible>
  );
}
