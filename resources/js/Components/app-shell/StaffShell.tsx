import AppFooter, { BackToTop } from "@/Components/app-shell/AppFooter";
import { LanguageMenu, ThemeToggle } from "@/Components/app-shell/HeaderControls";
import SearchCommand from "@/Components/app-shell/SearchCommand";
import ConfirmDialog from "@/Components/layout/ConfirmDialog";
import { useTheme } from "@/lib/theme";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/Components/ui/sheet";
import { cn } from "@/lib/utils";
import { Link, router, usePage } from "@inertiajs/react";
import { format } from "date-fns";
import {
    ChevronDown,
    ChevronRight,
    Clock,
    Home,
    LogOut,
    Menu,
    UserRound,
    type LucideIcon,
} from "lucide-react";
import {
    PropsWithChildren,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { Toaster } from "react-hot-toast";

export type StaffMenuItem = { title: string; url: string; icon: LucideIcon };
export type StaffMenuCategory = { category: string; items: StaffMenuItem[] };

const getPath = (fullUrl: string) => {
    const pathWithoutQuery = fullUrl.split("?")[0].split("#")[0];
    try {
        if (
            pathWithoutQuery.startsWith("http://") ||
            pathWithoutQuery.startsWith("https://")
        ) {
            const pathname = new URL(pathWithoutQuery).pathname;
            return pathname.endsWith("/") && pathname.length > 1
                ? pathname.slice(0, -1)
                : pathname;
        }
    } catch {}

    return pathWithoutQuery.endsWith("/") && pathWithoutQuery.length > 1
        ? pathWithoutQuery.slice(0, -1)
        : pathWithoutQuery;
};

function DuoIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
    return (
        <Icon
            aria-hidden
            className={cn("size-[18px] shrink-0 text-brand-900", className)}
            fill="#C5F24A"
            fillOpacity={0.9}
            strokeWidth={2.1}
        />
    );
}

/**
 * Kerangka layout gaya Coretax untuk panel Admin & Pengajar.
 * Menu datar ditampilkan sebagai menu horizontal (tanpa sidebar).
 */
export default function StaffShell({
    children,
    roleLabel,
    menu,
    dashboardRoute,
    dashboardPaths,
}: PropsWithChildren<{
    roleLabel: string;
    menu: StaffMenuCategory[];
    dashboardRoute: string;
    /** Path yang dianggap halaman beranda panel (mis. ["/admin", "/admin/dashboard"]) */
    dashboardPaths: string[];
}>) {
    const user = usePage().props.auth.user as any;
    const { url } = usePage();
    const { theme, toggle: toggleTheme } = useTheme();
    const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const mainRef = useRef<HTMLElement>(null);
    const [pageHasCrumb, setPageHasCrumb] = useState(false);

    const items = menu.flatMap((c) => c.items);

    useLayoutEffect(() => {
        setPageHasCrumb(
            !!mainRef.current?.querySelector('nav[aria-label="breadcrumb"]'),
        );
    }, [url]);

    useEffect(() => setMobileOpen(false), [url]);

    const handleLogout = () => {
        router.post(
            route("logout"),
            {},
            { onSuccess: () => setOpenLogoutDialog(false) },
        );
    };

    const isActive = (itemUrl: string) => {
        const currentPath = getPath(url);
        const itemPath = getPath(itemUrl);
        if (itemPath === "/invoice" && currentPath !== "/invoice") {
            return false;
        }
        if (dashboardPaths.includes(itemPath)) {
            return dashboardPaths.includes(currentPath);
        }
        return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
    };

    const activeItem = items.find((i) => isActive(i.url));
    const isHome = activeItem ? dashboardPaths.includes(getPath(activeItem.url)) : false;
    const lastLogin = user.last_logout_at
        ? format(new Date(user.last_logout_at), "dd MMM yyyy, HH.mm")
        : "-";

    const searchEntries = [
        ...items.map((it) => ({ title: it.title, href: it.url, group: `Panel ${roleLabel}` })),
        { title: "Apa itu Brevet Learning System?", href: route("about"), group: "Bantuan" },
    ];
    const half = Math.ceil(items.length / 2);
    const footerColumns = [
        { heading: `Panel ${roleLabel}`, links: items.slice(0, half).map((i) => ({ label: i.title, href: i.url })) },
        { heading: "Kelola", links: items.slice(half).map((i) => ({ label: i.title, href: i.url })) },
        { heading: "Bantuan", links: [{ label: "Apa itu Brevet Learning System?", href: route("about") }] },
    ];

    return (
        <div className="relative flex min-h-screen flex-col bg-page font-sans text-foreground">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 bg-[radial-gradient(40%_35%_at_0%_0%,rgba(247,181,25,0.14),transparent_70%),radial-gradient(45%_50%_at_100%_40%,rgba(22,163,130,0.14),transparent_70%)] dark:opacity-30"
            />

            {/* Header mengambang */}
            <div className="sticky top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
                <div className="mx-auto max-w-[1600px] rounded-2xl border border-border/80 bg-card/90 shadow-[0_12px_40px_-18px_rgba(13,77,64,0.3)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#0f1a17]/75">
                    <div className="flex h-16 items-center gap-3 px-4 md:h-[72px] md:px-6">
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild>
                                <button
                                    type="button"
                                    className="grid size-10 place-items-center rounded-lg text-brand-900 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
                                    aria-label="Buka menu"
                                >
                                    <Menu className="size-5" />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
                                <SheetHeader className="border-b px-5 py-4">
                                    <SheetTitle asChild>
                                        <div className="self-start">
                                            <img
                                                src="/images/logo.png"
                                                alt="Brevet Learning System"
                                                className="h-9 w-auto dark:hidden"
                                            />
                                            <img
                                                src="/images/logo putih.png"
                                                alt="Brevet Learning System"
                                                className="hidden h-9 w-auto dark:block"
                                            />
                                        </div>
                                    </SheetTitle>
                                </SheetHeader>
                                <nav aria-label="Menu utama" className="space-y-1 p-3">
                                    {items.map((it) => (
                                        <Link
                                            key={it.title}
                                            href={it.url}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-brand-950 hover:bg-muted/50",
                                                isActive(it.url) && "bg-brand text-white hover:bg-brand dark:bg-highlight dark:text-highlight-foreground",
                                            )}
                                        >
                                            <DuoIcon icon={it.icon} />
                                            {it.title}
                                        </Link>
                                    ))}
                                </nav>
                            </SheetContent>
                        </Sheet>

                        <Link href={route(dashboardRoute)} className="flex shrink-0 items-center gap-3">
                            <img
                                src="/images/logo.png"
                                alt="Brevet Learning System"
                                className="h-9 w-auto dark:hidden md:h-11"
                            />
                            <img
                                src="/images/logo putih.png"
                                alt="Brevet Learning System"
                                className="hidden h-9 w-auto dark:block md:h-11"
                            />
                            <span className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden />
                            <span className="hidden rounded-full bg-highlight-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-900 sm:inline-block">
                                Panel {roleLabel}
                            </span>
                        </Link>

                        <div className="flex min-w-0 flex-1 justify-end px-1 md:justify-center md:px-6">
                            <SearchCommand entries={searchEntries} />
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5 md:gap-1.5">
                            <ThemeToggle theme={theme} onToggle={toggleTheme} />
                            <div className="hidden md:block">
                                <LanguageMenu />
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="group flex h-12 min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-3 text-left transition-colors hover:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:border-highlight data-[state=open]:ring-1 data-[state=open]:ring-highlight"
                                    aria-label="Menu akun"
                                >
                                    {user?.profile_url ? (
                                        <img
                                            src={user.profile_url}
                                            alt={user.name}
                                            className="size-8 shrink-0 rounded-full object-cover ring-1 ring-border"
                                        />
                                    ) : (
                                        <UserRound className="size-5 shrink-0 text-brand-900" />
                                    )}
                                    <span className="hidden min-w-0 sm:block">
                                        <span className="block text-[11px] leading-tight text-muted-foreground">
                                            {roleLabel}
                                        </span>
                                        <span className="block max-w-[200px] truncate text-sm font-bold uppercase leading-tight text-brand-950">
                                            {user.name}
                                        </span>
                                    </span>
                                    <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                sideOffset={10}
                                className="w-[min(92vw,340px)] overflow-hidden rounded-2xl border-border p-0 shadow-[0_24px_60px_-20px_rgba(13,77,64,0.35)]"
                            >
                                <div className="flex items-center gap-3 px-5 pb-4 pt-5">
                                    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-highlight-soft text-brand-900">
                                        {user?.profile_url ? (
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
                                            {user.name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 border-t border-border/60 px-5 py-3.5">
                                    <Clock className="size-4 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Login Terakhir
                                        </p>
                                        <p className="text-sm font-semibold text-brand-950">{lastLogin}</p>
                                    </div>
                                </div>
                                <div className="border-t border-border/60 p-2">
                                    <DropdownMenuItem
                                        onSelect={() => setOpenLogoutDialog(true)}
                                        className="cursor-pointer gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive focus:bg-red-50 focus:text-destructive"
                                    >
                                        <LogOut className="size-4" />
                                        Keluar
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Link
                            href={route(dashboardRoute)}
                            aria-label="Beranda"
                            className="hidden size-10 shrink-0 place-items-center rounded-lg text-brand-900 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid"
                        >
                            <Home className="size-5" />
                        </Link>
                    </div>

                    {/* Menu horizontal */}
                    <nav aria-label="Menu utama" className="hidden border-t border-border/60 px-3 dark:border-white/10 lg:block">
                        <ul className="flex items-center gap-1 overflow-x-auto py-1.5">
                            {items.map((it) => {
                                const active = isActive(it.url);
                                return (
                                    <li key={it.title} className="flex">
                                        <Link
                                            href={it.url}
                                            aria-current={active ? "page" : undefined}
                                            className={cn(
                                                "relative flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] font-medium text-brand-950 transition-colors duration-200 hover:bg-slate-900/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900/30 dark:hover:bg-white/5",
                                                active &&
                                                    "bg-highlight font-bold text-highlight-foreground hover:bg-highlight dark:text-highlight-foreground dark:hover:bg-highlight",
                                            )}
                                        >
                                            <DuoIcon icon={it.icon} />
                                            {it.title}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>
            </div>

            <div className="relative mx-auto w-full max-w-[1600px] flex-1 px-3 pb-8 pt-5 md:px-6 md:pt-6">
                <div className="min-h-[calc(100vh-200px)] rounded-[20px] border border-border/80 bg-card dark:border-white/[0.07] shadow-[0_20px_50px_-30px_rgba(13,77,64,0.3)]">
                    {!pageHasCrumb && (
                        <nav aria-label="Breadcrumb" className="px-3 pt-3 md:px-6 md:pt-5">
                            <ol className="flex flex-wrap items-center gap-1.5 text-sm">
                                <li>
                                    <Link
                                        href={route(dashboardRoute)}
                                        className="text-muted-foreground hover:text-brand-900"
                                    >
                                        Dashboard
                                    </Link>
                                </li>
                                {activeItem && !isHome && (
                                    <li className="inline-flex items-center gap-1.5">
                                        <ChevronRight className="size-3.5 text-slate-300" />
                                        <span className="font-medium text-brand-950" aria-current="page">
                                            {activeItem.title}
                                        </span>
                                    </li>
                                )}
                            </ol>
                        </nav>
                    )}
                    <main ref={mainRef} className="app-content" data-auto-crumb={!pageHasCrumb ? "" : undefined}>{children}</main>
                </div>
            </div>

            <AppFooter columns={footerColumns} />
            <BackToTop />

            <ConfirmDialog
                open={openLogoutDialog}
                onClose={() => setOpenLogoutDialog(false)}
                onConfirm={handleLogout}
                title="Keluar"
                description="Apakah Anda yakin ingin keluar?"
            />
            <Toaster position="top-center" containerStyle={{ zIndex: 99999 }} />
        </div>
    );
}
