import { Check, Minus } from "lucide-react";
import {
  PERM_MATRIX_ACTIONS,
  buildPermissionMatrixActions,
  buildPermissionMatrixModules,
  findMatrixPermission,
} from "@/lib/iam/permissionMatrix";
import { mapPermission } from "@/lib/mappers";

/**
 * Reusable permission matrix (roles, policies, users).
 */
export default function PermissionMatrixPanel({
  permissionRows = [],
  selectedIds,
  onToggle,
  disabled = false,
  testIdPrefix = "perm",
}) {
  const permsMapped = permissionRows.map(mapPermission);
  const modules = buildPermissionMatrixModules(permsMapped);
  const tableActions = buildPermissionMatrixActions(permsMapped);
  const grantIds = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);

  if (!permsMapped.length) {
    return <div className="p-4 text-sm text-[#4B5563]">No permission catalog loaded.</div>;
  }

  return (
    <div className="overflow-x-auto" data-testid={`${testIdPrefix}-matrix`}>
      <table className="w-full text-sm">
        <thead className="bg-[#F9FAFB]">
          <tr>
            <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563] border-b border-black/[0.08] sticky left-0 bg-[#F9FAFB]">
              Module
            </th>
            {tableActions.map((a) => (
              <th
                key={a}
                className="text-center px-2 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563] border-b border-black/[0.08]"
              >
                {a}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((mod) => (
            <tr key={mod} className="border-b border-black/[0.06]">
              <td className="px-3 py-2 text-sm font-medium sticky left-0 bg-white">{mod}</td>
              {tableActions.map((a) => {
                const p = findMatrixPermission(permsMapped, mod, a);
                const granted = p?.id && grantIds.has(String(p.id));
                const supported = Boolean(p);
                return (
                  <td key={`${mod}-${a}`} className="px-2 py-2 text-center">
                    {!supported ? (
                      <Minus className="h-3 w-3 text-[#9CA3AF] mx-auto" />
                    ) : (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onToggle?.(p)}
                        className={`h-5 w-5 mx-auto grid place-items-center rounded-sm border ${
                          granted ? "bg-emerald-500/10 border-emerald-500/40" : "border-black/[0.08]"
                        } disabled:opacity-40`}
                        data-testid={`${testIdPrefix}-toggle-${mod}-${a}`}
                      >
                        {granted && <Check className="h-3 w-3 text-[#15803D]" strokeWidth={2.5} />}
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { PERM_MATRIX_ACTIONS };
