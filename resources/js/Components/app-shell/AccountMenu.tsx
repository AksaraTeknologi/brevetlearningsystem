import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Link, router } from "@inertiajs/react";
import { format } from "date-fns";
import {
    Building2,
    ChevronDown,
    Clock,
    LogOut,
    Plus,
    Search,
    UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

type Identity = { id: string | number; name: string; npwp: string; profile_url?: string | null };

export default function AccountMenu({
    user,
    businessEntities,
    activeBusinessEntity,
    lastLogin,
    onLogout,
}: {
    user: Identity;
    businessEntities: Identity[];
    activeBusinessEntity: Identity | null;
    lastLogin?: string | null;
    onLogout: () => void;
}) {
    const [query, setQuery] = useState("");
    const active = activeBusinessEntity ?? user;
    const isImpersonating =
        !!activeBusinessEntity && activeBusinessEntity.id !== user.id;
    const isPersonalActive = !isImpersonating;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return businessEntities;
        return businessEntities.filter(
            (e) =>
                e.name.toLowerCase().includes(q) ||
                String(e.npwp ?? "").toLowerCase().includes(q),
        );
    }, [query, businessEntities]);

    const personalMatches =
        !query.trim() ||
        user.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        String(user.npwp ?? "").includes(query.trim());

    return (
        <DropdownMenu onOpenChange={(o) => !o && setQuery("")}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "group flex h-12 min-w-0 items-center gap-3 rounded-xl border bg-card px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:border-highlight data-[state=open]:ring-1 data-[state=open]:ring-highlight",
                        isImpersonating
                            ? "border-highlight/60 hover:border-highlight dark:border-highlight/40"
                            : "border-border hover:border-input",
                    )}
                    aria-label={
                        isImpersonating
                            ? `Menu akun — sedang impersonate ${active.name}`
                            : "Menu akun"
                    }
                >
                    <span
                        className={cn(
                            "relative grid size-8 shrink-0 place-items-center rounded-full text-brand-900",
                            isImpersonating && "bg-highlight-soft",
                        )}
                    >
                        {isImpersonating ? (
                            <Building2 className="size-[18px]" />
                        ) : user.profile_url ? (
                            <img
                                src={user.profile_url}
                                alt={user.name}
                                className="size-8 rounded-full object-cover ring-1 ring-border"
                            />
                        ) : (
                            <UserRound className="size-5" />
                        )}
                        {isImpersonating && (
                            <span
                                className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-highlight ring-2 ring-white"
                                aria-hidden
                            />
                        )}
                    </span>
                    <span className="hidden min-w-0 sm:block">
                        <span className="flex items-center gap-1.5 leading-tight">
                            {isImpersonating && (
                                <span className="rounded bg-highlight px-1.5 py-px text-[9.5px] font-extrabold uppercase tracking-wider text-brand-950">
                                    Impersonate
                                </span>
                            )}
                            <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
                                {active.npwp || "-"}
                            </span>
                        </span>
                        <span className="block max-w-[190px] truncate text-sm font-bold uppercase leading-tight text-brand-950">
                            {active.name}
                        </span>
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-[min(92vw,380px)] overflow-hidden rounded-2xl border-border p-0 shadow-[0_24px_60px_-20px_rgba(13,77,64,0.35)]"
            >
                {/* Identitas aktif */}
                <div className="flex items-center gap-3 px-5 pb-4 pt-5">
                    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-highlight-soft text-brand-900">
                        {!isImpersonating && user.profile_url ? (
                            <img
                                src={user.profile_url}
                                alt={user.name}
                                className="size-12 object-cover"
                            />
                        ) : (
                            <UserRound className="size-6" />
                        )}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-[15px] font-extrabold uppercase text-brand-950">
                            {active.name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                            {active.npwp || "-"}
                        </p>
                        {isImpersonating && (
                            <p className="mt-1 inline-flex rounded-full bg-highlight-soft px-2 py-0.5 text-[11px] font-semibold text-brand-900">
                                Sedang mewakili badan usaha
                            </p>
                        )}
                    </div>
                </div>

                {/* Pencarian NPWP / nama */}
                <div className="px-4 pb-3">
                    <label className="relative block">
                        <span className="sr-only">Cari NPWP atau nama</span>
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            // Cegah typeahead Radix menelan ketikan
                            onKeyDown={(e) => e.stopPropagation()}
                            placeholder="Cari NPWP atau nama..."
                            className="h-10 w-full rounded-lg border-0 bg-muted pl-9 pr-3 text-sm text-brand-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ring/20"
                        />
                    </label>
                </div>

                <div className="max-h-[300px] overflow-y-auto px-2 pb-2">
                    {personalMatches && (
                        <>
                            <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Akun Utama
                            </p>
                            <DropdownMenuItem
                                onSelect={() =>
                                    router.post(route("impersonate.personal"))
                                }
                                className={cn(
                                    "flex cursor-pointer flex-col items-start gap-0 rounded-xl px-3 py-2.5",
                                    isPersonalActive
                                        ? "bg-highlight-soft focus:bg-highlight-soft"
                                        : "focus:bg-muted",
                                )}
                            >
                                <span className="text-sm font-bold uppercase text-brand-950">
                                    {user.name}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground">
                                    {user.npwp || "-"}
                                </span>
                            </DropdownMenuItem>
                        </>
                    )}

                    <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Badan Usaha
                    </p>
                    {filtered.length === 0 ? (
                        <p className="px-3 py-2 text-center text-[13px] italic text-muted-foreground">
                            {query.trim()
                                ? "Tidak ditemukan"
                                : "Belum ada badan usaha"}
                        </p>
                    ) : (
                        filtered.map((e) => {
                            const isActive =
                                isImpersonating && activeBusinessEntity?.id === e.id;
                            return (
                                <DropdownMenuItem
                                    key={e.id}
                                    onSelect={() =>
                                        router.post(
                                            route("impersonate.business", e.id),
                                        )
                                    }
                                    className={cn(
                                        "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5",
                                        isActive
                                            ? "bg-highlight-soft focus:bg-highlight-soft"
                                            : "focus:bg-muted",
                                    )}
                                >
                                    <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold uppercase text-brand-950">
                                            {e.name}
                                        </span>
                                        <span className="block font-mono text-xs text-muted-foreground">
                                            {e.npwp || "-"}
                                        </span>
                                    </span>
                                </DropdownMenuItem>
                            );
                        })
                    )}

                    <DropdownMenuItem asChild>
                        <Link
                            href={route("business-entities.create")}
                            className="mt-1 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-800 focus:bg-muted"
                        >
                            <Plus className="size-4" />
                            Tambah Badan Usaha
                        </Link>
                    </DropdownMenuItem>
                </div>

                <div className="flex items-center gap-3 border-t border-border/60 px-5 py-3.5">
                    <Clock className="size-4 shrink-0 text-slate-400" />
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Login Terakhir
                        </p>
                        <p className="text-sm font-semibold text-brand-950">
                            {lastLogin
                                ? format(new Date(lastLogin), "dd MMM yyyy, HH.mm")
                                : "-"}
                        </p>
                    </div>
                </div>

                <div className="border-t border-border/60 p-2">
                    <DropdownMenuItem
                        onSelect={onLogout}
                        className="cursor-pointer gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive focus:bg-red-50 focus:text-destructive"
                    >
                        <LogOut className="size-4" />
                        Keluar
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
