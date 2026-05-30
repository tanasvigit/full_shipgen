import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractStatusesFromFlow, statusColor } from "@/lib/fleetops/orderConfig";
import { GripVertical, Plus, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_ICONS = ["📦", "🚚", "📍", "✅", "❌", "⏱️"];

export default function OrderConfigWorkflowBuilder({
  flow,
  statusColors = {},
  onChange,
  onStatusColorsChange,
  disabled,
}) {
  const activities = flow?.activities || [];

  const updateActivities = (next) => {
    onChange?.({ ...flow, activities: next });
  };

  const move = (from, to) => {
    if (to < 0 || to >= activities.length) return;
    const next = [...activities];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateActivities(next);
  };

  const patchNode = (index, patch) => {
    const next = activities.map((node, i) => (i === index ? { ...node, ...patch } : node));
    updateActivities(next);
  };

  const addStep = () => {
    const code = `step_${activities.length + 1}`;
    updateActivities([
      ...activities,
      {
        code,
        status: code,
        activities: [],
        logic: [],
        events: [],
      },
    ]);
  };

  const removeStep = (index) => {
    updateActivities(activities.filter((_, i) => i !== index));
  };

  const previewStatuses = useMemo(() => extractStatusesFromFlow({ activities }), [activities]);

  return (
    <div className="space-y-4" data-testid="order-config-workflow-builder">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="overline">Workflow sequence</div>
          <p className="text-xs text-[#4B5563] mt-1">Drag steps to reorder. Each step maps to an order status.</p>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={addStep} data-testid="workflow-add-step">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add step
        </Button>
      </div>

      <div className="space-y-2">
        {activities.map((node, index) => {
          const color = statusColors[node.status] || statusColor(node.status);
          const nextCode = activities[index + 1]?.code;
          return (
            <div key={`${node.code}-${index}`} className="flex items-stretch gap-2">
              <div
                className={cn(
                  "flex-1 rounded-lg border bg-white p-4 shadow-sm transition-shadow",
                  "border-black/[0.08] hover:border-[#0066FF]/30",
                )}
                data-testid={`workflow-step-${index}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      type="button"
                      className="text-[#9CA3AF] hover:text-[#374151] disabled:opacity-30"
                      disabled={disabled || index === 0}
                      onClick={() => move(index, index - 1)}
                      aria-label="Move up"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-[#6B7280]">Activity code</Label>
                      <Input
                        value={node.code || ""}
                        disabled={disabled}
                        onChange={(e) => patchNode(index, { code: e.target.value })}
                        className="h-9 font-mono text-sm bg-[#F5F6F8]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-[#6B7280]">Status</Label>
                      <Input
                        value={node.status || ""}
                        disabled={disabled}
                        onChange={(e) => patchNode(index, { status: e.target.value })}
                        className="h-9 font-mono text-sm bg-[#F5F6F8]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-[#6B7280]">Color</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={color}
                          disabled={disabled}
                          onChange={(e) =>
                            onStatusColorsChange?.({
                              ...statusColors,
                              [node.status]: e.target.value,
                            })
                          }
                          className="h-9 w-12 rounded border border-black/[0.08] cursor-pointer"
                        />
                        <select
                          className="h-9 flex-1 rounded-md border border-black/[0.08] bg-[#F5F6F8] text-sm px-2"
                          disabled={disabled}
                          value={PRESET_ICONS[0]}
                          onChange={() => {}}
                          aria-hidden
                        >
                          {PRESET_ICONS.map((icon) => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <Label className="text-[10px] font-mono uppercase text-[#6B7280]">Next activities</Label>
                      <Input
                        value={(node.activities || []).join(", ")}
                        disabled={disabled}
                        placeholder="dispatched, started"
                        onChange={(e) =>
                          patchNode(index, {
                            activities: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className="h-9 text-sm bg-[#F5F6F8] font-mono"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-[#9CA3AF] hover:text-[#B91C1C]"
                    disabled={disabled || activities.length <= 1}
                    onClick={() => removeStep(index)}
                    data-testid={`workflow-remove-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {nextCode && (
                <div className="hidden md:flex items-center text-[#9CA3AF] px-1">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-dashed border-black/[0.12] bg-[#F5F6F8]/60 p-4">
        <div className="overline mb-2">Kanban preview</div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {previewStatuses.map((status) => (
            <div
              key={status}
              className="shrink-0 min-w-[100px] rounded-md border border-black/[0.08] bg-white px-3 py-2"
            >
              <div
                className="h-1 w-full rounded-full mb-2"
                style={{ background: statusColors[status] || statusColor(status) }}
              />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#374151]">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
