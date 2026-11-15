import { cn } from "@/lib/utils";
import { Link } from "@inertiajs/react";
import { LanguageMenu, ThemeToggle } from "@/Components/app-shell/HeaderControls";
import { useForceLight, useTheme, type Theme } from "@/lib/theme";
import { PropsWithChildren, ReactNode } from "react";
import { Toaster } from "react-hot-toast";

const pillProps = { variant: "pill" as const };

export function TopControls({
    theme,
    onToggleTheme,
    showThemeToggle,
    className,
}: {
    theme: Theme;
    onToggleTheme: () => void;
    showThemeToggle: boolean;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            {showThemeToggle && (
                <ThemeToggle theme={theme} onToggle={onToggleTheme} {...pillProps} />
            )}
            <LanguageMenu {...pillProps} />
        </div>
    );
}

export default function AuthShell({
    children,
    footer,
    footerAlign = "left",
    mobileHero,
    showThemeToggle = true,
    headerVariant = "plain",
    headerAction,
    forceLight = false,
    bare = false,
}: PropsWithChildren<{
    footer?: ReactNode;
    footerAlign?: "left" | "center";
    mobileHero?: ReactNode;
    showThemeToggle?: boolean;
    /** "card": header kartu mengambang berisi logo (gaya portal registrasi Coretax) */
    headerVariant?: "plain" | "card";
    /** Tombol tambahan di kanan header kartu, mis. "Masuk" */
    headerAction?: ReactNode;
    /** Paksa mode terang (untuk halaman yang belum mendukung mode gelap) */
    forceLight?: boolean;
    /** Tanpa header & footer bawaan: halaman mengatur tata letaknya sendiri (mis. Login) */
    bare?: boolean;
}>) {
    const { theme, toggle: toggleTheme } = useTheme();
    // Dipanggil setelah useTheme agar efeknya berjalan belakangan (menimpa)
    useForceLight(forceLight);

    const controls = (className?: string) => (
        <TopControls
            theme={theme}
            onToggleTheme={toggleTheme}
            showThemeToggle={showThemeToggle}
            className={className}
        />
    );

    return (
        // Tema berlaku di seluruh aplikasi (class `dark` di <html>). Halaman yang
        // belum mendukung mode gelap memakai `forceLight` (pembungkus `.light`).
        <div className={cn(forceLight && "light")}>
            <div className="relative isolate flex min-h-svh flex-col overflow-hidden bg-page font-sans text-foreground antialiased">
                <Toaster position="top-center" />
                {bare ? (
                    <main className="relative flex flex-1 flex-col">{children}</main>
                ) : (
                <>

                {/* Header mobile bergaya hero navy (diisi oleh halaman) */}
                {mobileHero && (
                    <div className="relative md:hidden">
                        {controls("absolute right-5 top-5 z-10")}
                        {mobileHero}
                    </div>
                )}

                {headerVariant === "card" ? (
                    <header className="relative z-10 px-3 pt-3 md:px-6 md:pt-4">
                        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 dark:border-white/[0.07] md:h-[72px] md:px-6">
                            <Link href="/" aria-label="Beranda Brevet Learning System" className="shrink-0">
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
                            <div className="flex-1" />
                            {controls("hidden sm:flex")}
                            {headerAction}
                        </div>
                    </header>
                ) : (
                    <header
                        className={cn(
                            "relative z-10 w-full justify-end px-5 pt-5 md:px-10 md:pt-8",
                            mobileHero ? "hidden md:flex" : "flex",
                        )}
                    >
                        {controls()}
                    </header>
                )}

                <main className="relative z-10 flex flex-1 flex-col">
                    {children}
                </main>

                <footer
                    className={cn(
                        "relative z-10 px-5 py-5 text-sm text-muted-foreground dark:text-white/50 md:px-10",
                        footerAlign === "center"
                            ? "border-t border-border/80 bg-card text-center dark:border-white/5"
                            : "text-center md:text-left",
                    )}
                >
                    {footer ?? (
                        <>
                            © {new Date().getFullYear()} Brevet Learning System.
                            Seluruh hak cipta dilindungi.
                        </>
                    )}
                </footer>
                </>
                )}
            </div>
        </div>
    );
}
