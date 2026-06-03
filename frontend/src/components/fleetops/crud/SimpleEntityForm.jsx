import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function valuesFromApi(raw = {}, fields = []) {
  const out = {};
  for (const f of fields) {
    const snake = f.name;
    const camel = snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[snake] = raw[snake] ?? raw[camel] ?? "";
  }
  return out;
}

const SimpleEntityForm = forwardRef(function SimpleEntityForm(
  { formId, fields = [], initialValues, mode = "create" },
  ref,
) {
  const defaults = fields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {});
  const form = useForm({
    defaultValues: initialValues || defaults,
  });

  useEffect(() => {
    if (initialValues) form.reset(initialValues);
  }, [initialValues, form]);

  useImperativeHandle(ref, () => ({
    getValues: () => form.getValues(),
    validate: async () => {
      const values = form.getValues();
      for (const f of fields) {
        if (f.required && !String(values[f.name] || "").trim()) {
          throw new Error(`${f.label} is required`);
        }
      }
      return values;
    },
  }));

  return (
    <div id={formId} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={`${formId}-${field.name}`}>
            {field.label}
            {field.required ? " *" : ""}
          </Label>
          {field.type === "textarea" ? (
            <Textarea
              id={`${formId}-${field.name}`}
              {...form.register(field.name)}
              data-testid={`field-${field.name}`}
              rows={3}
            />
          ) : (
            <Input
              id={`${formId}-${field.name}`}
              type={field.type || "text"}
              {...form.register(field.name)}
              data-testid={`field-${field.name}`}
            />
          )}
        </div>
      ))}
      {mode === "edit" && (
        <p className="text-xs text-[#4B5563]">Updates sync to the FleetOps API when available.</p>
      )}
    </div>
  );
});

export { valuesFromApi };
export default SimpleEntityForm;
