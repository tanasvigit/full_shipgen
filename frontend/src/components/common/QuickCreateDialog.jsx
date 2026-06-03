import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

/**
 * Reusable create-record dialog driven by a `fields` schema.
 *
 * fields = [{
 *   key,           // state key
 *   label,         // visible label
 *   type?,         // text | email | number | textarea | select  (default text)
 *   placeholder?,
 *   required?,
 *   options?,      // [{ value, label }] when type=select
 *   defaultValue?,
 *   col?,          // "full" (default) or "half" — pair half+half on same row
 * }]
 */
export default function QuickCreateDialog({
    open,
    onOpenChange,
    title,
    description,
    icon: Icon = Plus,
    fields,
    submitLabel = "Create",
    busyLabel = "Saving…",
    onSubmit,
    testid = "quick-create-dialog",
}) {
    const [values, setValues] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open) {
            const defaults = {};
            fields.forEach((f) => {
                defaults[f.key] =
                    f.defaultValue ??
                    (f.type === "select" ? f.options?.[0]?.value || "" : "");
            });
            setValues(defaults);
            setError(null);
            setBusy(false);
        }
    }, [open, fields]);

    function setField(key, v) {
        setValues((prev) => ({ ...prev, [key]: v }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        const missing = fields.find(
            (f) => f.required && !String(values[f.key] ?? "").trim(),
        );
        if (missing) {
            setError(`${missing.label} is required`);
            toast.error(`${missing.label} is required`);
            return;
        }
        setBusy(true);
        try {
            const result = onSubmit?.(values);
            requestAnimationFrame(() => {
                Promise.resolve(result)
                    .then((meta) => {
                        setBusy(false);
                        onOpenChange(false);
                        toast.success(meta?.toast || `${title} successful`);
                    })
                    .catch((err) => {
                        setBusy(false);
                        const msg =
                            err?.friendlyMessage ||
                            err?.response?.data?.errors?.[0] ||
                            err?.message ||
                            "Something went wrong";
                        setError(msg);
                        toast.error(msg);
                    });
            });
        } catch (err) {
            setBusy(false);
            setError(err?.message || "Something went wrong");
        }
    }

    // Group fields into rows: consecutive "half" fields pair up
    const rows = [];
    let i = 0;
    while (i < fields.length) {
        const f = fields[i];
        if (f.col === "half" && fields[i + 1]?.col === "half") {
            rows.push([f, fields[i + 1]]);
            i += 2;
        } else {
            rows.push([f]);
            i += 1;
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white border-black/[0.08] max-w-lg" data-testid={testid}>
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-black tracking-tight text-[#0A0E1A] flex items-center gap-2">
                        <span className="h-8 w-8 grid place-items-center rounded-lg bg-[#0066FF]/10 text-[#0066FF]">
                            <Icon className="h-4 w-4" />
                        </span>
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-[#374151]">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {rows.map((row, ri) => (
                        <div
                            key={ri}
                            className={row.length === 2 ? "grid grid-cols-2 gap-3" : ""}
                        >
                            {row.map((f) => (
                                <Field
                                    key={f.key}
                                    field={f}
                                    value={values[f.key] ?? ""}
                                    onChange={(v) => setField(f.key, v)}
                                    autoFocus={f === fields[0]}
                                />
                            ))}
                        </div>
                    ))}

                    {error && (
                        <div className="text-xs text-[#DC2626] bg-[#DC2626]/[0.06] border border-[#DC2626]/20 rounded-lg px-3.5 py-2.5 font-mono" data-testid={`${testid}-error`}>
                            {error}
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="bg-white border-black/[0.08] hover:bg-[#F5F6F8] text-[#374151] h-10 rounded-lg"
                            data-testid={`${testid}-cancel`}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={busy}
                            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)] min-w-[140px]"
                            data-testid={`${testid}-submit`}
                        >
                            {busy ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> {busyLabel}
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-1.5" /> {submitLabel}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({ field, value, onChange, autoFocus }) {
    const cls =
        "h-11 bg-[#F5F6F8] border-black/[0.08] focus-visible:border-[#0066FF] focus-visible:ring-2 focus-visible:ring-[#0066FF]/25 text-[#0A0E1A]";
    if (field.type === "textarea") {
        return (
            <div className="space-y-1.5">
                <Label className="overline">{field.label}{field.required && " *"}</Label>
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows || 3}
                    className="bg-[#F5F6F8] border-black/[0.08] focus-visible:border-[#0066FF] focus-visible:ring-2 focus-visible:ring-[#0066FF]/25 text-[#0A0E1A]"
                    data-testid={`field-${field.key}`}
                    autoFocus={autoFocus}
                />
            </div>
        );
    }
    if (field.type === "select") {
        return (
            <div className="space-y-1.5">
                <Label className="overline">{field.label}{field.required && " *"}</Label>
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className={cls} data-testid={`field-${field.key}`}>
                        <SelectValue placeholder={field.placeholder || "Choose…"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-black/[0.08]">
                        {(field.options || []).map((o) => (
                            <SelectItem
                                key={String(o.value)}
                                value={String(o.value)}
                                className="focus:bg-[#F5F6F8]"
                            >
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    }
    return (
        <div className="space-y-1.5">
            <Label htmlFor={`field-${field.key}`} className="overline">
                {field.label}{field.required && " *"}
            </Label>
            <Input
                id={`field-${field.key}`}
                type={field.type || "text"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step}
                className={cls + (field.type === "number" ? " font-mono" : "")}
                data-testid={`field-${field.key}`}
                autoFocus={autoFocus}
            />
        </div>
    );
}
