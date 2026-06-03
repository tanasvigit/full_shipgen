import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatScalarForDisplay } from "@/lib/mappers";
import SectionLoaderOverlay from "@/components/loaders/overlays/SectionLoaderOverlay";
import { SearchLoader } from "@/components/loaders/indicators/LoadingIndicators";

/**
 * Lightweight data table for the Fleetbase console.
 * Columns: [{ key, header, render?, sortable?, className?, width? }]
 */
export default function DataTable({
    columns,
    data,
    rowKey = "id",
    onRowClick,
    searchKeys,
    pageSize = 10,
    emptyMessage = "No records found.",
    toolbarLeft,
    toolbarRight,
    testid = "data-table",
    loading = false,
    loadingMessage = "Loading records…",
    selectable = false,
    selectedKeys,
    onSelectedKeysChange,
    searchInputRef,
    serverPagination = null,
    searchValue: controlledSearch,
    onSearchChange,
    onSortChange,
}) {
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState(null);
    const [sortDir, setSortDir] = useState("asc");

    const searchTerm = controlledSearch != null ? controlledSearch : q;
    const setSearchTerm = (value) => {
        if (onSearchChange) onSearchChange(value);
        else setQ(value);
    };

    const activePage = serverPagination?.page ?? page;
    const setActivePage = (next) => {
        if (serverPagination?.onPageChange) serverPagination.onPageChange(next);
        else setPage(next);
    };

    const filtered = useMemo(() => {
        let rows = data;
        if (serverPagination) return rows;
        if (searchTerm && searchKeys && searchKeys.length) {
            const term = searchTerm.toLowerCase();
            rows = rows.filter((r) =>
                searchKeys.some((k) => {
                    const v = k.split(".").reduce((o, kk) => (o == null ? o : o[kk]), r);
                    return String(v ?? "").toLowerCase().includes(term);
                }),
            );
        }
        if (sortBy) {
            rows = [...rows].sort((a, b) => {
                const av = sortBy.split(".").reduce((o, k) => (o == null ? o : o[k]), a);
                const bv = sortBy.split(".").reduce((o, k) => (o == null ? o : o[k]), b);
                if (av == null) return 1;
                if (bv == null) return -1;
                if (av < bv) return sortDir === "asc" ? -1 : 1;
                if (av > bv) return sortDir === "asc" ? 1 : -1;
                return 0;
            });
        }
        return rows;
    }, [data, searchTerm, searchKeys, sortBy, sortDir, serverPagination]);

    const totalPages = serverPagination
        ? Math.max(1, serverPagination.lastPage || 1)
        : Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = serverPagination
        ? filtered
        : filtered.slice((activePage - 1) * pageSize, activePage * pageSize);

    const selectedSet = selectedKeys instanceof Set ? selectedKeys : new Set(selectedKeys || []);
    const pageKeys = current.map((row) => row[rowKey]).filter(Boolean);
    const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selectedSet.has(k));

    const toggleRow = (key, checked) => {
      if (!onSelectedKeysChange) return;
      const next = new Set(selectedSet);
      if (checked) next.add(key);
      else next.delete(key);
      onSelectedKeysChange(next);
    };

    const togglePage = () => {
      if (!onSelectedKeysChange) return;
      const next = new Set(selectedSet);
      if (allPageSelected) pageKeys.forEach((k) => next.delete(k));
      else pageKeys.forEach((k) => next.add(k));
      onSelectedKeysChange(next);
    };

    function toggleSort(col) {
        if (!col.sortable) return;
        const nextDir = sortBy === col.key && sortDir === "asc" ? "desc" : "asc";
        const nextKey = sortBy === col.key ? col.key : col.key;
        if (sortBy === col.key) {
            setSortDir(nextDir);
        } else {
            setSortBy(col.key);
            setSortDir("asc");
        }
        onSortChange?.(nextKey, sortBy === col.key ? nextDir : "asc");
    }

    return (
        <div className="border border-black/[0.06] rounded-xl bg-white overflow-hidden" data-testid={testid}>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/[0.06] flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                    {searchKeys && searchKeys.length > 0 && (
                        <div className="relative w-full max-w-xs" data-testid={`${testid}-search-wrap`}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4B5563]" strokeWidth={1.75} />
                            <Input
                                ref={searchInputRef}
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setActivePage(1); }}
                                placeholder="Search…"
                                className="pl-9 h-9 bg-[#F5F6F8] border-black/[0.08] focus-visible:border-cyan-accent/60 focus-visible:ring-1 focus-visible:ring-cyan-accent text-sm rounded-lg"
                                data-testid={`${testid}-search`}
                                aria-busy={loading}
                                disabled={loading}
                            />
                            {loading && <SearchLoader className="absolute right-3 top-1/2 -translate-y-1/2" />}
                        </div>
                    )}
                    {toolbarLeft}
                </div>
                <div className="flex items-center gap-2">{toolbarRight}</div>
            </div>
            <div className="relative overflow-x-auto" data-testid={`${testid}-body`}>
                <SectionLoaderOverlay
                    loading={loading}
                    message={loadingMessage}
                    testId={`${testid}-loader-overlay`}
                    compact
                />
                <table className="w-full text-sm">
                    <thead className="bg-[#F5F6F8]/50">
                        <tr>
                            {selectable && (
                                <th className="w-10 px-3 py-3 border-b border-black/[0.06]">
                                    <input
                                        type="checkbox"
                                        checked={allPageSelected}
                                        onChange={togglePage}
                                        aria-label="Select all on page"
                                        data-testid={`${testid}-select-all`}
                                        className="rounded border-black/[0.2]"
                                    />
                                </th>
                            )}
                            {columns.map((c) => (
                                <th
                                    key={c.key}
                                    onClick={() => toggleSort(c)}
                                    className={cn(
                                        "text-left px-4 py-3 text-[10px] uppercase tracking-[0.22em] font-mono font-semibold text-[#4B5563] border-b border-black/[0.06] whitespace-nowrap",
                                        c.sortable && "cursor-pointer hover:text-[#0A0E1A] transition-colors select-none",
                                        c.className,
                                    )}
                                    style={c.width ? { width: c.width } : undefined}
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        {c.header}
                                        {c.sortable && (
                                            sortBy === c.key ? (
                                                sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-cyan-accent" /> : <ChevronDown className="h-3 w-3 text-cyan-accent" />
                                            ) : (
                                                <ChevronsUpDown className="h-3 w-3 opacity-40" />
                                            )
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {current.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="text-center py-14 text-sm text-[#4B5563]">
                                    <div className="font-mono text-[11px] tracking-[0.22em] uppercase">{emptyMessage}</div>
                                </td>
                            </tr>
                        ) : (
                            current.map((row) => (
                                <tr
                                    key={row[rowKey]}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    data-testid={`${testid}-row-${row[rowKey]}`}
                                    className={cn(
                                        "border-b border-white/[0.04] hover:bg-black/[0.03] transition-colors",
                                        onRowClick && "cursor-pointer",
                                        selectedSet.has(row[rowKey]) && "bg-blue-500/[0.04]",
                                    )}
                                >
                                    {selectable && (
                                        <td
                                            className="px-3 py-3.5 align-middle"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedSet.has(row[rowKey])}
                                                onChange={(e) => toggleRow(row[rowKey], e.target.checked)}
                                                aria-label="Select row"
                                                data-testid={`${testid}-select-${row[rowKey]}`}
                                                className="rounded border-black/[0.2]"
                                            />
                                        </td>
                                    )}
                                    {columns.map((c) => (
                                        <td key={c.key} className={cn("px-4 py-3.5 text-[13px] text-[#0A0E1A] align-middle", c.className)}>
                                            {c.render
                                                ? c.render(row)
                                                : formatScalarForDisplay(
                                                      c.key.split(".").reduce((o, k) => (o == null ? o : o[k]), row),
                                                      "—",
                                                  )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-black/[0.06] text-xs text-[#4B5563] font-mono">
                <div className="tracking-tight">
                    Showing <span className="text-[#0A0E1A]">{current.length}</span> of{" "}
                    <span className="text-[#0A0E1A]">{serverPagination?.total ?? filtered.length}</span>{" "}
                    {!serverPagination && filtered.length !== data.length && (
                        <span className="text-[#4B5563]">(filtered from {data.length})</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        disabled={activePage === 1}
                        onClick={() => setActivePage(Math.max(1, activePage - 1))}
                        className="px-2.5 py-1 border border-black/[0.08] rounded-md hover:bg-black/[0.05] hover:border-black/[0.15] hover:text-[#0A0E1A] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        data-testid={`${testid}-prev`}
                    >
                        Prev
                    </button>
                    <span className="text-[#1F2937]">
                        Page {activePage} / {totalPages}
                    </span>
                    <button
                        disabled={activePage === totalPages}
                        onClick={() => setActivePage(Math.min(totalPages, activePage + 1))}
                        className="px-2.5 py-1 border border-black/[0.08] rounded-md hover:bg-black/[0.05] hover:border-black/[0.15] hover:text-[#0A0E1A] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        data-testid={`${testid}-next`}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
