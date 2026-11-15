import AuthShell from "@/Components/auth/AuthShell";
import { MasukButton, PortalCard } from "@/Components/auth/parts";
import { cn } from "@/lib/utils";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    Building2,
    FileSpreadsheet,
    Landmark,
    UserRound,
    type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";

type RegistrationType = {
    id: string;
    title: string;
    icon: LucideIcon;
    /** Warna pita atas kartu & ikon */
    band: string;
    iconColor: string;
    available: boolean;
};

const REGISTRATION_TYPES: RegistrationType[] = [
    {
        id: "individual-registration",
        title: "Perorangan",
        icon: UserRound,
        band: "bg-[#0E5B4C]",
        iconColor: "text-[#0E5B4C]",
        available: true,
    },
    {
        id: "government-agency",
        title: "Instansi Pemerintah",
        icon: Landmark,
        band: "bg-[#F5972A]",
        iconColor: "text-[#E07E10]",
        available: false,
    },
    {
        id: "coorporation",
        title: "Badan",
        icon: Building2,
        band: "bg-[#FAD45C]",
        iconColor: "text-[#C99A0A]",
        available: false,
    },
    {
        id: "foreign-vat-collector",
        title: "Pemungut PPN PMSE Luar Negeri",
        icon: FileSpreadsheet,
        band: "bg-[#F2605F]",
        iconColor: "text-[#E04545]",
        available: false,
    },
];

function TypeCard({ type }: { type: RegistrationType }) {
    const Icon = type.icon;
    return (
        <div
            className={cn(
                "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow dark:border-white/10 dark:bg-[#16221f]",
                type.available &&
                    "hover:shadow-[0_20px_40px_-20px_rgba(13,77,64,0.35)]",
            )}
        >
            <div className={cn("relative h-32", type.band)}>
                {!type.available && (
                    <span className="absolute right-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-foreground">
                        Segera Hadir
                    </span>
                )}
            </div>
            <div className="relative z-10 -mt-12 flex justify-center">
                <span className="grid size-24 place-items-center rounded-full bg-card shadow-[0_10px_25px_-10px_rgba(13,77,64,0.4)] ring-4 ring-white dark:bg-[#1e2d29] dark:ring-[#16221f]">
                    <Icon className={cn("size-11", type.iconColor)} strokeWidth={1.75} />
                </span>
            </div>
            <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-6 text-center">
                <h3 className="text-lg font-bold leading-snug text-brand-950 dark:text-white">
                    {type.title}
                </h3>
            </div>
        </div>
    );
}

export default function RegistrationPortal() {
    const { flash }: any = usePage().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const notAvailable = () =>
        toast.error("Fitur belum tersedia", {
            style: { background: "#ef4444", color: "white" },
        });

    return (
        <AuthShell headerVariant="card" headerAction={<MasukButton />} footerAlign="center">
            <Head title="Pilih Jenis Wajib Pajak" />

            <PortalCard>
                <div className="text-center">
                    <img
                        src="/images/logo.png"
                        alt="Brevet Learning System"
                        className="mx-auto h-16 w-auto dark:hidden md:h-20"
                    />
                    <img
                        src="/images/logo putih.png"
                        alt="Brevet Learning System"
                        className="mx-auto hidden h-16 w-auto dark:block md:h-20"
                    />
                    <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-brand-950 dark:text-white md:text-[34px]">
                        Persiapan Registrasi Wajib Pajak
                    </h1>
                    <p className="mx-auto mt-5 max-w-5xl text-[15px] leading-relaxed text-muted-foreground dark:text-white/60 md:text-lg">
                        Silakan pilih jenis wajib pajak yang ingin Anda
                        daftarkan sesuai dengan kategori yang paling relevan
                        dengan status perpajakan Anda. Pastikan untuk memilih
                        dengan cermat, karena setiap jenis wajib pajak memiliki
                        kewajiban perpajakan dan prosedur pendaftaran yang
                        berbeda.
                    </p>
                </div>

                <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {REGISTRATION_TYPES.map((type) => (
                        <li key={type.id}>
                            {type.available ? (
                                <Link
                                    href={`/registration-portal/${type.id}`}
                                    className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <TypeCard type={type} />
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={notAvailable}
                                    aria-disabled="true"
                                    className="block h-full w-full cursor-not-allowed rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <TypeCard type={type} />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </PortalCard>
        </AuthShell>
    );
}
