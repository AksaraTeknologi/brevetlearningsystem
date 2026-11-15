import AuthShell from "@/Components/auth/AuthShell";
import { COPYRIGHT, FlatShapes, GuestTopBar } from "@/Components/auth/AuthSplit";
import { Button } from "@/Components/ui/button";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowDown,
    ArrowRight,
    BookOpen,
    Calculator,
    FileText,
    Shield,
    TrendingUp,
    Users,
    type LucideIcon,
} from "lucide-react";

type Point = { title: string; desc: string; img: string; alt: string };
type Feature = { id: string; icon: LucideIcon; title: string; summary: string; points: Point[] };

const FEATURES: Feature[] = [
    {
        id: "kelas-section",
        icon: Users,
        title: "Fitur Kelas",
        summary: "Belajar lewat kelas interaktif yang didampingi mentor",
        points: [
            {
                title: "Kelas untuk mengakses setiap fitur",
                desc: "Setiap fitur utama seperti e-Faktur, e-Bupot, dan SPT dapat diakses melalui kelas interaktif. Peserta dapat belajar, berlatih, dan mengerjakan studi kasus sesuai topik yang dipilih, serta mendapatkan pengalaman praktik langsung sesuai kebutuhan pembelajaran.",
                img: "/images/course-type.png",
                alt: "Jenis-jenis kelas",
            },
            {
                title: "Terintegrasi dengan mentor",
                desc: "Setiap kelas didampingi oleh mentor berpengalaman yang akan memberikan penilaian, umpan balik, dan bimbingan secara langsung. Peserta dapat mendapatkan evaluasi hasil latihan untuk mempercepat pemahaman materi.",
                img: "/images/course-types-detail.png",
                alt: "Detail kelas",
            },
        ],
    },
    {
        id: "efaktur-section",
        icon: Calculator,
        title: "E-Faktur Simulation",
        summary: "Simulasi lengkap untuk pembuatan dan pengelolaan e-faktur dengan berbagai skenario transaksi",
        points: [
            {
                title: "Fitur pembuatan e-Faktur lengkap",
                desc: "Platform ini memungkinkan Anda untuk membuat berbagai jenis e-faktur termasuk pajak keluaran, pajak masukan, retur, dan dokumen perpajakan lainnya dengan mudah dan sesuai regulasi terbaru.",
                img: "/images/efaktur-types.png",
                alt: "Jenis-jenis E-Faktur",
            },
            {
                title: "Tampilan interface pembuatan faktur",
                desc: "Interface yang user-friendly dengan form yang mudah dipahami untuk input data faktur, validasi otomatis, dan preview sebelum menyimpan.",
                img: "/images/efaktur-create-form.png",
                alt: "Form Pembuatan E-Faktur",
            },
        ],
    },
    {
        id: "ebupot-section",
        icon: FileText,
        title: "E-Bupot Simulation",
        summary: "Simulasi lengkap untuk pembuatan dan pengelolaan e-bupot dengan berbagai skenario transaksi",
        points: [
            {
                title: "Fitur pembuatan e-Bupot komprehensif",
                desc: "Sistem ini mendukung pembuatan e-bupot, unifikasi, dan PPh 21/26 dengan perhitungan otomatis dan validasi sesuai ketentuan perpajakan yang berlaku.",
                img: "/images/ebupot-types.png",
                alt: "Jenis-jenis E-Bupot",
            },
            {
                title: "Tampilan interface pembuatan bupot",
                desc: "Interface yang intuitif dengan form yang mudah digunakan untuk input data pemotongan, perhitungan otomatis PPh, dan management data subjek pajak.",
                img: "/images/ebupot-create-form.png",
                alt: "Form Pembuatan E-Bupot",
            },
        ],
    },
    {
        id: "spt-section",
        icon: BookOpen,
        title: "SPT Management",
        summary: "Pengelolaan SPT Masa PPN, SPT Masa Unifikasi dan SPT Masa PPh 21/26 dengan fitur setor dan lapor terintegrasi",
        points: [
            {
                title: "Fitur pembuatan SPT terintegrasi",
                desc: "Platform ini menyediakan fitur lengkap untuk membuat SPT PPN, SPT Unifikasi, dan SPT PPh 21/26 dengan integrasi data dari e-faktur dan e-bupot, serta simulasi e-billing.",
                img: "/images/spt-types.png",
                alt: "Jenis-jenis SPT",
            },
            {
                title: "Tampilan interface pengelolaan SPT",
                desc: "Interface yang komprehensif untuk melihat, mengedit, dan mengelola SPT dengan fitur detail view, perhitungan otomatis, dan proses setor lapor yang terintegrasi.",
                img: "/images/spt-view-form.png",
                alt: "Halaman View SPT",
            },
        ],
    },
];

const AUDIENCE = [
    "Mahasiswa jurusan akuntansi dan perpajakan",
    "Praktisi perpajakan dan konsultan pajak",
    "Pegawai perusahaan bidang keuangan",
    "Siapa saja yang ingin belajar perpajakan",
];

const ADVANTAGES = [
    "Interface yang user-friendly",
    "Simulasi sesuai regulasi terbaru",
    "Integrasi dengan sistem pembayaran",
    "Laporan dan analisis yang detail",
];

const MAIN_FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: Calculator, title: "Manajemen Faktur", desc: "Buat, edit, kelola faktur dengan mudah" },
    { icon: FileText, title: "Manajemen Bupot", desc: "Buat, edit, kelola bupot dengan mudah" },
    { icon: TrendingUp, title: "SPT Terintegrasi", desc: "Sistem pelaporan SPT yang terintegrasi dengan simulasi e-billing dan deposito" },
    { icon: Shield, title: "Retur dan Koreksi", desc: "Fitur untuk melakukan retur dan pembetulan SPT" },
];

const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

function DotList({ items }: { items: string[] }) {
    return (
        <ul className="mt-3 space-y-2.5">
            {items.map((t) => (
                <li key={t} className="flex gap-2.5 text-sm text-muted-foreground">
                    <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-highlight" />
                    {t}
                </li>
            ))}
        </ul>
    );
}

export default function About() {
    return (
        <AuthShell bare>
            <Head title="Tentang Brevet Learning System" />

            <div className="mx-auto w-full max-w-[1200px] px-5 py-5 md:px-10">
                <GuestTopBar
                    logoOnDesktop
                    action={
                        <Button asChild size="sm" className="h-10 px-5">
                            <Link href={route("login")}>Masuk</Link>
                        </Button>
                    }
                />

                {/* Hero */}
                <section className="relative mt-6 overflow-hidden rounded-[28px] bg-brand px-6 py-10 text-white md:px-14 md:py-16">
                    <FlatShapes />
                    <div className="relative max-w-[640px]">
                        <span className="inline-flex items-center rounded-full bg-highlight px-3 py-1 text-xs font-bold text-highlight-foreground">
                            Tentang platform
                        </span>
                        <h1 className="mt-5 text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] md:text-[52px]">
                            Brevet Learning System
                        </h1>
                        <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">
                            Platform pembelajaran dan simulasi perpajakan yang komprehensif untuk meningkatkan pemahaman
                            dan keterampilan perpajakan.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button asChild variant="highlight" size="lg" className="h-12 px-6 font-bold">
                                <Link href={route("login")}>
                                    Masuk ke akun
                                    <ArrowRight />
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                size="lg"
                                onClick={() => scrollTo("efaktur-section")}
                                className="h-12 bg-white/10 px-6 font-bold text-white hover:bg-white/15"
                            >
                                Lihat fitur
                                <ArrowDown />
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Navigasi cepat ke tiap fitur */}
                <nav aria-label="Fitur" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {FEATURES.map(({ id, icon: Icon, title, summary }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => scrollTo(id)}
                            className="tls-card tls-card-hover flex flex-col items-start gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-5"
                        >
                            <span className="grid size-10 place-items-center rounded-full bg-highlight-soft text-highlight-foreground dark:bg-highlight/15 dark:text-highlight">
                                <Icon className="size-5" />
                            </span>
                            <span>
                                <span className="block text-sm font-bold text-foreground md:text-base">{title}</span>
                                <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground md:text-sm">
                                    {summary}
                                </span>
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Detail fitur */}
                <div className="mt-10 space-y-4">
                    {FEATURES.map(({ id, icon: Icon, title, summary, points }) => (
                        <section key={id} id={id} className="tls-card scroll-mt-6 p-5 md:p-8">
                            <div className="flex items-start gap-3">
                                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-highlight">
                                    <Icon className="size-5" />
                                </span>
                                <div>
                                    <h2 className="text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
                                        {title}
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-6 md:grid-cols-2">
                                {points.map((p, i) => (
                                    <div key={p.title} className="flex flex-col">
                                        <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                                            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-highlight text-xs font-bold text-highlight-foreground">
                                                {i + 1}
                                            </span>
                                            {p.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                                        <div className="mt-4 overflow-hidden rounded-2xl border border-border/80 bg-muted p-2">
                                            <img src={p.img} alt={p.alt} loading="lazy" className="h-auto w-full rounded-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Tentang platform */}
                <section className="tls-card mt-4 p-5 md:p-8">
                    <h2 className="text-xl font-extrabold tracking-tight text-foreground md:text-2xl">Tentang Platform</h2>
                    <div className="mt-5 grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl bg-muted p-5">
                            <h3 className="text-base font-bold text-foreground">Untuk siapa?</h3>
                            <DotList items={AUDIENCE} />
                        </div>
                        <div className="rounded-2xl bg-muted p-5">
                            <h3 className="text-base font-bold text-foreground">Keunggulan</h3>
                            <DotList items={ADVANTAGES} />
                        </div>
                    </div>

                    <h3 className="mt-8 text-base font-bold text-foreground">Fitur utama</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {MAIN_FEATURES.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="rounded-2xl border border-border/80 p-4">
                                <Icon className="size-5 text-brand-ink" />
                                <p className="mt-3 text-sm font-bold text-foreground">{title}</p>
                                <p className="mt-1 text-[13px] text-muted-foreground">{desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="relative mt-4 overflow-hidden rounded-[28px] bg-brand px-6 py-10 text-white md:flex md:items-center md:justify-between md:gap-8 md:px-14 md:py-12">
                    <FlatShapes />
                    <div className="relative">
                        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                            Siap memulai <span className="text-highlight">pembelajaran?</span>
                        </h2>
                        <p className="mt-2 text-sm text-white/70 md:text-base">
                            Bergabunglah dengan Brevet Learning System dan tingkatkan kemampuan perpajakan Anda.
                        </p>
                    </div>
                    <Button asChild variant="highlight" size="lg" className="relative mt-6 h-12 shrink-0 px-6 font-bold md:mt-0">
                        <Link href={route("login")}>
                            Kembali ke Login
                            <ArrowRight />
                        </Link>
                    </Button>
                </section>

                <p className="mt-8 text-center text-xs text-muted-foreground">{COPYRIGHT}</p>
            </div>
        </AuthShell>
    );
}
