import AuthShell, { TopControls } from "@/Components/auth/AuthShell";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { BookOpenCheck, FileSpreadsheet, Receipt, Wallet, type LucideIcon } from "lucide-react";
import { PropsWithChildren, ReactNode } from "react";

/* Modul yang bisa dipraktikkan di BLS (ringkas, sesuai menu aplikasi) */
export const BLS_FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: Receipt, title: "e-Faktur & e-Bupot", desc: "Buat faktur dan bukti potong" },
    { icon: FileSpreadsheet, title: "SPT Masa & Tahunan", desc: "Isi, hitung, dan lapor SPT" },
    { icon: Wallet, title: "Billing & pembayaran", desc: "Kode billing dan buku besar" },
    { icon: BookOpenCheck, title: "Kelas & ujian brevet", desc: "Materi, latihan, dan nilai" },
];

export const COPYRIGHT = `© ${new Date().getFullYear()} Brevet Learning System. Seluruh hak cipta dilindungi.`;

/** Logo BLS berwarna (terang) / putih (gelap) */
export function BlsLogo({ className = "h-10" }: { className?: string }) {
    return (
        <>
            <img src="/images/logo.png" alt="Brevet Learning System" className={cn("w-auto dark:hidden", className)} />
            <img src="/images/logo putih.png" alt="Brevet Learning System" className={cn("hidden w-auto dark:block", className)} />
        </>
    );
}

/** Dekorasi geometris flat (lingkaran lime transparan) untuk blok emerald */
export function FlatShapes() {
    return (
        <>
            <span
                aria-hidden
                className="pointer-events-none absolute -bottom-32 -right-32 size-[420px] rounded-full border-[56px] border-highlight/10"
            />
            <span aria-hidden className="pointer-events-none absolute right-16 top-16 size-24 rounded-full bg-highlight/10" />
        </>
    );
}

/** Panel identitas (desktop): blok emerald flat dengan aksen lime */
function BrandPanel() {
    return (
        <aside className="relative m-4 mr-0 hidden flex-col justify-between overflow-hidden rounded-[28px] bg-brand p-10 text-white lg:flex xl:p-14">
            <FlatShapes />

            <img src="/images/logo putih.png" alt="Brevet Learning System" className="relative h-12 w-auto self-start" />

            <div className="relative max-w-[520px]">
                <span className="inline-flex items-center rounded-full bg-highlight px-3 py-1 text-xs font-bold text-highlight-foreground">
                    Simulasi perpajakan ala Coretax
                </span>
                <h1 className="mt-5 text-[44px] font-extrabold leading-[1.08] tracking-[-0.03em] xl:text-[52px]">
                    Belajar pajak,
                    <br />
                    <span className="text-highlight">siap praktik.</span>
                </h1>
                <p className="mt-4 max-w-[440px] text-base leading-relaxed text-white/70">
                    Latih alur administrasi pajak dari faktur sampai pelaporan SPT dalam satu sistem pembelajaran.
                </p>

                <ul className="mt-9 grid grid-cols-2 gap-3">
                    {BLS_FEATURES.map(({ icon: Icon, title, desc }) => (
                        <li key={title} className="flex items-start gap-3 rounded-2xl bg-white/[0.06] p-4">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-highlight text-highlight-foreground">
                                <Icon className="size-[18px]" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-sm font-bold">{title}</span>
                                <span className="block text-xs text-white/60">{desc}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <p className="relative text-xs text-white/50">{COPYRIGHT}</p>
        </aside>
    );
}

/** Bar atas halaman tamu: logo (opsional di desktop) + tema & bahasa + aksi */
export function GuestTopBar({
    logoOnDesktop = false,
    action,
}: {
    logoOnDesktop?: boolean;
    action?: ReactNode;
}) {
    const { theme, toggle } = useTheme();
    return (
        <div className="flex items-center justify-between gap-3">
            <div className={cn(!logoOnDesktop && "lg:hidden")}>
                <BlsLogo />
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <TopControls theme={theme} onToggleTheme={toggle} showThemeToggle />
                {action}
            </div>
        </div>
    );
}

/**
 * Tata letak halaman auth (Login, Lupa Kata Sandi, dll.):
 * desktop = panel emerald kiri + konten kanan selebar 400px; HP = konten saja.
 */
export default function AuthSplit({ children }: PropsWithChildren) {
    return (
        <AuthShell bare>
            <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <BrandPanel />

                <section className="flex min-h-svh flex-col px-5 py-5 md:px-10">
                    <GuestTopBar />

                    <div className="flex flex-1 items-center justify-center py-10">
                        <div className="w-full max-w-[400px]">{children}</div>
                    </div>

                    <p className="text-center text-xs text-muted-foreground lg:hidden">{COPYRIGHT}</p>
                </section>
            </div>
        </AuthShell>
    );
}

/** Kelas bersama untuk form auth */
export const authFieldInput = "h-12 rounded-xl pl-11 text-[15px] md:text-[15px]";
export const authFieldIcon =
    "pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground";
