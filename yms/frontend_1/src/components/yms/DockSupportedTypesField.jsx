import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import {
  RESERVED_CUSTOM_KEYWORD,
  normalizeCustomTypeLabel,
  isValidCustomTypeLabel,
  mergeDockTypes,
  splitDockTypes,
} from "../../utils/dockTypeSelectors";

const chipBtn =
  "px-2 py-1 rounded-sm text-[10px] font-semibold border transition";
const inputCls =
  "w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200";

/**
 * Standard multi-select + optional custom type chips (CUSTOM toggles custom input).
 */
export const DockSupportedTypesField = ({
  label,
  required,
  standardOptions,
  value = [],
  onChange,
  customInputLabel,
  testIdPrefix,
}) => {
  const { standard, custom } = splitDockTypes(value, standardOptions);
  const [showCustom, setShowCustom] = useState(custom.length > 0);
  const [customDraft, setCustomDraft] = useState("");

  const emit = (nextStandard, nextCustom) => {
    onChange(mergeDockTypes(nextStandard, nextCustom));
  };

  const toggleStandard = (opt) => {
    if (opt === RESERVED_CUSTOM_KEYWORD) {
      setShowCustom((v) => !v);
      return;
    }
    const next = standard.includes(opt)
      ? standard.filter((s) => s !== opt)
      : [...standard, opt];
    emit(next, custom);
  };

  const addCustom = () => {
    const code = normalizeCustomTypeLabel(customDraft);
    if (!isValidCustomTypeLabel(code)) return;
    if (custom.includes(code) || standard.includes(code)) {
      setCustomDraft("");
      return;
    }
    emit(standard, [...custom, code]);
    setCustomDraft("");
    setShowCustom(true);
  };

  const removeCustom = (code) => {
    emit(standard, custom.filter((c) => c !== code));
  };

  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {standardOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            data-testid={testIdPrefix ? `${testIdPrefix}-${opt.toLowerCase()}` : undefined}
            onClick={() => toggleStandard(opt)}
            className={`${chipBtn} ${
              standard.includes(opt)
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            {opt.replace(/_/g, " ")}
          </button>
        ))}
        <button
          type="button"
          data-testid={testIdPrefix ? `${testIdPrefix}-custom` : undefined}
          onClick={() => toggleStandard(RESERVED_CUSTOM_KEYWORD)}
          className={`${chipBtn} ${
            showCustom
              ? "bg-indigo-700 text-white border-indigo-700"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
          }`}
        >
          CUSTOM
        </button>
      </div>

      {custom.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {custom.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-semibold border border-indigo-200 bg-indigo-50 text-indigo-900"
            >
              {code}
              <button
                type="button"
                aria-label={`Remove ${code}`}
                onClick={() => removeCustom(code)}
                className="text-indigo-600 hover:text-indigo-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {showCustom && (
        <div className="mt-2 space-y-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            {customInputLabel}
          </div>
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              placeholder="e.g. Refrigerated Trailer"
              data-testid={testIdPrefix ? `${testIdPrefix}-custom-input` : undefined}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!isValidCustomTypeLabel(customDraft)}
              className="shrink-0 px-3 py-2 border border-slate-300 rounded-md text-xs font-semibold disabled:opacity-40 inline-flex items-center gap-1"
              data-testid={testIdPrefix ? `${testIdPrefix}-custom-add` : undefined}
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
      )}
    </label>
  );
};

export default DockSupportedTypesField;
