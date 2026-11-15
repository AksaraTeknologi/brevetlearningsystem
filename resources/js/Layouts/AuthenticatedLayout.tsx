import AccountMenu from "@/Components/app-shell/AccountMenu";
import {
    activeModule,
    isCurrent,
    visibleModules,
    type NavModule,
} from "@/Components/app-shell/nav-config";
import AppFooter, { BackToTop } from "@/Components/app-shell/AppFooter";
import { LanguageMenu, ThemeToggle } from "@/Components/app-shell/HeaderControls";
import SearchCommand, { type SearchEntry } from "@/Components/app-shell/SearchCommand";
import ConfirmDialog from "@/Components/layout/ConfirmDialog";
import { useTheme } from "@/lib/theme";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/Components/ui/sheet";
import items from "@/lib/sidebar-items";
import { cn } from "@/lib/utils";
import { Link, router, usePage } from "@inertiajs/react";
import {
    ChevronDown,
    ChevronRight,
    ChevronsLeft,
    Home,
    Menu,
    School,
} from "lucide-react";
import {
    PropsWithChildren,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { Toaster } from "react-hot-toast";

const SIDEBAR_KEY = "bls-sidebar-collapsed";

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

type Identity = { id: string; name: string; npwp: string };

/* ------------------------------------------------------------------ */
/* Ikon modul dua warna (garis navy, isi kuning) ala Coretax           */
/* ------------------------------------------------------------------ */
function ModuleIcon({ module, className }: { module: NavModule; className?: string }) {
    const Icon = module.icon;
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

/* ------------------------------------------------------------------ */
/* Menu horizontal desktop + mega menu                                 */
/* ------------------------------------------------------------------ */
function TopNav({
    modules,
    openKey,
    setOpenKey,
    right,
}: {
    modules: NavModule[];
    openKey: string | null;
    setOpenKey: (k: string | null) => void;
    right?: ReactNode;
}) {
    const current = activeModule(modules);
    const openModule = modules.find((m) => m.key === openKey);

    return (
        <>
            <div className="flex items-center gap-3 border-t border-border/60 px-3 dark:border-white/10">
            <nav aria-label="Menu utama" className="min-w-0 flex-1">
                <ul className="flex items-center gap-1 overflow-x-auto py-1.5">
                    {modules.map((m) => {
                        const isActive = current?.key === m.key;
                        const isOpen = openKey === m.key;
                        const base = cn(
                            "relative flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] font-medium text-brand-950 transition-colors duration-200 hover:bg-slate-900/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900/30 dark:hover:bg-white/5",
                            (isActive || isOpen) &&
                                "bg-highlight font-bold text-highlight-foreground hover:bg-highlight dark:text-highlight-foreground dark:hover:bg-highlight",
                        );

                        return (
                            <li key={m.key} className="flex">
                                {m.groups ? (
                                    <button
                                        type="button"
                                        className={base}
                                        aria-expanded={isOpen}
                                        aria-haspopup="true"
                                        onClick={() =>
                                            setOpenKey(isOpen ? null : m.key)
                                        }
                                    >
                                        <ModuleIcon module={m} />
                                        {m.label}
                                        <ChevronDown
                                            className={cn(
                                                "size-4 text-slate-400 transition-transform duration-200",
                                                isOpen && "rotate-180",
                                            )}
                                        />
                                    </button>
                                ) : (
                                    <Link
                                        href={route(m.routeName!)}
                                        className={base}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        <ModuleIcon module={m} />
                                        {m.label}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>
            {right && <div className="shrink-0 py-1.5">{right}</div>}
            </div>

            {openModule?.groups && (
                <div
                    role="menu"
                    aria-label={openModule.label}
                    className="absolute inset-x-0 top-full z-50 mt-2 grid origin-top overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_70px_-25px_rgba(13,77,64,0.35)] duration-200 ease-out animate-in fade-in-0 slide-in-from-top-2"
                    style={{
                        gridTemplateColumns: `repeat(${Math.max(
                            openModule.groups.length,
                            openModule.groups.length === 1 ? 3 : 2,
                        )}, minmax(0, 1fr))`,
                    }}
                >
                    {openModule.groups.map((g, i) => (
                        <div
                            key={g.heading}
                            className={cn(
                                "px-6 py-6",
                                i === 0 ? "bg-muted/50" : "border-l border-border/60",
                            )}
                        >
                            <p className="px-3 pb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                                {g.heading}
                            </p>
                            <ul className="space-y-1">
                                {g.items.map((it) => {
                                    const active = isCurrent(it.match);
                                    return (
                                        <li key={it.routeName}>
                                            <Link
                                                role="menuitem"
                                                href={route(it.routeName)}
                                                className={cn(
                                                    "block rounded-lg px-3 py-2.5 text-[15px] font-semibold text-brand-950 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                    active &&
                                                        "bg-highlight-soft text-highlight-foreground hover:bg-highlight-soft dark:bg-highlight/15 dark:text-highlight dark:hover:bg-highlight/15",
                                                )}
                                            >
                                                {it.title}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Sidebar kartu per modul                                             */
/* ------------------------------------------------------------------ */
type SidebarCategory = ReturnType<typeof items>[number];

function ModuleSidebar({
    title,
    module,
    categories,
    isActive,
    onCollapse,
    closing,
}: {
    title: string;
    module?: NavModule;
    categories: SidebarCategory[];
    isActive: (url: string) => boolean;
    onCollapse: () => void;
    closing: boolean;
}) {
    const multi = categories.length > 1;

    return (
        <aside
            className={cn(
                "sticky top-[156px] hidden max-h-[calc(100vh-176px)] w-[280px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-border/80 bg-card dark:border-white/[0.07] lg:flex",
                // Animasi ringan (opacity + transform saja, tanpa animasi lebar)
                closing
                    ? "duration-200 ease-in animate-out fade-out-0 slide-out-to-left-6 fill-mode-forwards"
                    : "duration-300 ease-out animate-in fade-in-0 slide-in-from-left-6",
            )}
        >
            <div className="m-3 flex items-center gap-3 rounded-xl bg-muted/80 py-2.5 pl-4 pr-2">
                {module && <ModuleIcon module={module} className="size-5" />}
                <h2 className="min-w-0 flex-1 truncate text-[17px] font-bold text-brand-950">
                    {title}
                </h2>
                <button
                    type="button"
                    onClick={onCollapse}
                    aria-label="Sembunyikan menu samping"
                    className="grid size-9 place-items-center rounded-lg border border-border bg-card text-brand-900 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <ChevronsLeft className="size-4" />
                </button>
            </div>

            <nav
                aria-label={`Menu ${title}`}
                className="flex-1 overflow-y-auto px-3 pb-4"
            >
                {categories.map((cat) => (
                    <div key={cat.category} className={cn(multi && "mb-3")}>
                        {multi && (
                            <p className="px-4 pb-1 pt-3 text-[15px] font-bold text-brand-950">
                                {cat.category}
                            </p>
                        )}
                        <ul className="space-y-0.5">
                            {cat.items.map((item) => {
                                const active = isActive(item.url);
                                return (
                                    <li key={item.title}>
                                        <Link
                                            href={item.url}
                                            aria-current={active ? "page" : undefined}
                                            className={cn(
                                                /* Aksen kuning = border kiri pada kotak membulat, jadi ikut melengkung
                                                   di sudut (sama seperti kepala bagian di halaman SPT) */
                                                "relative block rounded-xl px-4 py-2.5 text-[15px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                active &&
                                                    "bg-brand font-semibold text-white hover:bg-brand hover:text-white dark:bg-highlight dark:text-highlight-foreground dark:hover:bg-highlight dark:hover:text-highlight-foreground",
                                            )}
                                        >
                                            {item.title}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
}

/* ------------------------------------------------------------------ */
/* Tab vertikal di tepi kiri saat sidebar diciutkan (ala Coretax)       */
/* ------------------------------------------------------------------ */
function SidebarTab({
    title,
    module,
    onOpen,
}: {
    title: string;
    module?: NavModule;
    onOpen: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={`Tampilkan menu ${title}`}
            className="fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 rounded-r-2xl border border-l-0 border-highlight/60 bg-highlight py-5 pl-2.5 pr-3 text-brand-950 shadow-[0_12px_30px_-12px_rgba(13,77,64,0.35)] transition-[padding] duration-200 ease-out animate-in fade-in-0 slide-in-from-left-4 hover:pl-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-highlight/30 lg:flex"
        >
            {module && <ModuleIcon module={module} />}
            <span className="rotate-180 text-sm font-bold [writing-mode:vertical-rl]">
                {title}
            </span>
            <ChevronRight className="size-4" />
        </button>
    );
}

/* ------------------------------------------------------------------ */
/* Breadcrumb                                                          */
/* ------------------------------------------------------------------ */
function Breadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
    return (
        <nav aria-label="Breadcrumb" className="px-3 pt-3 md:px-6 md:pt-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm">
                <li>
                    <Link
                        href={route("dashboard")}
                        className="text-muted-foreground hover:text-brand-900"
                    >
                        Dashboard
                    </Link>
                </li>
                {trail.map((t, i) => {
                    const last = i === trail.length - 1;
                    return (
                        <li key={`${t.label}-${i}`} className="inline-flex items-center gap-1.5">
                            <ChevronRight className="size-3.5 text-slate-300" />
                            {t.href && !last ? (
                                <Link href={t.href} className="font-medium text-brand-900 hover:underline">
                                    {t.label}
                                </Link>
                            ) : (
                                <span
                                    className={cn(
                                        "font-medium",
                                        last ? "text-brand-950" : "text-brand-900",
                                    )}
                                    aria-current={last ? "page" : undefined}
                                >
                                    {t.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

/* ------------------------------------------------------------------ */
/* Kelas aktif                                                         */
/* ------------------------------------------------------------------ */
function ActiveCourse({ name, className }: { name: string; className?: string }) {
    return (
        <div
            role="status"
            aria-label={`Kelas aktif: ${name}`}
            className={cn(
                "flex h-9 min-w-0 items-center gap-2 rounded-full border border-highlight/60 bg-highlight-soft pl-1.5 pr-1 text-sm dark:border-highlight/30",
                className,
            )}
        >
            <span className="relative grid size-6 shrink-0 place-items-center rounded-full bg-highlight text-brand-950">
                <School className="size-3.5" />
                <span aria-hidden className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-green-500 ring-2 ring-highlight-soft" />
            </span>
            <span className="min-w-0 truncate">
                <span className="text-muted-foreground">Kelas Aktif:</span>{" "}
                <span className="font-bold text-brand-950">{name}</span>
            </span>
            <button
                type="button"
                onClick={() => router.post(route("courses.stop"))}
                className="shrink-0 rounded-full border border-orange-200 bg-card px-3 py-1 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-orange-400/30 dark:text-orange-300"
            >
                Berhenti
            </button>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */
export default function Authenticated({
    children,
    variant = "default",
}: PropsWithChildren<{
    /** "home": halaman sambutan tanpa sidebar & kartu konten (Beranda) */
    variant?: "default" | "home";
}>): ReactNode {
    const pageProps = usePage().props as any;
    const { url } = usePage();
    const user = pageProps.auth.user;
    const active_course = pageProps.active_course as {
        id: number;
        name: string;
        access_rights: string[];
    } | null;
    const businessEntities = (pageProps.business_entities ?? []) as Identity[];
    const activeBusinessEntity = (pageProps.active_business_entity ??
        null) as Identity | null;
    const access_rights =
        active_course && active_course.access_rights
            ? Array.isArray(active_course.access_rights)
                ? active_course.access_rights
                : JSON.parse(active_course.access_rights)
            : user.access_rights;

    const menuItems = items();
    const modules = visibleModules(access_rights);
    const currentModule = activeModule(modules);

    const { theme, toggle: toggleTheme } = useTheme();
    const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
    const [openKey, setOpenKey] = useState<string | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLElement>(null);
    // Banyak halaman sudah punya breadcrumb sendiri (sering lebih detail);
    // breadcrumb layout hanya tampil jika halaman tidak punya.
    const [pageHasCrumb, setPageHasCrumb] = useState(false);

    useLayoutEffect(() => {
        setPageHasCrumb(
            !!mainRef.current?.querySelector('nav[aria-label="breadcrumb"]'),
        );
    }, [url]);

    useEffect(() => {
        try {
            setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
        } catch {}
    }, []);

    const [sidebarClosing, setSidebarClosing] = useState(false);
    const collapseSidebar = () => {
        setSidebarClosing(true);
        window.setTimeout(() => {
            setSidebarCollapsed(true);
            setSidebarClosing(false);
        }, 190);
    };

    const setSidebarCollapsed = (v: boolean) => {
        setCollapsed(v);
        try {
            localStorage.setItem(SIDEBAR_KEY, v ? "1" : "0");
        } catch {}
    };

    // Tutup mega menu & menu mobile saat pindah halaman
    useEffect(() => {
        setOpenKey(null);
        setMobileOpen(false);
    }, [url]);

    // Tutup mega menu saat klik di luar header atau tekan Escape
    useEffect(() => {
        if (!openKey) return;
        const onDown = (e: MouseEvent) => {
            if (!headerRef.current?.contains(e.target as Node)) setOpenKey(null);
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenKey(null);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [openKey]);

    const handleLogout = () => {
        router.post(
            route("logout"),
            {},
            { onSuccess: () => setOpenLogoutDialog(false) },
        );
    };

    const isActiveSidebar = (itemUrl: string) => {
        const currentPath = getPath(url);
        const itemPath = getPath(itemUrl);
        if (itemPath === "/invoice" && currentPath !== "/invoice") {
            return false;
        }

        if (currentPath.match(/^\/bpa1\/(not-issued\/)?[^\/]+\/(detail|edit)$/)) {
            const bupot = pageProps.bupot;
            if (bupot) {
                if (bupot.status === "approved" && itemPath === "/bpa1/issued") {
                    return true;
                }
                if (bupot.status === "draft" && itemPath === "/bpa1/invalid") {
                    return true;
                }
                if (
                    (bupot.status === "created" || !bupot.status) &&
                    (itemPath === "/bpa1" || itemPath === "/bpa1/not-issued")
                ) {
                    return true;
                }
            }
        }
        if (itemPath === "/dashboard") {
            return currentPath === "/dashboard";
        }
        return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
    };

    // Judul sidebar & breadcrumb
    const sidebarTitle =
        currentModule?.label ??
        (menuItems.length === 1 ? menuItems[0].category : "Menu");
    const activeItem = menuItems
        .flatMap((c) => c.items.map((i) => ({ ...i, category: c.category })))
        .find((i) => isActiveSidebar(i.url));
    const trail: { label: string; href?: string }[] = [];
    if (currentModule && !(currentModule.key === "portal" && activeItem?.title === "Beranda")) {
        /* "Portal Saya" hanya pengelompok menu, tidak ditampilkan di breadcrumb
           (Dashboard > Kelas Saya), sama dengan halaman yang membuat breadcrumb sendiri */
        if (currentModule.key !== "portal") {
            trail.push({
                label: currentModule.label,
                href: currentModule.routeName ? route(currentModule.routeName) : undefined,
            });
        }
        if (
            currentModule.key === "ebupot" &&
            menuItems[0]?.category &&
            menuItems.length === 1
        ) {
            trail.push({ label: menuItems[0].category });
        }
        if (activeItem && activeItem.title !== currentModule.label) {
            trail.push({ label: activeItem.title });
        }
    }

    // Data pencarian layanan (⌘K): semua menu yang bisa diakses + submenu modul aktif
    const searchEntries: SearchEntry[] = [
        ...modules.flatMap((m) =>
            m.groups
                ? m.groups.flatMap((g) =>
                      g.items.map((it) => ({
                          title: it.title,
                          href: route(it.routeName),
                          group: m.label,
                      })),
                  )
                : [{ title: m.label, href: route(m.routeName!), group: "Layanan" }],
        ),
        ...menuItems.flatMap((c) =>
            c.items.map((it) => ({ title: it.title, href: it.url, group: c.category })),
        ),
        { title: "Apa itu Brevet Learning System?", href: route("about"), group: "Bantuan" },
    ];

    const footerColumns = [
        {
            heading: "Portal Saya",
            links: [
                { label: "Beranda", href: route("dashboard") },
                { label: "Kelas Saya", href: route("courses") },
                { label: "Profil Saya", href: route("profile.edit") },
            ],
        },
        {
            heading: "Layanan",
            links: modules
                .filter((m) => m.key !== "portal")
                .map((m) => ({
                    label: m.label,
                    href: route(m.routeName ?? m.groups![0].items[0].routeName),
                })),
        },
        {
            heading: "Bantuan",
            links: [
                { label: "Apa itu Brevet Learning System?", href: route("about") },
                { label: "Badan Usaha", href: route("business-entities.index") },
                { label: "Bank Saya", href: route("banks") },
            ],
        },
    ];

    return (
        <div className="relative flex min-h-screen flex-col bg-page font-sans text-foreground">
            {/* Latar lembut statis (tanpa animasi) */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 bg-[radial-gradient(40%_35%_at_0%_0%,rgba(247,181,25,0.14),transparent_70%),radial-gradient(45%_50%_at_100%_40%,rgba(22,163,130,0.14),transparent_70%)] dark:opacity-30"
            />

            {/* Header mengambang */}
            <div className="sticky top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
                <div
                    ref={headerRef}
                    className="relative mx-auto max-w-[1600px] rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#121715]/80"
                >
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
                            <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-0">
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
                                <nav aria-label="Menu utama" className="px-3 py-3">
                                    {modules.map((m) => {
                                        const isActive = currentModule?.key === m.key;
                                        return (
                                            <div key={m.key} className="mb-1">
                                                {m.groups ? (
                                                    <>
                                                        <p
                                                            className={cn(
                                                                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-bold text-brand-950",
                                                                isActive && "bg-highlight-soft",
                                                            )}
                                                        >
                                                            <ModuleIcon module={m} />
                                                            {m.label}
                                                        </p>
                                                        {m.groups.flatMap((g) => g.items).map((it) => (
                                                            <Link
                                                                key={it.routeName}
                                                                href={route(it.routeName)}
                                                                className={cn(
                                                                    "ml-[38px] block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50",
                                                                    isCurrent(it.match) &&
                                                                        "bg-muted font-semibold text-brand-950",
                                                                )}
                                                            >
                                                                {it.title}
                                                            </Link>
                                                        ))}
                                                    </>
                                                ) : (
                                                    <Link
                                                        href={route(m.routeName!)}
                                                        className={cn(
                                                            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-bold text-brand-950 hover:bg-muted/50",
                                                            isActive && "bg-highlight-soft",
                                                        )}
                                                    >
                                                        <ModuleIcon module={m} />
                                                        {m.label}
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })}
                                </nav>

                                {/* Sub-menu modul aktif (pengganti sidebar di mobile) */}
                                {menuItems.length > 0 && (
                                    <div className="border-t px-3 py-3">
                                        {menuItems.map((cat) => (
                                            <div key={cat.category} className="mb-2">
                                                <p className="px-3 pb-1 pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    {cat.category}
                                                </p>
                                                {cat.items.map((item) => (
                                                    <Link
                                                        key={item.title}
                                                        href={item.url}
                                                        className={cn(
                                                            "block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50",
                                                            isActiveSidebar(item.url) &&
                                                                "bg-muted font-semibold text-brand-950",
                                                        )}
                                                    >
                                                        {item.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </SheetContent>
                        </Sheet>

                        <Link href={route("dashboard")} className="shrink-0" aria-label="Beranda Brevet Learning System">
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

                        <AccountMenu
                            user={user}
                            businessEntities={businessEntities}
                            activeBusinessEntity={activeBusinessEntity}
                            lastLogin={user.last_logout_at}
                            onLogout={() => setOpenLogoutDialog(true)}
                        />

                        <Link
                            href={route("dashboard")}
                            aria-label="Beranda"
                            className="hidden size-10 shrink-0 place-items-center rounded-lg text-brand-900 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid"
                        >
                            <Home className="size-5" />
                        </Link>
                    </div>

                    {active_course && (
                        <div className="border-t border-border/60 px-3 py-2 dark:border-white/10 lg:hidden">
                            <ActiveCourse name={active_course.name} className="w-full justify-between" />
                        </div>
                    )}
                    <div className="hidden lg:block">
                        <TopNav
                            modules={modules}
                            openKey={openKey}
                            setOpenKey={setOpenKey}
                            right={
                                active_course && (
                                    <ActiveCourse name={active_course.name} className="max-w-[360px]" />
                                )
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Lapisan gelap saat mega menu terbuka */}
            {openKey && (
                <div
                    aria-hidden
                    className="fixed inset-0 z-30 bg-brand-950/20 duration-200 animate-in fade-in-0"
                    onClick={() => setOpenKey(null)}
                />
            )}

            {variant === "home" ? (
                <div className="relative mx-auto w-full max-w-[1600px] flex-1 px-3 pb-8 pt-5 md:px-6 md:pt-6">
                    <main>{children}</main>
                </div>
            ) : (
                <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 gap-5 px-3 pb-8 pt-5 md:px-6 md:pt-6">
                    {menuItems.length > 0 && !collapsed && (
                        <ModuleSidebar
                            title={sidebarTitle}
                            module={currentModule}
                            categories={menuItems}
                            isActive={isActiveSidebar}
                            onCollapse={collapseSidebar}
                            closing={sidebarClosing}
                        />
                    )}
                    {menuItems.length > 0 && collapsed && (
                        <SidebarTab
                            title={sidebarTitle}
                            module={currentModule}
                            onOpen={() => setSidebarCollapsed(false)}
                        />
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="relative min-h-[calc(100vh-200px)] rounded-[20px] border border-border/80 bg-card dark:border-white/[0.07]">
                            {!pageHasCrumb && <Breadcrumbs trail={trail} />}
                            <main ref={mainRef} className="app-content" data-auto-crumb={!pageHasCrumb ? "" : undefined}>
                                {children}
                            </main>
                        </div>
                    </div>
                </div>
            )}

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
