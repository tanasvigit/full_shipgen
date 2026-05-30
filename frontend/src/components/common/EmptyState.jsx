import { Button } from "@/components/ui/button";

export default function EmptyState({
  title = "Nothing here yet",
  description,
  actionLabel,
  onAction,
  testId = "empty-state",
  icon: Icon,
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-14 px-6 border border-dashed border-black/[0.12] rounded-md bg-white/60"
      data-testid={testId}
    >
      {Icon && (
        <div className="h-12 w-12 rounded-md bg-[#F5F6F8] border border-black/[0.08] grid place-items-center mb-4 text-[#4B5563]">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="font-display font-semibold text-[#0A0E1A]">{title}</h3>
      {description && <p className="text-sm text-[#4B5563] mt-2 max-w-md">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4 bg-[#0066FF] hover:bg-[#0040CC]" data-testid={`${testId}-action`}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
