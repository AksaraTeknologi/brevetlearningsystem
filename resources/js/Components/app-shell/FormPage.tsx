import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

/*
 * Kerangka bersama halaman form & detail modul pajak (gaya Coretax):
 *   <FormPageHeader>  judul halaman + tombol aksi di kanan
 *   <FormSection>     kartu bagian form (tls-card + tls-card-head)
 *   <FormActions>     baris tombol Batal / Simpan di bawah, rata kanan
 */

export function FormPageHeader({
    title,
    description,
    backHref,
    backLabel = "Kembali",
    actions,
}: {
    title: ReactNode;
    description?: ReactNode;
    backHref?: string;
    backLabel?: string;
    actions?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-primary">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {(backHref || actions) && (
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {backHref && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={backHref}>
                                <ArrowLeft />
                                {backLabel}
                            </Link>
                        </Button>
                    )}
                    {actions}
                </div>
            )}
        </div>
    );
}

export function FormSection({
    icon,
    title,
    actions,
    className,
    bodyClassName,
    children,
}: {
    icon?: ReactNode;
    title: ReactNode;
    actions?: ReactNode;
    className?: string;
    bodyClassName?: string;
    children: ReactNode;
}) {
    return (
        <section className={cn("tls-card mb-4 min-w-0", className)}>
            <div className="tls-card-head">
                {icon && (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-highlight-soft text-highlight-foreground dark:bg-highlight/15 dark:text-highlight [&_svg]:size-4">
                        {icon}
                    </span>
                )}
                <h2 className="min-w-0 flex-1 text-sm font-bold md:text-base">
                    {title}
                </h2>
                {actions}
            </div>
            <div className={cn("p-4 md:p-6", bodyClassName)}>{children}</div>
        </section>
    );
}

export function FormActions({
    cancelHref,
    cancelLabel = "Batal",
    className,
    children,
}: {
    cancelHref?: string;
    cancelLabel?: string;
    className?: string;
    children?: ReactNode;
}) {
    return (
        <div
            className={cn(
                "tls-card flex flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-end md:px-5",
                className
            )}
        >
            {cancelHref && (
                <Button variant="outline" asChild>
                    <Link href={cancelHref}>{cancelLabel}</Link>
                </Button>
            )}
            {children}
        </div>
    );
}
