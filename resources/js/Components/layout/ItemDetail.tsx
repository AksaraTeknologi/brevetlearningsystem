interface ItemDetailProps {
    title: string;
    detail: string;
    className?: string;
}

/* Baris label–nilai pada halaman detail (label kiri, nilai kanan; bertumpuk di HP). */
export default function ItemDetail({
    title,
    detail,
    className = "",
}: ItemDetailProps) {
    return (
        <div className="flex flex-col gap-0.5 border-b border-border/60 py-2.5 first:pt-0 last:border-b-0 last:pb-0 dark:border-white/10 md:flex-row md:items-start md:gap-4">
            <span className="text-sm font-medium text-muted-foreground md:w-1/3 lg:w-1/4">
                {title}
            </span>
            <p
                className={
                    "min-w-0 break-words text-sm font-semibold text-foreground md:flex-1 " +
                    className
                }
            >
                {detail || "-"}
            </p>
        </div>
    );
}
