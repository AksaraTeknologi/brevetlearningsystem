import { Table } from "@tanstack/react-table";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
}

const navBtn =
    "grid size-9 shrink-0 place-items-center rounded-lg text-brand-900 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35 dark:text-white dark:hover:bg-white/10";

/** Nomor halaman yang ditampilkan: maks. 5 di sekitar halaman aktif. */
function pageWindow(current: number, total: number) {
    const size = Math.min(5, total);
    let start = Math.max(0, current - Math.floor(size / 2));
    start = Math.min(start, Math.max(0, total - size));
    return Array.from({ length: size }, (_, i) => start + i);
}

/** Pagination tabel gaya Coretax (fungsi sama seperti sebelumnya). */
export function DataTablePagination<TData>({
    table,
}: DataTablePaginationProps<TData>) {
    const pageIndex = table.getState().pagination.pageIndex;
    const pageCount = Math.max(table.getPageCount(), 1);
    const pages = pageWindow(pageIndex, pageCount);

    return (
        <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-sm text-muted-foreground sm:text-left">
                {table.getFilteredSelectedRowModel().rows.length} dari{" "}
                {table.getFilteredRowModel().rows.length} baris dipilih.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <nav aria-label="Navigasi halaman" className="flex items-center gap-1">
                    <button
                        type="button"
                        className={cn(navBtn, "hidden sm:grid")}
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        aria-label="Halaman pertama"
                    >
                        <ChevronsLeft className="size-4" />
                    </button>
                    <button
                        type="button"
                        className={navBtn}
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        aria-label="Halaman sebelumnya"
                    >
                        <ChevronLeft className="size-4" />
                    </button>

                    {pages.map((p) => {
                        const active = p === pageIndex;
                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => table.setPageIndex(p)}
                                aria-label={`Halaman ${p + 1}`}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "grid h-9 min-w-9 shrink-0 place-items-center rounded-full px-2 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    active
                                        ? "bg-brand text-white shadow-sm dark:bg-highlight dark:text-highlight-foreground"
                                        : "text-brand-900 hover:bg-muted dark:text-white dark:hover:bg-white/10",
                                )}
                            >
                                {p + 1}
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        className={navBtn}
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        aria-label="Halaman berikutnya"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                    <button
                        type="button"
                        className={cn(navBtn, "hidden sm:grid")}
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                        aria-label="Halaman terakhir"
                    >
                        <ChevronsRight className="size-4" />
                    </button>
                </nav>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Baris</span>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => table.setPageSize(Number(value))}
                    >
                        <SelectTrigger className="h-9 w-[76px]" aria-label="Baris per halaman">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="whitespace-nowrap text-sm text-muted-foreground">
                        dari {pageCount} hal.
                    </span>
                </div>
            </div>
        </div>
    );
}
