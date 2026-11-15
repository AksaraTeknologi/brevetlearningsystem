"use client";

/*
 * Pelengkap tabel bergaya Coretax, dipakai bersama oleh semua data-table:
 *   - DataTableExport      : tombol ekspor CSV / Excel / PDF (baris terfilter & terurut,
 *                            atau hanya baris terpilih bila ada yang dicentang)
 *   - DataTableFilterToggle: tombol tampil/sembunyi baris filter per kolom
 *   - DataTableFilterRow   : baris input filter di bawah judul kolom
 *   - getColumnTitle       : judul kolom yang terbaca (dipakai juga oleh "Atur Kolom")
 */

import { Column, Table } from "@tanstack/react-table";
import {
    Download,
    FileSpreadsheet,
    FileText,
    FileType2,
    ListFilter,
} from "lucide-react";
import { isValidElement, useState } from "react";

import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Input } from "@/Components/ui/input";
import { TableHead, TableRow } from "@/Components/ui/table";
import { cn } from "@/lib/utils";

/* Kolom bantu yang tidak ikut diekspor / difilter */
const UTILITY_COLUMNS = new Set(["select", "actions", "action", "aksi"]);

function humanize(id: string) {
    const text = id.replace(/[._]+/g, " ").trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Judul kolom: meta.title → header berupa teks → prop `title` milik
 * <DataTableColumnHeader title="..."/> → id kolom yang dirapikan.
 */
export function getColumnTitle<TData>(
    column: Column<TData, unknown>,
    table: Table<TData>
): string {
    const def = column.columnDef;
    const meta = def.meta as { title?: string } | undefined;
    if (meta?.title) return meta.title;
    if (typeof def.header === "string") return def.header;
    if (typeof def.header === "function") {
        try {
            const header = table
                .getFlatHeaders()
                .find((h) => h.column.id === column.id);
            if (header) {
                const el = (def.header as (ctx: unknown) => unknown)(
                    header.getContext()
                );
                if (isValidElement(el)) {
                    const props = el.props as {
                        title?: unknown;
                        children?: unknown;
                    };
                    if (typeof props.title === "string") return props.title;
                    if (typeof props.children === "string")
                        return props.children;
                }
            }
        } catch {
            /* jatuh ke id kolom */
        }
    }
    return humanize(column.id);
}

function exportColumns<TData>(table: Table<TData>) {
    return table
        .getVisibleLeafColumns()
        .filter(
            (c) =>
                typeof c.accessorFn !== "undefined" &&
                !UTILITY_COLUMNS.has(c.id.toLowerCase())
        );
}

const pad2 = (n: number) => String(n).padStart(2, "0");
function formatDate(d: Date, withTime: boolean) {
    const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    return withTime ? `${date} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` : date;
}

function cellValue(value: unknown): string | number {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return value;
    if (value instanceof Date) return formatDate(value, false);
    /* Timestamp ISO dari Laravel (2026-11-15T01:21:59.000000Z) → waktu lokal */
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) return formatDate(d, true);
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

function buildMatrix<TData>(table: Table<TData>) {
    const columns = exportColumns(table);
    const selected = table.getSelectedRowModel().rows;
    const rows = selected.length
        ? selected
        : table.getPrePaginationRowModel().rows;
    const head = columns.map((c) => getColumnTitle(c, table));
    /* Kolom "No" biasanya dirender dari indeks baris, nilainya kosong → isi nomor urut */
    const isNumberCol = head.map((h) => /^no\.?$/i.test(h.trim()));
    const body = rows.map((row, i) =>
        columns.map((c, j) => {
            const v = cellValue(row.getValue(c.id));
            return isNumberCol[j] && v === "" ? i + 1 : v;
        })
    );
    return { head, body, count: rows.length, selected: selected.length > 0 };
}

function stamp() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(
        d.getHours()
    )}${p(d.getMinutes())}`;
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DataTableExport<TData>({
    table,
    fileName = "data",
    title,
}: {
    table: Table<TData>;
    fileName?: string;
    /** Judul di atas tabel PDF */
    title?: string;
}) {
    const [busy, setBusy] = useState(false);
    const selectedCount = table.getSelectedRowModel().rows.length;
    const totalCount = table.getPrePaginationRowModel().rows.length;
    const name = `${fileName}-${stamp()}`;

    const toCsv = () => {
        const { head, body } = buildMatrix(table);
        const esc = (v: string | number) => {
            const s = String(v);
            return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const csv = [head, ...body].map((r) => r.map(esc).join(",")).join("\r\n");
        // BOM agar Excel membaca UTF-8 dengan benar
        downloadBlob(
            new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }),
            `${name}.csv`
        );
    };

    const toExcel = async () => {
        const XLSX = await import("xlsx");
        const { head, body } = buildMatrix(table);
        const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
        ws["!cols"] = head.map((h, i) => ({
            wch: Math.min(
                40,
                Math.max(
                    h.length,
                    ...body.slice(0, 200).map((r) => String(r[i] ?? "").length)
                ) + 2
            ),
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, `${name}.xlsx`);
    };

    const toPdf = async () => {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
            import("jspdf"),
            import("jspdf-autotable"),
        ]);
        const { head, body } = buildMatrix(table);
        const doc = new jsPDF({
            orientation: head.length > 5 ? "landscape" : "portrait",
            unit: "pt",
            format: "a4",
        });
        doc.setFontSize(12);
        doc.setTextColor(13, 77, 64);
        doc.text(title ?? humanize(fileName.replace(/-/g, " ")), 40, 40);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
            `Brevet Learning System · dicetak ${new Date().toLocaleString("id-ID")}`,
            40,
            54
        );
        autoTable(doc, {
            head: [head],
            body: body.map((r) => r.map((v) => String(v))),
            startY: 66,
            margin: { left: 40, right: 40 },
            styles: { fontSize: 7, cellPadding: 4, overflow: "linebreak" },
            headStyles: {
                fillColor: [247, 181, 25],
                textColor: [7, 49, 41],
                fontStyle: "bold",
            },
            alternateRowStyles: { fillColor: [243, 248, 246] },
        });
        doc.save(`${name}.pdf`);
    };

    const run = (fn: () => void | Promise<void>) => async () => {
        setBusy(true);
        try {
            await fn();
        } finally {
            setBusy(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="h-8"
                    disabled={busy || totalCount === 0}
                    aria-label="Ekspor data"
                >
                    <Download />
                    <span className="hidden sm:inline">Ekspor</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    {selectedCount > 0
                        ? `Ekspor ${selectedCount} baris terpilih`
                        : `Ekspor ${totalCount} baris (sesuai filter)`}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={run(toCsv)}>
                    <FileText className="text-sky-600" />
                    CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={run(toExcel)}>
                    <FileSpreadsheet className="text-emerald-600" />
                    Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={run(toPdf)}>
                    <FileType2 className="text-rose-600" />
                    PDF (.pdf)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function DataTableFilterToggle({
    active,
    onToggle,
    activeCount = 0,
}: {
    active: boolean;
    onToggle: () => void;
    activeCount?: number;
}) {
    return (
        <Button
            type="button"
            variant={active ? "highlight" : "outline"}
            className="h-8"
            onClick={onToggle}
            aria-pressed={active}
            aria-label="Filter per kolom"
        >
            <ListFilter />
            <span className="hidden sm:inline">Filter Kolom</span>
            {activeCount > 0 && (
                <span className="rounded-full bg-highlight px-1.5 text-[10px] font-bold leading-4 text-highlight-foreground">
                    {activeCount}
                </span>
            )}
        </Button>
    );
}

/** Jumlah filter teks per kolom yang sedang aktif (untuk lencana tombol) */
export function countTextFilters<TData>(table: Table<TData>) {
    return table
        .getState()
        .columnFilters.filter((f) => typeof f.value === "string" && f.value)
        .length;
}

/**
 * Baris filter per kolom. Ditaruh di dalam <TableHeader> setelah baris judul.
 * Input hanya muncul untuk kolom berisi teks (filter "mengandung"); kolom angka,
 * kolom bantu, dan kolom yang sedang memakai filter pilihan (faceted) dibiarkan kosong.
 */
export function DataTableFilterRow<TData>({ table }: { table: Table<TData> }) {
    const sampleRows = table.getPreFilteredRowModel().flatRows.slice(0, 50);
    /* Tipe kolom ditebak dari nilai pertama yang tidak kosong */
    const sampleOf = (id: string) => {
        for (const r of sampleRows) {
            const v = r.getValue(id);
            if (v !== null && v !== undefined && v !== "") return v;
        }
        return undefined;
    };
    const headers = table.getHeaderGroups().at(-1)?.headers ?? [];

    return (
        <TableRow className="tls-filter-row">
            {headers.map((header) => {
                const column = header.column;
                const value = column.getFilterValue();
                const sampleValue = sampleOf(column.id);
                const canText =
                    column.getCanFilter() &&
                    typeof column.accessorFn !== "undefined" &&
                    !UTILITY_COLUMNS.has(column.id.toLowerCase()) &&
                    !Array.isArray(value) &&
                    typeof sampleValue === "string";
                return (
                    <TableHead key={header.id} className="py-1.5">
                        {canText && !header.isPlaceholder ? (
                            <Input
                                value={(value as string) ?? ""}
                                onChange={(e) =>
                                    column.setFilterValue(
                                        e.target.value || undefined
                                    )
                                }
                                placeholder="Cari…"
                                aria-label={`Filter ${getColumnTitle(
                                    column as Column<TData, unknown>,
                                    table
                                )}`}
                                className={cn(
                                    "h-7 min-w-[6rem] px-2 text-xs font-normal normal-case tracking-normal",
                                    value ? "border-primary" : ""
                                )}
                            />
                        ) : null}
                    </TableHead>
                );
            })}
        </TableRow>
    );
}
