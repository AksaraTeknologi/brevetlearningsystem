import { Head, Link, usePage, router } from "@inertiajs/react";
import HeaderOnlyLayout from "@/Layouts/HeaderOnlyLayout";
import { Button } from "@/Components/ui/button";
import {
    AlertTriangle,
    CalendarDays,
    CalendarX,
    CheckCircle2,
    Eye,
    History,
    ListChecks,
    Lock,
    Mail,
    PlayCircle,
    Target,
    Timer,
    User as UserIcon,
} from "lucide-react";
import {
    EmptyState,
    fmtDate,
    InfoGrid,
    Notice,
    Section,
    StatusPill,
    Timeline,
    TONE,
    toneFromStatus,
} from "@/Components/app-shell/kit";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { cn } from "@/lib/utils";

function getTestStatusDisplay(serverStatus: string) {
    switch (serverStatus) {
        case 'upcoming':
            return { label: "Belum Mulai", color: "bg-muted text-muted-foreground" };
        case 'finished':
            return { label: "Selesai", color: "bg-red-100 text-destructive" };
        case 'ongoing':
            return { label: "Sedang Berlangsung", color: "bg-green-100 text-success" };
        default:
            return { label: "-", color: "bg-muted text-muted-foreground" };
    }
}

export default function TestDescription({
    test,
    pivot,
    teacher,
    lastAttempt,
    attemptHistory,
}: any) {
    const { auth, active_test }: any = usePage().props;
    const user = auth?.user;

    const status = getTestStatusDisplay(test?.test_status ?? 'ongoing');
    const isActive = active_test?.id === test?.id;
    const isSubmitted = Boolean(lastAttempt?.id);
    const hasOtherActive = active_test?.id && active_test?.id !== test?.id;
    const isClosed = test?.test_status === 'finished';
    const notStarted = test?.test_status === 'upcoming';

    const startDate = test?.start_date ? new Date(test.start_date) : null;
    const endDate = test?.end_date ? new Date(test.end_date) : null;

    const noProfilePhoto = !user?.profile_url;
    const canStart = !noProfilePhoto && !(!isActive && (Boolean(hasOtherActive) || notStarted || isClosed));
    const tone = toneFromStatus(status.label);
    const showResultLabel =
        Boolean(test?.show_score ?? true) && Boolean(test?.show_correct_answers ?? true)
            ? "Lihat Hasil & Pembahasan"
            : "Lihat Hasil";

    return (
        <HeaderOnlyLayout
            title={`${test?.title ?? "Ujian"} - ${status.label}`}
            backHref={route("tests.index")}
        >
            <Head title={`Deskripsi Ujian - ${test?.title ?? "Ujian"}`} />
            <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6">
                {/* Hero ujian */}
                <section className="relative overflow-hidden rounded-2xl bg-brand p-5 text-brand-foreground shadow-[0_20px_40px_-24px_rgba(13,77,64,0.6)] md:p-7">
                    <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-highlight/15" />
                    <span aria-hidden className="pointer-events-none absolute -bottom-20 right-24 size-40 rounded-full bg-white/5" />
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0 space-y-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
                                <span className={cn("size-1.5 rounded-full", TONE[tone].dot)} />
                                {status.label}
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{test?.title}</h1>
                            <p className="max-w-2xl text-sm text-white/75 md:text-base">{test?.description || "-"}</p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                            <Button
                                variant="highlight"
                                size="lg"
                                className="px-6"
                                disabled={!canStart}
                                onClick={() =>
                                    router.post(
                                        route("tests.start", test.id),
                                        {},
                                        { onSuccess: () => router.visit(route("tests.exam", test.id)) }
                                    )
                                }
                            >
                                <PlayCircle />
                                {isActive
                                    ? "Lanjutkan Ujian"
                                    : isSubmitted
                                    ? "Ulangi Mengerjakan"
                                    : `Mulai Ujian ${test?.title ?? "Ujian"}`}
                            </Button>
                        </div>
                    </div>
                    <div className="relative mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
                        {[
                            { icon: Timer, label: "Durasi", value: test?.duration ? `${test.duration} Menit` : "-" },
                            { icon: Target, label: "Passing Grade", value: typeof test?.passing_score === "number" ? `${test.passing_score}` : "-" },
                            { icon: ListChecks, label: "Jenis Ujian", value: "Pilihan Ganda" },
                            { icon: History, label: "Percobaan", value: Array.isArray(attemptHistory) ? `${attemptHistory.length}x` : "-" },
                        ].map((m) => (
                            <div key={m.label} className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5">
                                <m.icon className="size-4 shrink-0 text-highlight" />
                                <div className="min-w-0">
                                    <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-white/60">{m.label}</p>
                                    <p className="truncate text-sm font-semibold">{m.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {(noProfilePhoto || isClosed || hasOtherActive || notStarted) && (
                    <div className="space-y-2">
                        {noProfilePhoto && (
                            <Notice tone="warning" title="Foto Profil Diperlukan">
                                Anda harus mengunggah foto profil terlebih dahulu sebelum mengerjakan ujian.{" "}
                                <Link href={route("dashboard")} className="font-semibold underline hover:opacity-80">
                                    Upload di Dashboard →
                                </Link>
                            </Notice>
                        )}
                        {isClosed && <Notice tone="steel">Ujian telah ditutup.</Notice>}
                        {hasOtherActive && (
                            <Notice tone="destructive">
                                Anda sedang memiliki ujian aktif lain. Selesaikan terlebih dahulu.
                            </Notice>
                        )}
                        {notStarted && (
                            <Notice tone="info">
                                Ujian belum mulai. Tunggu waktu mulai untuk dapat mengerjakan.
                            </Notice>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                    <Section icon={AlertTriangle} title="Perhatian" className="lg:col-span-2">
                        <ul className="space-y-2.5">
                            {[
                                "Ujian dapat diulang selama jadwal berlangsung",
                                "Pastikan koneksi internet stabil",
                                "Tidak diperbolehkan membuka tab/aplikasi lain",
                                "Waktu akan berjalan otomatis setelah mulai",
                            ].map((t) => (
                                <li key={t} className="flex items-start gap-2.5 text-sm text-foreground">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-highlight" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </Section>

                    <Section icon={UserIcon} title="Informasi Peserta" className="lg:col-span-3">
                        <InfoGrid
                            items={[
                                { icon: UserIcon, label: "Nama", value: user?.name ?? "-" },
                                { icon: Mail, label: "Email", value: user?.email ?? "-" },
                                { icon: CalendarDays, label: "Mulai", value: fmtDate(startDate, true) },
                                { icon: CalendarX, label: "Selesai", value: fmtDate(endDate, true) },
                            ]}
                        />
                        <div className="mt-4">
                            <Timeline start={startDate} end={endDate} tone={tone} startLabel="Progres jadwal ujian" />
                        </div>
                    </Section>
                </div>

                <Section icon={History} title="Riwayat Nilai Ujian" bodyClassName={test?.show_score && attemptHistory?.length ? "p-0" : undefined}>
                    {test?.show_score ? (
                        Array.isArray(attemptHistory) && attemptHistory.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-center">Nilai</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attemptHistory.map((a: any, idx: number) => (
                                        <TableRow key={a.id}>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>{a.submitted_at ? fmtDate(a.submitted_at, true) : "-"}</TableCell>
                                            <TableCell className="text-center text-base font-bold text-brand-ink">
                                                {typeof a.score === "number" ? a.score : "-"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <StatusPill tone={a.passed ? "success" : "destructive"}>
                                                    {a.passed ? "Lulus" : "Tidak Lulus"}
                                                </StatusPill>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={route("tests.result", [test.id, a.id])}>
                                                        <Eye />
                                                        {showResultLabel}
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <EmptyState
                                icon={History}
                                title="Belum ada riwayat nilai"
                                description="Ayo mulai mengerjakan ujian ini."
                            />
                        )
                    ) : (
                        <EmptyState
                            icon={Lock}
                            title="Nilai Belum Diumumkan"
                            description="Pengajar belum mengumumkan nilai ujian ini. Silakan tunggu pengumuman dari pengajar."
                        />
                    )}
                </Section>
            </div>
        </HeaderOnlyLayout>
    );
}
