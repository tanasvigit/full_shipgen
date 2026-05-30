import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

export default function EntityAsyncSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  required,
  disabled,
  testId,
  allowClear,
  searchPlaceholder = "Filter…",
}) {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, filter]);

  return (
    <div className="space-y-1.5" data-testid={testId}>
      {label && (
        <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">
          {label}
          {required && <span className="text-[#B91C1C] ml-0.5">*</span>}
        </Label>
      )}
      {options.length > 8 && (
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 text-xs bg-[#F5F6F8] border-black/[0.08] mb-1"
          data-testid={testId ? `${testId}-search` : undefined}
        />
      )}
      <Select
        value={value || (allowClear ? "__none__" : undefined)}
        onValueChange={(v) => onChange(v === "__none__" ? "" : v)}
        disabled={disabled}
      >
        <SelectTrigger className="bg-[#F5F6F8] border-black/[0.08] h-10" data-testid={testId ? `${testId}-trigger` : undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowClear && <SelectItem value="__none__">— None —</SelectItem>}
          {filtered.length === 0 ? (
            <SelectItem value="__empty__" disabled className="text-muted-foreground pointer-events-none">
              No options available
            </SelectItem>
          ) : (
            filtered.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
