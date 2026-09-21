import { useMemo, useState } from "react";
import {
  type ColumnDef, type SortingState, type VisibilityState, flexRender, getCoreRowModel,
  getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  initialSort?: SortingState;
  toolbar?: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export function DataTable<T>({ data, columns, searchable, searchPlaceholder = "Search…", pageSize = 25, onRowClick, initialSort = [], toolbar, className, maxHeight = "calc(100vh - 220px)" }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSort);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data, columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const hideableCols = useMemo(() => table.getAllLeafColumns().filter((c) => c.getCanHide()), [table]);

  return (
    <div className={cn("panel flex flex-col min-w-0", className)}>
      <div className="flex items-center gap-2 px-2 h-9 border-b shrink-0">
        {searchable && (
          <input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={searchPlaceholder}
            className="h-6 w-48 bg-surface-2 border border-border px-2 text-[11px] text-text-1 placeholder:text-text-3 outline-none focus:border-primary/60 rounded-sm" />
        )}
        {toolbar}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-text-3">
          <span className="num">{total.toLocaleString()} rows</span>
          <Popover>
            <PopoverTrigger className="inline-flex items-center gap-1 hover:text-text-1 transition-colors"><Columns3 className="size-3" /> Columns</PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-2 bg-popover border-border max-h-80 overflow-auto">
              {hideableCols.map((c) => (
                <label key={c.id} className="flex items-center gap-2 py-0.5 text-[11px] text-text-2 hover:text-text-1 cursor-pointer">
                  <input type="checkbox" checked={c.getIsVisible()} onChange={c.getToggleVisibilityHandler()} className="accent-primary" />
                  {typeof c.columnDef.header === "string" ? c.columnDef.header : c.id}
                </label>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-[11.5px] border-collapse">
          <thead className="sticky top-0 z-10 bg-surface-1">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b">
                {hg.headers.map((h) => {
                  const align = (h.column.columnDef.meta as any)?.align ?? "right";
                  const sorted = h.column.getIsSorted();
                  return (
                    <th key={h.id} onClick={h.column.getToggleSortingHandler()}
                      className={cn("label-xs font-medium px-2 h-7 whitespace-nowrap select-none", h.column.getCanSort() && "cursor-pointer hover:text-text-1", align === "left" ? "text-left" : "text-right", sorted && "text-text-1")}>
                      <span className="inline-flex items-center gap-0.5">
                        {align === "right" && sorted && (sorted === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {align === "left" && sorted && (sorted === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} onClick={() => onRowClick?.(row.original)} className={cn("border-b border-border/60 row-hover", onRowClick && "cursor-pointer")}>
                {row.getVisibleCells().map((cell) => {
                  const meta = (cell.column.columnDef.meta as any) ?? {};
                  return (
                    <td key={cell.id} className={cn("px-2 h-7 whitespace-nowrap", meta.align === "left" ? "text-left" : "text-right num", meta.className)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr><td colSpan={columns.length} className="text-center text-text-3 py-8 text-[11px] uppercase tracking-wide">No rows match</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 px-2 h-8 border-t text-[10px] text-text-3 shrink-0">
          <span className="num">Page {pageIndex + 1} / {pageCount}</span>
          <button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} className="px-1.5 border border-border hover:text-text-1 disabled:opacity-40 rounded-sm">Prev</button>
          <button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} className="px-1.5 border border-border hover:text-text-1 disabled:opacity-40 rounded-sm">Next</button>
        </div>
      )}
    </div>
  );
}
