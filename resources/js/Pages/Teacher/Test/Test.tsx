import { Button } from "@/Components/ui/button";
import TeacherLayout from "@/Layouts/TeacherLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { format, isAfter, isBefore, isWithinInterval } from "date-fns";
import {
    BookPlus,
    CalendarClock,
    ClipboardCheck,
    Clock,
    Clock3,
    Copy,
    Database,
    Eye,
    Flag,
    Gauge,
    ListChecks,
    Pencil,
    PlayCircle,
    Target,
    Trash,
} from "lucide-react";
import {
    CodeChip,
    EmptyState,
    EntityCard,
    MetaGrid,
    PageHeader,
    StatGrid,
    StatTile,
    StatusPill,
    Timeline,
    toneFromStatus,
} from "@/Components/app-shell/kit";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { id } from "date-fns/locale";
import ConfirmDialog from "@/Components/layout/ConfirmDialog";

function getStatus(
    start: string,
    durationMinutes?: number,
    end?: string | null,
) {
    const now = new Date();
    const startDate = new Date(start);
    const hasDuration =
        typeof durationMinutes === "number" && durationMinutes > 0;
    const endDate = end
        ? new Date(end)
        : hasDuration
          ? new Date(startDate.getTime() + durationMinutes * 60 * 1000)
          : null;

    if (isBefore(now, startDate)) {
        return {
            key: "upcoming",
            label: "Belum Mulai",
            color: "bg-muted text-foreground border border-border",
        };
    }

    if (endDate) {
        if (isAfter(now, endDate))
            return {
                key: "finished",
                label: "Selesai",
                color: "bg-rose-100 text-rose-700 border border-rose-200",
            };
        if (isWithinInterval(now, { start: startDate, end: endDate }))
            return {
                key: "ongoing",
                label: "Sedang Berlangsung",
                color: "bg-emerald-100 text-emerald-700 border border-emerald-200",
            };
    } else {
        // Tanpa durasi, setelah mulai dianggap sedang berlangsung
        return {
            key: "ongoing",
            label: "Sedang Berlangsung",
            color: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        };
    }

    return {
        key: "unknown",
        label: "-",
        color: "bg-muted text-muted-foreground border border-border",
    };
}

function formatDateTime(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    return `${format(date, "d MMMM yyyy", { locale: id })} • ${format(date, "HH:mm", { locale: id })}`;
}

export default function Test({ tests = [], user }: any) {
    const { flash }: any = usePage().props;
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
    const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    function handleDeleteSelected() {
        if (selectedTestId) {
            router.delete(route("teacher.destroyTest", selectedTestId));
            setOpenDeleteModal(false);
            setSelectedTestId(null);
        }
    }

    async function handleCopyCode(testId: string, code: string) {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(code);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = code;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            }

            setCopiedCodeId(testId);
            toast.success(`Kode ujian ${code} berhasil disalin`);

            setTimeout(() => {
                setCopiedCodeId((current) =>
                    current === testId ? null : current,
                );
            }, 1500);
        } catch (error) {
            toast.error("Gagal menyalin kode ujian");
        }
    }

    const canCreateMore =
        typeof user?.max_test !== "number" || tests.length < user.max_test;

    const testsWithStatus = tests.map((test: any) => ({
        ...test,
        status: getStatus(
            test.start_date,
            test.duration,
            test.end_date ?? null,
        ),
    }));

    const statusSummary = testsWithStatus.reduce(
        (acc: any, test: any) => {
            if (test.status.key === "ongoing") acc.ongoing += 1;
            if (test.status.key === "upcoming") acc.upcoming += 1;
            if (test.status.key === "finished") acc.finished += 1;
            return acc;
        },
        { ongoing: 0, upcoming: 0, finished: 0 },
    );

    const remainingQuota =
        typeof user?.max_test === "number"
            ? Math.max(user.max_test - tests.length, 0)
            : null;

    const createButton = canCreateMore ? (
        <Button asChild>
            <Link href={route("teacher.createTest")}>
                <BookPlus />
                Buat Ujian Baru
            </Link>
        </Button>
    ) : (
        <Button variant="outline" disabled>
            Ujian sudah mencapai batas maksimal
        </Button>
    );

    return (
        <TeacherLayout>
            <Head title="Daftar Ujian" />
            <div className="py-8 mx-auto max-w-xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl">
                <div className="flex flex-1 flex-col gap-5 px-4 pt-0">
                    <PageHeader
                        icon={ClipboardCheck}
                        title="Daftar Ujian"
                        description="Kelola ujian Anda dalam satu tempat, lengkap dengan status pelaksanaan, pengaturan bank soal, dan aksi cepat."
                        actions={createButton}
                    />

                    <StatGrid className="lg:grid-cols-5">
                        <StatTile icon={ClipboardCheck} label="Total Ujian" value={tests.length} tone="brand" />
                        <StatTile icon={PlayCircle} label="Berlangsung" value={statusSummary.ongoing} tone="success" />
                        <StatTile icon={Clock} label="Belum Mulai" value={statusSummary.upcoming} tone="info" />
                        <StatTile icon={Flag} label="Selesai" value={statusSummary.finished} tone="steel" />
                        <StatTile icon={Gauge} label="Sisa Kuota" value={remainingQuota ?? "-"} tone="highlight" />
                    </StatGrid>

                    {tests.length === 0 ? (
                        <EmptyState
                            icon={ClipboardCheck}
                            title="Belum ada ujian"
                            description="Buat ujian, pilih bank soal, lalu bagikan kodenya ke peserta."
                            action={createButton}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {testsWithStatus.map((test: any) => {
                                const tone = toneFromStatus(test.status.label);
                                return (
                                    <EntityCard
                                        key={test.id}
                                        tone={tone}
                                        icon={ClipboardCheck}
                                        title={test.title}
                                        subtitle={test.description && test.description !== "-" ? test.description : undefined}
                                        badges={
                                            <>
                                                <CodeChip
                                                    code={test.code}
                                                    copied={copiedCodeId === test.id}
                                                    onCopy={() => handleCopyCode(test.id, test.code)}
                                                />
                                                <StatusPill tone={tone}>{test.status.label}</StatusPill>
                                            </>
                                        }
                                        actions={
                                            <>
                                                <Button asChild>
                                                    <Link href={route("teacher.showTest", test.id)}>
                                                        <Eye />
                                                        Lihat Detail
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" asChild>
                                                    <Link href={route("teacher.editTest", test.id)}>
                                                        <Pencil />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    disabled={!canCreateMore}
                                                    onClick={() => {
                                                        if (!canCreateMore) return;
                                                        router.post(route("teacher.duplicateTest", test.id));
                                                    }}
                                                >
                                                    <Copy />
                                                    Duplikat
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:ml-auto"
                                                    onClick={() => {
                                                        setSelectedTestId(test.id);
                                                        setOpenDeleteModal(true);
                                                    }}
                                                >
                                                    <Trash />
                                                    Hapus
                                                </Button>
                                            </>
                                        }
                                    >
                                        <MetaGrid
                                            items={[
                                                { icon: Clock3, label: "Durasi", value: test.duration ? `${test.duration} menit` : "Tidak terbatas" },
                                                { icon: Target, label: "Passing Score", value: `${test.passing_score || 0}%` },
                                                { icon: Database, label: "Bank Soal", value: test.question_bank?.name || "-" },
                                                {
                                                    icon: ListChecks,
                                                    label: "Soal Ditampilkan",
                                                    value: (
                                                        <>
                                                            {test.questions_to_show ?? test.question_count ?? 0}
                                                            <span className="font-normal text-muted-foreground"> / {test.question_count ?? 0}</span>
                                                        </>
                                                    ),
                                                },
                                            ]}
                                        />
                                        <Timeline
                                            start={test.start_date}
                                            end={test.end_date}
                                            tone={tone}
                                            startLabel={
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarClock className="size-3.5" />
                                                    {formatDateTime(test.start_date)}
                                                </span>
                                            }
                                            endLabel={formatDateTime(test.end_date)}
                                        />
                                    </EntityCard>
                                );
                            })}
                        </div>
                    )}

                    <ConfirmDialog
                        title="Hapus Ujian"
                        description="Apakah Anda yakin ingin menghapus Ujian ini?"
                        open={openDeleteModal}
                        onClose={() => setOpenDeleteModal(false)}
                        onConfirm={handleDeleteSelected}
                    />
                </div>
            </div>
        </TeacherLayout>
    );
}
