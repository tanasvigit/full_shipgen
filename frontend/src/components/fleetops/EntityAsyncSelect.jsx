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

function resolveSelectValue(value, options = []) {
  const needle = String(value ?? "").trim();
  if (!needle) return "";
  if (options.some((o) => o.id === needle)) return needle;
  const match = options.find((o) => o.uuid === needle || o.publicId === needle);
  return match?.id || needle;
}

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
  loading = false,
  emptyMessage = "No options available",
  alwaysShowSearch = false,
}) {
  const [filter, setFilter] = useState("");
  const displayValue = useMemo(() => resolveSelectValue(value, options), [value, options]);
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, filter]);
  const pinnedOption = useMemo(
    () => (displayValue ? options.find((o) => o.id === displayValue) : null),
    [displayValue, options],
  );
  const visibleOptions = useMemo(() => {
    if (!pinnedOption || filtered.some((o) => o.id === pinnedOption.id)) {
      return filtered;
    }
    return [pinnedOption, ...filtered];
  }, [filtered, pinnedOption]);

  const noneSentinel = "__none__";
  const emptySentinel = "__empty__";
  const selectValue = displayValue || (allowClear ? noneSentinel : emptySentinel);

  return (
    <div className="space-y-1.5" data-testid={testId}>
      {label && (
        <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">
          {label}
          {required && <span className="text-[#B91C1C] ml-0.5">*</span>}
        </Label>
      )}
      {alwaysShowSearch || options.length > 8 ? (
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 text-xs bg-[#F5F6F8] border-black/[0.08] mb-1"
          data-testid={testId ? `${testId}-search` : undefined}
          disabled={disabled || loading}
        />
      ) : null}
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (v === noneSentinel || v === emptySentinel) {
            onChange("");
            return;
          }
          onChange(v);
        }}
        disabled={disabled || loading}
      >
        <SelectTrigger className="bg-[#F5F6F8] border-black/[0.08] h-10" data-testid={testId ? `${testId}-trigger` : undefined}>
          <SelectValue placeholder={loading ? "Loading…" : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowClear && <SelectItem value={noneSentinel}>— None —</SelectItem>}
          {!displayValue && !allowClear && (
            <SelectItem value={emptySentinel} disabled className="text-muted-foreground pointer-events-none">
              {loading ? "Loading options…" : placeholder}
            </SelectItem>
          )}
          {visibleOptions.length === 0 && displayValue ? (
            <SelectItem value={emptySentinel} disabled className="text-muted-foreground pointer-events-none">
              {loading ? "Loading options…" : emptyMessage}
            </SelectItem>
          ) : (
            visibleOptions.map((opt) => (
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
