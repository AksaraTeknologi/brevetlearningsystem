import { Button } from "@/Components/ui/button";
import Modal from "@/Components/ui/modal";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { cn } from "@/lib/utils";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    Camera,
    GraduationCap,
    Landmark,
    MoveLeft,
    School,
    Upload,
    UserRound,
    Wallet,
    X,
    type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import UpdatePasswordForm from "./Profile/Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Profile/Partials/UpdateProfileInformationForm";

type TabKey = "akun" | "kelas" | "profil";

const TABS: { key: TabKey; icon: LucideIcon; title: string; desc: string }[] = [
    {
        key: "akun",
        icon: Wallet,
        title: "Ringkasan Akun",
        desc: "Saldo deposit dan badan usaha yang Anda kelola.",
    },
    {
        key: "kelas",
        icon: School,
        title: "Kelas & Akses",
        desc: "Kelas aktif dan akses aplikasi yang tersedia untuk Anda.",
    },
    {
        key: "profil",
        icon: UserRound,
        title: "Profil Saya",
        desc: "Foto profil, data diri, NPWP, kontak, dan pengaturan kata sandi.",
    },
];

/** Kartu panel kanan (lembut bergaya Coretax). */
function Panel({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-border/80 bg-muted/40 p-5 dark:border-white/10 dark:bg-white/[0.04] md:p-6",
                className,
            )}
        >
            {children}
        </div>
    );
}

export default function Dashboard({
    mustVerifyEmail,
    status,
    ledgers = [],
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
    ledgers?: any[];
}) {
    const { flash }: any = usePage().props;
    const [tab, setTab] = useState<TabKey>("akun");
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [isPhotoModalOpen, setPhotoModalOpen] = useState(false);
    const user = usePage().props.auth.user as any;
    const active_course = usePage().props.active_course as {
        id: number;
        name: string;
        access_rights: string[];
    } | null;
    const access_rights: string[] =
        active_course && active_course.access_rights
            ? Array.isArray(active_course.access_rights)
                ? active_course.access_rights
                : JSON.parse(active_course.access_rights)
            : user.access_rights ?? [];

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

    // Unggah foto profil peserta
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const photoForm = useForm<{ profile_photo: File | null }>({
        profile_photo: null,
    });

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Ukuran gambar maksimal 2MB.");
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Format gambar harus JPG, JPEG, PNG, atau WebP.");
            return;
        }

        photoForm.setData("profile_photo", file);
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handlePhotoUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!photoForm.data.profile_photo) {
            toast.error("Silakan pilih foto terlebih dahulu.");
            return;
        }
        photoForm.post(route("profile.photo.upload"), {
            forceFormData: true,
            onSuccess: () => {
                setPhotoModalOpen(false);
                setPhotoPreview(null);
                photoForm.reset();
            },
        });
    };

    const clearPhotoPreview = () => {
        setPhotoPreview(null);
        photoForm.setData("profile_photo", null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Perhitungan saldo sama seperti sebelumnya
    const totalCredit = ledgers.reduce((t: number, l: any) => t + l.credit_amount, 0);
    const totalDebit = ledgers.reduce((t: number, l: any) => t + l.debit_amount, 0);
    const totalDebitUnpaid = ledgers.reduce((t: number, l: any) => t + l.debit_unpaid, 0);
    const saldo = totalDebit + totalCredit - totalDebitUnpaid;

    const formatCurrency = (value: number) => {
        const formattedValue = Math.abs(value).toLocaleString("id-ID");
        return `${value < 0 ? "- Rp " : "Rp "}${formattedValue}`;
    };

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const firstName = user.name?.split(" ").slice(0, 3).join(" ");

    return (
        <AuthenticatedLayout variant="home">
            <Head title="Beranda" />

            {/* ============ Hero sambutan ============ */}
            <section className="grid gap-8 rounded-[22px] border border-white bg-card/90 p-5 shadow-[0_20px_50px_-30px_rgba(13,77,64,0.28)] dark:border-white/10 md:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
                <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setPhotoModalOpen(true)}
                            title="Klik untuk ubah foto profil"
                            className="group relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-900 text-base font-bold text-white shadow-sm ring-2 ring-border transition hover:ring-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {user.profile_url ? (
                                <img
                                    src={user.profile_url}
                                    alt={`Foto profil ${user.name}`}
                                    className="size-12 object-cover"
                                />
                            ) : (
                                getInitials(user.name)
                            )}
                            <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                                <Camera className="size-4 text-white" />
                            </span>
                        </button>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground dark:text-white/70 md:text-[15px]">
                                Selamat datang,{" "}
                                <span className="font-bold text-brand-950">{firstName}</span>.
                            </p>
                            {!user.profile_url && (
                                <button
                                    type="button"
                                    onClick={() => setPhotoModalOpen(true)}
                                    className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning hover:bg-warning/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <AlertTriangle className="size-3.5 shrink-0" />
                                    Foto profil belum diunggah — Unggah sekarang
                                </button>
                            )}
                        </div>
                    </div>

                    <h1 className="mt-4 text-[24px] font-bold leading-[1.25] tracking-[-0.015em] text-brand-950 md:text-[30px]">
                        <span className="relative inline-block">
                            Brevet Learning System
                            <span
                                aria-hidden
                                className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-highlight"
                            />
                        </span>{" "}
                        siap menemani belajar perpajakan Anda.
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground dark:text-white/60 md:text-[15px]">
                        Pilih tab untuk melihat ringkasan akun, kelas, atau profil Anda.
                    </p>

                    {user.role === "admin" && (
                        <Button variant="outline" asChild className="mt-5 self-start">
                            <Link href={route("admin.dashboard")}>
                                <MoveLeft /> Kembali ke Dashboard Admin
                            </Link>
                        </Button>
                    )}

                    {/* Tab vertikal */}
                    <div role="tablist" aria-label="Ringkasan beranda" className="mt-6">
                        {TABS.map((t) => {
                            const active = tab === t.key;
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    role="tab"
                                    id={`tab-${t.key}`}
                                    aria-selected={active}
                                    aria-controls={`panel-${t.key}`}
                                    onClick={() => setTab(t.key)}
                                    className="group relative flex w-full items-start gap-3.5 border-b border-border py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10"
                                >
                                    <span
                                        className={cn(
                                            "grid size-9 shrink-0 place-items-center rounded-lg transition-colors duration-200",
                                            active
                                                ? "bg-highlight-soft text-brand-900"
                                                : "bg-muted text-slate-400 dark:bg-white/5",
                                        )}
                                    >
                                        <Icon className="size-[18px]" />
                                    </span>
                                    <span className="min-w-0">
                                        <span
                                            className={cn(
                                                "block text-base font-semibold transition-colors duration-200",
                                                active ? "text-brand-950" : "text-slate-400 group-hover:text-muted-foreground",
                                            )}
                                        >
                                            {t.title}
                                        </span>
                                        {active && (
                                            <span className="mt-0.5 block text-sm text-muted-foreground duration-300 animate-in fade-in-0">
                                                {t.desc}
                                            </span>
                                        )}
                                    </span>
                                    <span
                                        aria-hidden
                                        className={cn(
                                            "absolute -bottom-px left-0 h-[2px] rounded-full bg-highlight transition-[width] duration-300 ease-out",
                                            active ? "w-1/3" : "w-0",
                                        )}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Panel kanan sesuai tab */}
                <div
                    key={tab}
                    role="tabpanel"
                    id={`panel-${tab}`}
                    aria-labelledby={`tab-${tab}`}
                    className="flex flex-col gap-5 duration-300 ease-out animate-in fade-in-0 slide-in-from-bottom-2"
                >
                    {tab === "akun" && (
                        <>
                            <Panel className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="flex items-center gap-2 text-[15px] font-medium text-muted-foreground dark:text-white/60">
                                        <Wallet className="size-[18px]" /> Saldo Tersedia
                                    </p>
                                    <p
                                        className={cn(
                                            "mt-1.5 text-[26px] font-bold tracking-tight",
                                            saldo < 0
                                                ? "text-destructive"
                                                : saldo > 0
                                                  ? "text-success"
                                                  : "text-brand-950",
                                        )}
                                    >
                                        {formatCurrency(saldo)}
                                    </p>
                                    {saldo < 0 && (
                                        <p className="mt-1 text-sm text-destructive">
                                            Saldo Anda negatif. Silakan deposit segera.
                                        </p>
                                    )}
                                </div>
                                <Button asChild className="h-10 px-4">
                                    <Link href={route("payment.creation")}>
                                        <Wallet /> Deposit Sekarang
                                    </Link>
                                </Button>
                            </Panel>

                            <Panel className="border-[#FDE68A]/70 bg-highlight-soft/60 dark:border-highlight/20 dark:bg-highlight/[0.06]">
                                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-card text-brand-900 shadow-sm dark:bg-white/10 dark:text-white">
                                        <Building2 className="size-7" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-bold text-brand-950 md:text-xl">
                                            Kelola Badan Usaha
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground dark:text-white/60">
                                            Tambahkan badan usaha untuk berlatih sebagai wajib pajak badan
                                            (impersonate).
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button asChild>
                                                <Link href={route("business-entities.index")}>
                                                    Lihat Daftar <ArrowRight />
                                                </Link>
                                            </Button>
                                            <Button variant="outline" asChild>
                                                <Link href={route("business-entities.create")}>Tambah Badan</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Panel>
                        </>
                    )}

                    {tab === "kelas" &&
                        (active_course ? (
                            <Panel className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
                                <div>
                                    <p className="flex items-center gap-2 text-[15px] font-medium text-muted-foreground dark:text-white/60">
                                        <School className="size-[18px]" /> Kelas Aktif
                                    </p>
                                    <h2 className="mt-1.5 text-xl font-bold text-brand-950">
                                        Kelas {active_course.name}
                                    </h2>
                                    <p className="mt-4 text-sm font-semibold text-muted-foreground">Akses Materi</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {access_rights.length > 0 ? (
                                            access_rights.map((access: string) => (
                                                <span
                                                    key={access}
                                                    className="rounded-full bg-brand-900/10 px-3 py-1 text-xs font-semibold text-brand-900 dark:bg-white/10 dark:text-white"
                                                >
                                                    {access}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm italic text-slate-400">
                                                Tidak ada akses materi
                                            </span>
                                        )}
                                    </div>
                                    <Button className="mt-6 h-11 px-5" asChild>
                                        <Link href={route("courses.detail", active_course.id)}>
                                            <School /> Masuk Kelas
                                        </Link>
                                    </Button>
                                </div>
                                <img
                                    className="mx-auto w-56 md:w-64"
                                    src="/images/ilustrasi page.png"
                                    alt="Ilustrasi Brevet Learning System"
                                />
                            </Panel>
                        ) : (
                            <Panel className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
                                <div>
                                    <h2 className="text-xl font-bold leading-snug text-brand-950">
                                        Anda belum memiliki kelas yang aktif saat ini.
                                    </h2>
                                    <p className="mt-1.5 text-sm text-muted-foreground dark:text-white/60">
                                        Silakan mulai kelas untuk mendapatkan akses aplikasi BLS.
                                    </p>
                                    <Button className="mt-6 h-11 px-5" asChild>
                                        <Link href={route("courses")}>
                                            <School /> Masuk Kelas
                                        </Link>
                                    </Button>
                                </div>
                                <img
                                    className="mx-auto w-56 md:w-64"
                                    src="/images/ilustrasi page.png"
                                    alt="Ilustrasi Brevet Learning System"
                                />
                            </Panel>
                        ))}

                    {tab === "profil" && (
                        <Panel>
                            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                                <button
                                    type="button"
                                    onClick={() => setPhotoModalOpen(true)}
                                    title="Ubah foto profil"
                                    className="group relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-900 text-2xl font-bold text-white ring-2 ring-border transition hover:ring-highlight"
                                >
                                    {user.profile_url ? (
                                        <img
                                            src={user.profile_url}
                                            alt={`Foto profil ${user.name}`}
                                            className="size-16 object-cover"
                                        />
                                    ) : (
                                        getInitials(user.name)
                                    )}
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Camera className="size-5 text-white" />
                                    </span>
                                </button>
                                <div className="min-w-0 flex-1 text-center sm:text-left">
                                    <h2 className="truncate text-xl font-bold text-brand-950">{user.name}</h2>
                                    <p className="truncate text-sm text-muted-foreground dark:text-white/60">{user.email}</p>
                                    {!user.profile_url && (
                                        <p className="mt-1 text-xs font-medium text-warning">
                                            ⚠ Foto profil belum diunggah (wajib sebelum mengakses kelas).
                                        </p>
                                    )}
                                </div>
                            </div>
                            <dl className="mt-6 grid gap-4 border-t border-border pt-6 dark:border-white/10 sm:grid-cols-3">
                                {[
                                    { label: "NPWP", value: user.npwp || "-", mono: true },
                                    { label: "No. HP", value: user.phone_number || "-", mono: true },
                                    { label: "Alamat", value: user.address || "-", mono: false },
                                ].map((f) => (
                                    <div key={f.label}>
                                        <dt className="text-sm text-muted-foreground">{f.label}</dt>
                                        <dd
                                            className={cn(
                                                "mt-0.5 break-words font-semibold text-brand-950",
                                                f.mono && "tabular-nums",
                                            )}
                                        >
                                            {f.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <Button onClick={() => setProfileModalOpen(true)}>Lengkapi Data Diri</Button>
                                <Button variant="outline" onClick={() => setPhotoModalOpen(true)}>
                                    <Camera className="size-4" /> Unggah Foto Profil
                                </Button>
                                <Button variant="outline" onClick={() => setPasswordModalOpen(true)}>
                                    Ubah Password
                                </Button>
                            </div>
                        </Panel>
                    )}
                </div>
            </section>

            {/* ============ Strip layanan ============ */}
            <section className="mt-5 grid gap-2 rounded-[22px] border border-white bg-card/90 p-4 shadow-[0_20px_50px_-30px_rgba(13,77,64,0.28)] dark:border-white/10 md:p-6 lg:grid-cols-[1.5fr_repeat(2,minmax(0,1fr))] lg:divide-x lg:divide-slate-200 dark:lg:divide-white/10">
                <div className="flex items-start gap-4 p-2 lg:pr-6">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-highlight-soft text-brand-900">
                        <GraduationCap className="size-5" />
                    </span>
                    <div>
                        <p className="text-base font-bold text-brand-950">Layanan Pembelajaran</p>
                        <p className="mt-0.5 text-[13px] leading-snug text-[#C2410C] dark:text-orange-300">
                            Akses kelas dan data rekening untuk praktik perpajakan Anda.
                        </p>
                    </div>
                </div>
                {[
                    { icon: School, title: "Kelas Saya", desc: "Daftar kelas yang Anda ikuti.", href: route("courses") },
                    { icon: Landmark, title: "Bank Saya", desc: "Kelola rekening untuk simulasi.", href: route("banks") },
                ].map((s) => (
                    <Link
                        key={s.title}
                        href={s.href}
                        className="group flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/5 lg:rounded-none lg:px-6"
                    >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-highlight-soft text-brand-900">
                            <s.icon className="size-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-bold text-brand-950">{s.title}</span>
                            <span className="block text-[13px] leading-snug text-muted-foreground">{s.desc}</span>
                        </span>
                        <span className="grid size-8 shrink-0 place-items-center rounded-full border-[1.5px] border-brand-900 text-brand-900 transition-transform duration-200 group-hover:translate-x-0.5 dark:border-white/70 dark:text-white">
                            <ArrowRight className="size-4" />
                        </span>
                    </Link>
                ))}
            </section>

            <Modal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} title="Edit Profile">
                <UpdateProfileInformationForm
                    mustVerifyEmail={mustVerifyEmail}
                    status={status}
                    className="max-w-xl"
                    onSuccess={() => setProfileModalOpen(false)}
                />
            </Modal>

            <Modal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Ubah Password">
                <UpdatePasswordForm />
            </Modal>

            <Modal
                isOpen={isPhotoModalOpen}
                onClose={() => {
                    setPhotoModalOpen(false);
                    clearPhotoPreview();
                }}
                title="Upload Foto Profil"
            >
                <div className="max-w-md">
                    <p className="mb-4 text-sm text-muted-foreground">
                        Unggah foto profil Anda. Foto profil wajib diunggah sebelum mengakses kelas atau ujian.
                    </p>

                    <form onSubmit={handlePhotoUpload} className="space-y-4">
                        <div className="flex flex-col items-center gap-4">
                            {photoPreview ? (
                                <div className="relative">
                                    <img
                                        src={photoPreview}
                                        alt="Preview foto profil"
                                        className="h-32 w-32 rounded-2xl object-cover shadow-md ring-2 ring-primary/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={clearPhotoPreview}
                                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow-md transition-colors hover:bg-destructive/90"
                                        aria-label="Hapus pilihan foto"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : user.profile_url ? (
                                <img
                                    src={user.profile_url}
                                    alt="Foto profil saat ini"
                                    className="h-32 w-32 rounded-2xl object-cover shadow-md ring-2 ring-primary/30"
                                />
                            ) : (
                                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 text-5xl font-semibold text-white shadow-md ring-2 ring-primary/20">
                                    {getInitials(user.name)}
                                </div>
                            )}

                            <div
                                className="flex w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-4 transition-colors hover:border-primary/60 hover:bg-primary/10"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="flex flex-col items-center gap-1.5">
                                    <Upload className="h-6 w-6 text-primary" />
                                    <span className="text-sm font-medium text-brand-950">
                                        Klik untuk pilih foto
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        JPG, PNG, WebP • Maks 2MB
                                    </span>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handlePhotoSelect}
                            />
                        </div>

                        {photoForm.errors.profile_photo && (
                            <p className="text-sm text-destructive">
                                {photoForm.errors.profile_photo}
                            </p>
                        )}

                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                disabled={!photoForm.data.profile_photo || photoForm.processing}
                                className="flex-1"
                            >
                                {photoForm.processing ? "Mengunggah..." : "Simpan Foto"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setPhotoModalOpen(false);
                                    clearPhotoPreview();
                                }}
                            >
                                Batal
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
