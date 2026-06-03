import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

function notifiableId(notifiable) {
  return notifiable?.value ?? notifiable?.key ?? "";
}

export default function NotificationNotifiableMultiSelect({
  options = [],
  value = [],
  onChange,
  disabled = false,
  placeholder = "Select notifiables…",
  testId,
}) {
  const [open, setOpen] = useState(false);
  const selectedIds = useMemo(() => new Set(value.map(notifiableId).filter(Boolean)), [value]);

  const allSelected =
    options.length > 0 && options.every((n) => selectedIds.has(notifiableId(n)));
  const someSelected = value.length > 0 && !allSelected;
  const selectAllState = allSelected ? true : someSelected ? "indeterminate" : false;

  const handleSelectAll = () => {
    if (allSelected) {
      onChange([]);
      return;
    }
    onChange([...options]);
  };

  const toggle = (notifiable) => {
    const id = notifiableId(notifiable);
    if (!id) return;
    if (selectedIds.has(id)) {
      onChange(value.filter((n) => notifiableId(n) !== id));
    } else {
      onChange([...value, notifiable]);
    }
  };

  const label =
    value.length === 0
      ? placeholder
      : value.map((n) => n.label || n.value).join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-between font-normal h-9 text-left"
          data-testid={testId}
        >
          <span className="truncate text-sm">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 max-h-64 overflow-y-auto" align="start">
        {options.length === 0 ? (
          <p className="text-xs text-[#6B7280] px-2 py-1">No notifiables available</p>
        ) : (
          <>
            <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F5F6F8] cursor-pointer text-sm font-medium border-b border-black/[0.06] mb-1 pb-2">
              <Checkbox
                checked={selectAllState}
                onCheckedChange={handleSelectAll}
                data-testid={testId ? `${testId}-select-all` : undefined}
              />
              <span>Select all</span>
              <span className="ml-auto text-[10px] font-normal text-[#6B7280] tabular-nums">
                {value.length}/{options.length}
              </span>
            </label>
            <ul className="space-y-1">
            {options.map((notifiable) => {
              const id = notifiableId(notifiable);
              return (
                <li key={id}>
                  <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F5F6F8] cursor-pointer text-sm">
                    <Checkbox
                      checked={selectedIds.has(id)}
                      onCheckedChange={() => toggle(notifiable)}
                      data-testid={testId ? `${testId}-option-${id}` : undefined}
                    />
                    <span className="truncate">{notifiable.label || id}</span>
                  </label>
                </li>
              );
            })}
            </ul>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
