import { Link } from "@inertiajs/react";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export type FooterColumn = {
    heading: string;
    links: { label: string; href: string }[];
};

/** Footer aplikasi bergaya Coretax (identitas BLS, tanpa nama badan usaha). */
export default function AppFooter({ columns }: { columns: FooterColumn[] }) {
    return (
        <footer className="relative mt-4 border-t border-white/70 bg-card/60 dark:border-white/5 dark:bg-white/[0.02]">
            <div className="mx-auto grid max-w-[1600px] gap-10 px-6 py-12 md:px-10 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
                <div>
                    <img
                        src="/images/logo.png"
                        alt="Brevet Learning System"
                        className="h-14 w-auto dark:hidden"
                    />
                    <img
                        src="/images/logo putih.png"
                        alt="Brevet Learning System"
                        className="hidden h-14 w-auto dark:block"
                    />
                    <p className="mt-5 text-lg font-bold text-brand-950">
                        Brevet Learning System
                    </p>
                    <p className="text-[15px] font-semibold text-brand-950">
                        Sistem Pembelajaran Perpajakan
                    </p>
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                        Platform simulasi untuk belajar dan berlatih administrasi
                        perpajakan secara praktis.
                    </p>
                </div>

                {columns.map((col) => (
                    <div key={col.heading}>
                        <p className="text-[15px] font-bold text-brand-950">{col.heading}</p>
                        <ul className="mt-5 space-y-3">
                            {col.links.map((l) => (
                                <li key={`${col.heading}-${l.label}`}>
                                    <Link
                                        href={l.href}
                                        className="text-sm text-muted-foreground underline-offset-4 hover:text-brand-900 hover:underline"
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="mx-auto max-w-[1600px] border-t border-border/70 px-6 py-5 text-sm text-muted-foreground dark:border-white/10 md:px-10">
                © {new Date().getFullYear()} Brevet Learning System. Seluruh hak cipta dilindungi.
            </div>
        </footer>
    );
}

/** Tombol bulat kembali ke atas (muncul setelah menggulir). */
export function BackToTop() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const onScroll = () => setShow(window.scrollY > 480);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    if (!show) return null;

    return (
        <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Kembali ke atas"
            className="fixed bottom-6 right-6 z-40 grid size-12 place-items-center rounded-full bg-brand-900/80 text-white shadow-[0_10px_30px_-10px_rgba(13,77,64,0.6)] hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/15 dark:hover:bg-white/25"
        >
            <ArrowUp className="size-5" />
        </button>
    );
}
