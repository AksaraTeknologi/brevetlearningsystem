import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/Components/ui/command";
import { router } from "@inertiajs/react";
import { ArrowRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type SearchEntry = { title: string; href: string; group: string };

/**
 * Pencarian layanan ala Coretax (⌘K / Ctrl+K): mencari menu & halaman
 * yang tersedia untuk pengguna, lalu membukanya.
 */
export default function SearchCommand({ entries }: { entries: SearchEntry[] }) {
    const [open, setOpen] = useState(false);
    const [isMac, setIsMac] = useState(true);

    useEffect(() => {
        setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const groups = useMemo(() => {
        const map = new Map<string, SearchEntry[]>();
        entries.forEach((e) => {
            if (!map.has(e.group)) map.set(e.group, []);
            // hindari duplikat URL dalam grup
            if (!map.get(e.group)!.some((x) => x.href === e.href)) map.get(e.group)!.push(e);
        });
        return [...map.entries()];
    }, [entries]);

    const go = (href: string) => {
        setOpen(false);
        router.visit(href);
    };

    return (
        <>
            {/* Desktop: kolom pencarian */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="hidden h-11 w-full max-w-[560px] items-center gap-3 rounded-full bg-slate-900/[0.045] px-4 text-left text-[15px] text-muted-foreground transition-colors hover:bg-slate-900/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/[0.06] dark:text-white/50 dark:hover:bg-white/10 md:flex"
            >
                <Search className="size-5 shrink-0" />
                <span className="flex-1 truncate">Cari layanan...</span>
                <span className="flex items-center gap-1" aria-hidden>
                    <kbd className="rounded-md border border-border bg-card/80 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/50">
                        {isMac ? "⌘" : "Ctrl"}
                    </kbd>
                    <kbd className="rounded-md border border-border bg-card/80 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/50">
                        K
                    </kbd>
                </span>
            </button>

            {/* Mobile: ikon */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Cari layanan"
                className="inline-grid size-10 shrink-0 place-items-center rounded-full text-brand-900 hover:bg-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-white dark:hover:bg-white/10 md:hidden"
            >
                <Search className="size-5" />
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Cari layanan, menu, atau halaman..." />
                <CommandList className="max-h-[60vh]">
                    <CommandEmpty>Layanan tidak ditemukan.</CommandEmpty>
                    {groups.map(([group, items]) => (
                        <CommandGroup key={group} heading={group}>
                            {items.map((it) => (
                                <CommandItem
                                    key={`${group}-${it.href}`}
                                    value={`${it.title} ${group}`}
                                    onSelect={() => go(it.href)}
                                    className="cursor-pointer justify-between gap-3 py-2.5"
                                >
                                    <span className="truncate">{it.title}</span>
                                    <ArrowRight className="size-3.5 shrink-0 opacity-50" />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ))}
                </CommandList>
            </CommandDialog>
        </>
    );
}
