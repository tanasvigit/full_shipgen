import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import EntityAsyncSelect from "@/components/fleetops/EntityAsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shiftFormSchema } from "@/lib/fleetops/schemas";
import { SCHEDULE_DAYS } from "@/lib/fleetops/constants";
import { useFormHandle } from "./formUtils";

const defaultValues = {
  driverId: "",
  day: "Mon",
  start: 8,
  end: 17,
  notes: "",
};

const ShiftForm = forwardRef(function ShiftForm({ formId, initialValues, driverOptions = [] }, ref) {
  const methods = useForm({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });
  const { register, watch, setValue, formState: { errors } } = methods;
  useFormHandle(ref, methods);

  return (
    <div id={formId} className="space-y-4" data-testid="shift-form">
      <EntityAsyncSelect
        label="Driver"
        value={watch("driverId")}
        onChange={(v) => setValue("driverId", v)}
        options={driverOptions}
        required
        testId="shift-field-driver"
      />
      {errors.driverId && <p className="text-xs text-[#B91C1C]">{errors.driverId.message}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase text-[#374151]">Day</Label>
          <Select value={watch("day")} onValueChange={(v) => setValue("day", v)}>
            <SelectTrigger className="bg-[#F5F6F8] border-black/[0.08]" data-testid="shift-field-day">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULE_DAYS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase text-[#374151]">Start hour</Label>
          <Input type="number" min={0} max={23} {...register("start")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="shift-field-start" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase text-[#374151]">End hour</Label>
          <Input type="number" min={0} max={23} {...register("end")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="shift-field-end" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-mono uppercase text-[#374151]">Notes</Label>
        <Textarea {...register("notes")} rows={2} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="shift-field-notes" />
      </div>
    </div>
  );
});

export default ShiftForm;
