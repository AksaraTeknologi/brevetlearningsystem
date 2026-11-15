import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Moon, Sun } from "lucide-react";

/** Bendera Indonesia kecil (merah-putih) tanpa aset gambar. */
export function FlagID({ className }: { className?: string }) {
    return (
        <span
            aria-hidden
            className={cn(
                "inline-block size-6 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]",
                className,
            )}
        >
            <span className="block h-1/2 bg-[#E11D2A]" />
            <span className="block h-1/2 bg-[#ffffff]" />
        </span>
    );
}

/** Tombol bulat ala Coretax: "pill" (berlatar) atau "ghost" (ikon saja di header). */
export function iconButtonCls(variant: "pill" | "ghost" = "ghost") {
    return cn(
        "inline-grid size-10 shrink-0 place-items-center rounded-full text-brand-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-white",
        variant === "pill"
            ? "size-11 bg-card/90 shadow-[0_8px_24px_-10px_rgba(13,77,64,0.35)] hover:bg-card dark:bg-white/10 dark:shadow-none dark:hover:bg-white/15"
            : "hover:bg-slate-900/5 dark:hover:bg-white/10",
    );
}

export function ThemeToggle({
    theme,
    onToggle,
    variant = "ghost",
}: {
    theme: Theme;
    onToggle: () => void;
    variant?: "pill" | "ghost";
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
            className={iconButtonCls(variant)}
        >
            {theme === "dark" ? (
                <Moon className="size-5" />
            ) : (
                <Sun className="size-[22px] text-[#F5B800]" />
            )}
        </button>
    );
}

export function LanguageMenu({ variant = "ghost" }: { variant?: "pill" | "ghost" }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Pilih bahasa"
                    className={cn(
                        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-2.5 text-sm font-bold text-brand-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-white",
                        variant === "pill"
                            ? "h-11 bg-card/90 px-3.5 shadow-[0_8px_24px_-10px_rgba(13,77,64,0.35)] hover:bg-card dark:bg-white/10 dark:shadow-none dark:hover:bg-white/15"
                            : "hover:bg-slate-900/5 dark:hover:bg-white/10",
                    )}
                >
                    <FlagID />
                    ID
                    <ChevronDown className="size-4 opacity-70" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem className="justify-between gap-3">
                    <span className="flex items-center gap-2">
                        <FlagID /> Bahasa Indonesia
                    </span>
                    <Check className="size-4 text-success" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
