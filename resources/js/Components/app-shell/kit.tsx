/*
 * Kit tampilan bersama untuk halaman kelas, ujian, pengajar, dan admin.
 * Semua memakai token (bg-card, text-muted-foreground, success, info, …) sehingga
 * otomatis mendukung mode gelap. Motif khas: aksen kiri 4px pada kotak membulat.
 *
 *   PageHeader   – judul halaman berikon + deskripsi + aksi kanan
 *   StatTile     – angka ringkas berikon (grid statistik)
 *   EntityCard   – kartu kelas/ujian/bank soal: aksen status, ikon, meta, linimasa, aksi
 *   InfoGrid     – pasangan label–nilai (pengganti tabel "Label : nilai")
 *   Section      – kartu bagian dengan kepala berikon
 *   StatusPill   – lencana status bertitik
 *   EmptyState   – keadaan kosong
 *   Timeline     – bar progres waktu mulai → selesai
 */
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type Tone =
    | "brand"
    | "info"
    | "success"
    | "warning"
    | "destructive"
    | "steel"
    | "highlight";

/* Kelas per nada warna */
export const TONE: Record<
    Tone,
    { chip: string; soft: string; text: string; border: string; dot: string; bar: string }
> = {
    brand: {
        chip: "bg-brand text-brand-foreground",
        soft: "bg-brand/10 text-brand-ink dark:bg-white/10",
        text: "text-brand-ink",
        border: "border-l-brand dark:border-l-highlight",
        dot: "bg-brand dark:bg-highlight",
        bar: "bg-brand dark:bg-highlight",
    },
    info: {
        chip: "bg-info text-info-foreground",
        soft: "bg-info/10 text-info",
        text: "text-info",
        border: "border-l-info dark:border-l-info",
        dot: "bg-info",
        bar: "bg-info",
    },
    success: {
        chip: "bg-success text-success-foreground",
        soft: "bg-[#ECFCCB] text-[#3F6212] dark:bg-highlight/15 dark:text-highlight",
        text: "text-success",
        border: "border-l-success dark:border-l-success",
        dot: "bg-[#65A30D] dark:bg-highlight",
        bar: "bg-[#84CC16] dark:bg-highlight",
    },
    warning: {
        chip: "bg-warning text-warning-foreground",
        soft: "bg-warning/10 text-warning",
        text: "text-warning",
        border: "border-l-warning dark:border-l-warning",
        dot: "bg-warning",
        bar: "bg-warning",
    },
    destructive: {
        chip: "bg-destructive text-destructive-foreground",
        soft: "bg-destructive/10 text-destructive",
        text: "text-destructive",
        border: "border-l-destructive dark:border-l-destructive",
        dot: "bg-destructive",
        bar: "bg-destructive",
    },
    steel: {
        chip: "bg-steel text-steel-foreground",
        soft: "bg-muted text-muted-foreground",
        text: "text-muted-foreground",
        border: "border-l-steel dark:border-l-steel",
        dot: "bg-steel",
        bar: "bg-steel",
    },
    highlight: {
        chip: "bg-highlight text-highlight-foreground",
        soft: "bg-highlight-soft text-highlight-foreground dark:bg-highlight/15 dark:text-highlight",
        text: "text-brand-ink dark:text-highlight",
        border: "border-l-highlight dark:border-l-highlight",
        dot: "bg-highlight",
        bar: "bg-highlight",
    },
};

/** Nada warna dari label status yang umum dipakai di aplikasi */
export function toneFromStatus(label?: string | null): Tone {
    const s = (label ?? "").toLowerCase();
    if (/berlangsung|aktif|active|lulus|benar|approved|disetujui|acc/.test(s) && !/tidak|non/.test(s))
        return "success";
    if (/belum|upcoming|menunggu|pending|draft/.test(s)) return "info";
    if (/selesai|finished|ditutup|closed|nonaktif|inactive/.test(s)) return "steel";
    if (/tidak lulus|salah|gagal|ditolak|rejected|dihapus/.test(s)) return "destructive";
    if (/remedial|batal|canceled/.test(s)) return "warning";
    return "brand";
}

/* ------------------------------------------------------------------ */

export function IconTile({
    icon: Icon,
    tone = "highlight",
    size = "md",
    className,
}: {
    icon: LucideIcon;
    tone?: Tone;
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    return (
        <span
            className={cn(
                "flex shrink-0 items-center justify-center rounded-xl",
                TONE[tone].soft,
                size === "sm" && "size-8 [&_svg]:size-4",
                size === "md" && "size-10 [&_svg]:size-5",
                size === "lg" && "size-12 [&_svg]:size-6",
                className
            )}
        >
            <Icon />
        </span>
    );
}

/**
 * Judul halaman. Sengaja polos (tanpa ikon/eyebrow) agar sama di semua halaman,
 * mengikuti gaya judul halaman lain (mis. Bank Saya). Prop `icon` & `eyebrow`
 * tetap diterima agar pemanggil lama tidak rusak, tetapi tidak ditampilkan.
 */
export function PageHeader({
    title,
    description,
    actions,
    className,
}: {
    title: ReactNode;
    description?: ReactNode;
    icon?: LucideIcon;
    eyebrow?: ReactNode;
    actions?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
                className
            )}
        >
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-primary">{title}</h1>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>
            )}
        </div>
    );
}

export function StatTile({
    icon,
    label,
    value,
    tone = "brand",
    hint,
    className,
}: {
    icon: LucideIcon;
    label: ReactNode;
    value: ReactNode;
    tone?: Tone;
    hint?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                /* HP: ikon di atas label agar label tidak terpotong */
                "tls-card tls-stat-tile relative flex flex-col items-start gap-2.5 overflow-hidden p-4 sm:flex-row sm:items-center sm:gap-3.5",
                className
            )}
        >
            <IconTile icon={icon} tone={tone} className="tls-stat-icon size-9 rounded-full sm:size-10" />
            <div className="min-w-0">
                <p className="tls-stat-label break-words text-[11px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground sm:text-xs">
                    {label}
                </p>
                <p className={cn("tls-stat-value text-2xl font-extrabold leading-tight tracking-tight", TONE[tone].text)}>{value}</p>
                {hint && <p className="tls-stat-hint truncate text-xs text-muted-foreground">{hint}</p>}
            </div>
            <span
                aria-hidden
                className={cn(
                    "pointer-events-none absolute -bottom-8 -right-8 size-20 rounded-full opacity-[0.06] dark:opacity-[0.1]",
                    TONE[tone].dot
                )}
            />
        </div>
    );
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("tls-stat-grid grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
            {children}
        </div>
    );
}

export function StatusPill({
    tone = "steel",
    children,
    className,
}: {
    tone?: Tone;
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                TONE[tone].soft,
                className
            )}
        >
            <span className={cn("size-1.5 rounded-full", TONE[tone].dot)} />
            {children}
        </span>
    );
}

/** Bar progres waktu dari `start` ke `end` (nilai tanggal apa pun yang bisa dibaca Date) */
export function Timeline({
    start,
    end,
    startLabel,
    endLabel,
    tone = "brand",
}: {
    start?: string | Date | null;
    end?: string | Date | null;
    startLabel?: ReactNode;
    endLabel?: ReactNode;
    tone?: Tone;
}) {
    const s = start ? new Date(start).getTime() : NaN;
    const e = end ? new Date(end).getTime() : NaN;
    const now = Date.now();
    const valid = Number.isFinite(s) && Number.isFinite(e) && e > s;
    const pct = valid ? Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100)) : 0;
    return (
        <div className="space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={cn("h-full rounded-full", TONE[tone].bar)}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {(startLabel || endLabel) && (
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{startLabel}</span>
                    {valid && (
                        <span className="shrink-0 font-semibold text-foreground">
                            {Math.round(pct)}%
                        </span>
                    )}
                    <span className="truncate text-right">{endLabel}</span>
                </div>
            )}
        </div>
    );
}

export type MetaItem = { icon?: LucideIcon; label: ReactNode; value: ReactNode };

export function MetaGrid({ items, className }: { items: MetaItem[]; className?: string }) {
    return (
        <div className={cn("grid grid-cols-2 gap-2 lg:grid-cols-4", className)}>
            {items.map((m, i) => (
                <div
                    key={i}
                    className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5"
                >
                    {m.icon && <m.icon className="size-4 shrink-0 text-muted-foreground" />}
                    <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {m.label}
                        </p>
                        <div className="truncate text-sm font-semibold text-foreground">{m.value}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function EntityCard({
    tone = "brand",
    icon,
    title,
    subtitle,
    badges,
    children,
    actions,
    className,
}: {
    tone?: Tone;
    icon?: LucideIcon;
    title: ReactNode;
    subtitle?: ReactNode;
    badges?: ReactNode;
    children?: ReactNode;
    actions?: ReactNode;
    className?: string;
}) {
    return (
        <article
            className={cn(
                "tls-card tls-card-hover flex flex-col overflow-hidden",
                className
            )}
        >
            <div className="flex flex-col gap-3 p-4 md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        {icon && <IconTile icon={icon} tone={tone === "steel" ? "steel" : "highlight"} />}
                        <div className="min-w-0">
                            <h3 className="truncate text-base font-bold text-brand-950 md:text-lg">
                                {title}
                            </h3>
                            {subtitle && (
                                <div className="line-clamp-2 text-sm text-muted-foreground">
                                    {subtitle}
                                </div>
                            )}
                        </div>
                    </div>
                    {badges && <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">{badges}</div>}
                </div>
                {children}
            </div>
            {actions && (
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border/70 bg-muted/30 px-4 py-3 md:px-5">
                    {actions}
                </div>
            )}
        </article>
    );
}

export type InfoItem = {
    label: ReactNode;
    value: ReactNode;
    icon?: LucideIcon;
    /** Lebar penuh (2 kolom) */
    full?: boolean;
};

export function InfoGrid({
    items,
    columns = 2,
    className,
}: {
    items: InfoItem[];
    columns?: 1 | 2 | 3;
    className?: string;
}) {
    return (
        <dl
            className={cn(
                "grid gap-x-6 gap-y-1",
                columns === 2 && "sm:grid-cols-2",
                columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
                className
            )}
        >
            {items.map((it, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex min-w-0 items-start gap-3 border-b border-border/60 py-3",
                        it.full && columns > 1 && "sm:col-span-2 lg:col-span-full"
                    )}
                >
                    {it.icon && (
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
                            <it.icon />
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {it.label}
                        </dt>
                        <dd className="mt-0.5 break-words text-sm font-semibold text-foreground">
                            {it.value ?? "-"}
                        </dd>
                    </div>
                </div>
            ))}
        </dl>
    );
}

export function Section({
    icon,
    title,
    description,
    actions,
    children,
    className,
    bodyClassName,
}: {
    icon?: LucideIcon;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
    className?: string;
    bodyClassName?: string;
}) {
    return (
        <section className={cn("tls-card min-w-0 overflow-hidden", className)}>
            <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    {icon && <IconTile icon={icon} size="sm" />}
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-brand-950">{title}</h2>
                        {description && (
                            <p className="text-xs text-muted-foreground sm:text-sm">{description}</p>
                        )}
                    </div>
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
            <div className={cn("p-4 md:p-5", bodyClassName)}>{children}</div>
        </section>
    );
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: {
    icon: LucideIcon;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center",
                className
            )}
        >
            <IconTile icon={Icon} tone="steel" size="lg" />
            <p className="mt-1 font-semibold text-foreground">{title}</p>
            {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

/** Format tanggal Indonesia singkat: 14 Nov 2026 */
export function fmtDate(v?: string | Date | null, withTime = false) {
    if (!v) return "-";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
}

/** Pesan/peringatan singkat di dalam kartu */
export function Notice({
    tone = "info",
    title,
    children,
    className,
}: {
    tone?: Tone;
    title?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "rounded-xl border-l-4 px-3.5 py-2.5 text-sm",
                TONE[tone].soft,
                TONE[tone].border,
                className
            )}
        >
            {title && <p className="font-semibold">{title}</p>}
            <div className={cn(title && "mt-0.5", "leading-relaxed")}>{children}</div>
        </div>
    );
}

/** Kode kelas/ujian yang bisa disalin */
export function CodeChip({
    code,
    copied,
    onCopy,
    label = "Kode",
}: {
    code: string;
    copied?: boolean;
    onCopy?: () => void;
    label?: string;
}) {
    return (
        <button
            type="button"
            onClick={onCopy}
            title="Salin kode"
            className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors",
                copied
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border bg-card text-brand-ink hover:border-highlight hover:bg-highlight-soft/60"
            )}
        >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
            <span className="font-mono text-sm font-bold tracking-widest">{code}</span>
            <span className="text-[10px] font-semibold">{copied ? "Tersalin" : "Salin"}</span>
        </button>
    );
}

/** Lencana kecil bertekstur lembut (jumlah modul, jadwal, akses materi, dll) */
export function Chip({
    tone = "steel",
    icon: Icon,
    children,
    className,
}: {
    tone?: Tone;
    icon?: LucideIcon;
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold",
                TONE[tone].soft,
                className
            )}
        >
            {Icon && <Icon className="size-3.5" />}
            {children}
        </span>
    );
}
