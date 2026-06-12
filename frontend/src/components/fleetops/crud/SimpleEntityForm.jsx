import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const defaults = fields.reduce(
    (acc, f) => ({ ...acc, [f.name]: f.defaultValue ?? "" }),
    {},
  );
  const form = useForm({
    defaultValues: initialValues || defaults,
  });

  useEffect(() => {
    if (initialValues) form.reset(initialValues);
  }, [initialValues, form]);

  const validateValues = async () => {
    const values = { ...form.getValues() };
    for (const f of fields) {
      if (!values[f.name] && f.defaultValue) {
        values[f.name] = f.defaultValue;
      }
      if (f.required && !String(values[f.name] || "").trim()) {
        throw new Error(`${f.label} is required`);
      }
    }
    return values;
  };

  useImperativeHandle(ref, () => ({
    getValues: () => form.getValues(),
    validate: validateValues,
    submit: validateValues,
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
          ) : field.type === "select" ? (
            <Select
              value={form.watch(field.name) || field.defaultValue || ""}
              onValueChange={(value) => form.setValue(field.name, value, { shouldDirty: true })}
            >
              <SelectTrigger id={`${formId}-${field.name}`} data-testid={`field-${field.name}`}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {(field.options || []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
