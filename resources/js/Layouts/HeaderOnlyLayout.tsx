import { ThemeToggle } from "@/Components/app-shell/HeaderControls";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { router } from "@inertiajs/react";
import { PropsWithChildren, ReactNode } from "react";
import { Toaster } from "react-hot-toast";

type HeaderOnlyLayoutProps = PropsWithChildren<{
    title?: ReactNode;
    backHref?: string;
    onBack?: () => void;
    right?: React.ReactNode;
    centerTitle?: boolean;
    wide?: boolean;
}>;

/**
 * Layout ringkas untuk detail ujian, hasil, dan pengerjaan ujian.
 * Header kaca bergaya sama dengan aplikasi, tanpa menu (agar fokus).
 * Logo sengaja tidak bisa diklik supaya peserta tidak keluar dari ujian.
 */
export default function HeaderOnlyLayout({
    title,
    backHref,
    onBack,
    right,
    centerTitle = false,
    wide = false,
    children,
}: HeaderOnlyLayoutProps) {
    const { theme, toggle } = useTheme();

    // Dipertahankan untuk kompatibilitas pemanggil (tombol kembali dinonaktifkan sebelumnya)
    const handleBack = () => {
        if (onBack) return onBack();
        if (backHref) return router.visit(backHref);
    };
    void handleBack;

    const titleEl = title && (
        <h1 className="truncate text-sm font-semibold text-brand-950 sm:text-base md:text-lg">
            {title}
        </h1>
    );

    return (
        <div className="relative flex min-h-screen flex-col bg-page font-sans text-foreground">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 bg-[radial-gradient(40%_35%_at_0%_0%,rgba(247,181,25,0.14),transparent_70%),radial-gradient(45%_50%_at_100%_40%,rgba(22,163,130,0.14),transparent_70%)] dark:opacity-30"
            />

            <header className="sticky top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
                <div
                    className={cn(
                        "mx-auto flex h-16 items-center gap-3 rounded-2xl border border-border/80 bg-card/90 px-4 shadow-[0_12px_40px_-18px_rgba(13,77,64,0.3)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#0f1a17]/75 md:h-[68px] md:px-6",
                        wide ? "max-w-[1600px]" : "max-w-7xl",
                    )}
                >
                    <img
                        src="/images/logo.png"
                        alt="Brevet Learning System"
                        className="h-8 w-auto shrink-0 dark:hidden md:h-10"
                    />
                    <img
                        src="/images/logo putih.png"
                        alt="Brevet Learning System"
                        className="hidden h-8 w-auto shrink-0 dark:block md:h-10"
                    />
                    <span className="hidden h-7 w-px shrink-0 bg-slate-200 dark:bg-white/10 sm:block" aria-hidden />

                    {centerTitle ? (
                        <>
                            <div className="min-w-0 flex-1 md:text-center">{titleEl}</div>
                        </>
                    ) : (
                        <div className="min-w-0 flex-1">{titleEl}</div>
                    )}

                    <div className="flex shrink-0 items-center gap-2">
                        {right}
                        <ThemeToggle theme={theme} onToggle={toggle} />
                    </div>
                </div>
            </header>

            <main className="relative flex-1">{children}</main>

            <Toaster position="top-center" containerStyle={{ zIndex: 99999 }} />
        </div>
    );
}
