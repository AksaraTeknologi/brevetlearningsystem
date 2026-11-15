import { cn } from "@/lib/utils";
import { Link } from "@inertiajs/react";
import { LogIn } from "lucide-react";
import type { ReactNode } from "react";

/** Gaya bersama untuk form halaman auth (Login, Lupa Sandi, Register). */
export const authLabel =
    "text-[13px] font-bold text-brand-950 dark:text-white/80";
export const authInput =
    "h-11 rounded-[10px] border-border bg-card text-[15px] shadow-none md:text-[15px] dark:border-white/10 dark:bg-white/5";
export const authIcon =
    "pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-brand-900/70 dark:text-white/60";

/** Tombol "Masuk" di header kartu, seperti portal registrasi Coretax. */
export function MasukButton() {
    return (
        <Link
            href={route("login")}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-bold text-brand-950 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
            <LogIn className="size-[18px]" />
            Masuk
        </Link>
    );
}

/** Blok brand kiri (logo + judul + garis kuning + tagline). */
export function BrandBlock({
    inverted = false,
    title = (
        <>
            Sistem Pembelajaran
            <br />
            Perpajakan
        </>
    ),
    tagline = "Belajar Pajak, Siap Praktik",
}: {
    inverted?: boolean;
    title?: ReactNode;
    tagline?: ReactNode;
}) {
    return (
        <div>
            {inverted ? (
                <img
                    src="/images/logo putih.png"
                    alt="Brevet Learning System"
                    className="h-14 w-auto"
                />
            ) : (
                <>
                    <img
                        src="/images/logo.png"
                        alt="Brevet Learning System"
                        className="h-20 w-auto dark:hidden"
                    />
                    <img
                        src="/images/logo putih.png"
                        alt="Brevet Learning System"
                        className="hidden h-20 w-auto dark:block"
                    />
                </>
            )}
            <h1
                className={cn(
                    "mt-6 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] lg:text-[46px]",
                    inverted ? "text-white" : "text-brand-950 dark:text-white",
                )}
            >
                {title}
            </h1>
            <span className="mt-3 block h-1 w-14 rounded-full bg-highlight lg:w-[76px]" />
            <p
                className={cn(
                    "mt-4 text-[15px] lg:text-lg",
                    inverted
                        ? "text-white/80"
                        : "text-muted-foreground dark:text-white/60",
                )}
            >
                {tagline}
            </p>
        </div>
    );
}

/** Hero navy untuk tampilan mobile halaman auth. */
export function MobileBrandHero(props: { title?: ReactNode; tagline?: ReactNode }) {
    return (
        <div className="bg-[radial-gradient(120%_80%_at_100%_100%,#16A382_0%,#0D4D40_55%,#073129_100%)] px-6 pb-16 pt-20 dark:bg-[radial-gradient(120%_80%_at_100%_100%,#1c2b27_0%,#0d1513_70%)]">
            <BrandBlock inverted {...props} />
        </div>
    );
}

/** Kartu form kanan (desktop: kaca putih; mobile: bottom sheet). */
export const authCard =
    "-mt-8 rounded-t-[28px] bg-card px-6 pb-8 pt-8 md:mt-0 md:rounded-[22px] md:border-[1.5px] md:border-white/90 md:bg-white/80 md:px-8 md:py-9 md:shadow-[0_30px_70px_-25px_rgba(13,77,64,0.3),inset_0_1px_0_rgba(255,255,255,1)] dark:bg-[#0f1a17] md:dark:border-white/10 md:dark:bg-[#16221f] md:dark:shadow-[0_15px_30px_rgba(0,0,0,0.35)]";

/** Kartu konten besar (gaya portal registrasi Coretax). */
export function PortalCard({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className="mx-auto w-full max-w-[1600px] px-3 py-5 md:px-6 md:py-6">
            <div
                className={cn(
                    "rounded-[22px] border border-white bg-card/90 px-5 py-10 shadow-[0_20px_50px_-30px_rgba(13,77,64,0.3)] dark:border-white/10 dark:bg-[#0f1a17] md:px-12 md:py-12",
                    className,
                )}
            >
                {children}
            </div>
        </div>
    );
}
