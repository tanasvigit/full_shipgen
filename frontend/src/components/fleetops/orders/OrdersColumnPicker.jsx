import { ORDERS_TABLE_COLUMNS } from "@/lib/fleetops/ordersListColumns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Columns2 } from "lucide-react";

export default function OrdersColumnPicker({ hiddenColumns, onHiddenColumnsChange }) {
  const toggle = (key) => {
    const next = new Set(hiddenColumns);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onHiddenColumnsChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" data-testid="orders-columns-trigger">
          <Columns2 className="h-3.5 w-3.5 mr-1" /> Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" data-testid="orders-columns-popover">
        <div className="text-[10px] font-mono uppercase text-[#6B7280] px-2 py-1">Visible columns</div>
        <div className="max-h-64 overflow-y-auto">
          {ORDERS_TABLE_COLUMNS.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-[#F5F6F8] rounded"
            >
              <Checkbox
                checked={!hiddenColumns.has(col.key)}
                onCheckedChange={() => toggle(col.key)}
                data-testid={`orders-column-toggle-${col.key}`}
              />
              <span>{col.label || col.key}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
