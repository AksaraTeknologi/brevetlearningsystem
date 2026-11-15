import { Button } from "@/Components/ui/button";
import TeacherLayout from "@/Layouts/TeacherLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { format, isAfter, isBefore, isWithinInterval } from "date-fns";
import {
    BookPlus,
    CalendarClock,
    ClipboardList,
    Clock,
    Copy,
    Eye,
    FileText,
    Flag,
    Gauge,
    KeyRound,
    Pencil,
    PlayCircle,
    School,
    Trash,
} from "lucide-react";
import {
    Chip,
    CodeChip,
    EmptyState,
    EntityCard,
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

function getStatus(start: string, end: string) {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isBefore(now, startDate))
        return {
            key: "upcoming",
            label: "Belum Mulai",
            color: "bg-muted text-foreground border border-border",
        };
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
    return {
        key: "unknown",
        label: "-",
        color: "bg-muted text-muted-foreground border border-border",
    };
}

function parseAccessRights(value: string | null): string[] {
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item) => typeof item === "string");
    } catch {
        return [];
    }
}

function normalizeAccessLabel(access: string) {
    if (access === "efaktur") return "e-Faktur";
    if (access === "ebupot") return "e-Bupot";
    return access;
}

function formatDateRange(start?: string | null, end?: string | null) {
    const startText = start
        ? format(new Date(start), "d MMMM yyyy", { locale: id })
        : "-";
    const endText = end
        ? format(new Date(end), "d MMMM yyyy", { locale: id })
        : "-";

    return `${startText} • ${endText}`;
}

export default function Course({ courses, user }: any) {
    const { flash }: any = usePage().props;
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
        null,
    );
    const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    function handleDeleteSelected() {
        if (selectedCourseId) {
            router.delete(route("teacher.destroyCourse", selectedCourseId));
            setOpenDeleteModal(false);
            setSelectedCourseId(null);
        }
    }

    async function handleCopyCode(courseId: string, code: string) {
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

            setCopiedCodeId(courseId);
            toast.success(`Kode kelas ${code} berhasil disalin`);

            setTimeout(() => {
                setCopiedCodeId((current) =>
                    current === courseId ? null : current,
                );
            }, 1500);
        } catch {
            toast.error("Gagal menyalin kode kelas");
        }
    }

    const canCreateMore =
        typeof user?.max_class !== "number" || courses.length < user.max_class;

    const coursesWithStatus = courses.map((course: any) => ({
        ...course,
        status: getStatus(course.start_date, course.end_date),
        accessItems: parseAccessRights(course.access_rights),
    }));

    const statusSummary = coursesWithStatus.reduce(
        (acc: any, course: any) => {
            acc.schedules += Number(course.course_schedules_count ?? 0);
            acc.tests += Number(course.course_tests_count ?? 0);

            if (course.status.key === "ongoing") acc.ongoing += 1;
            if (course.status.key === "upcoming") acc.upcoming += 1;
            if (course.status.key === "finished") acc.finished += 1;
            return acc;
        },
        { ongoing: 0, upcoming: 0, finished: 0, schedules: 0, tests: 0 },
    );

    const remainingQuota =
        typeof user?.max_class === "number"
            ? Math.max(user.max_class - courses.length, 0)
            : null;

    const createButton = canCreateMore ? (
        <Button asChild>
            <Link href={route("teacher.createCourse")}>
                <BookPlus />
                Buat Kelas Baru
            </Link>
        </Button>
    ) : (
        <Button variant="outline" disabled>
            Kelas sudah mencapai batas maksimal
        </Button>
    );

    return (
        <TeacherLayout>
            <Head title="Daftar Kelas" />
            <div className="py-8 mx-auto max-w-xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl">
                <div className="flex flex-1 flex-col gap-5 px-4 pt-0">
                    <PageHeader
                        icon={School}
                        title="Daftar Kelas"
                        description="Pantau kelas aktif, jadwal pelaksanaan, akses materi, dan modul dalam satu tampilan ringkas."
                        actions={createButton}
                    />

                    <StatGrid className="lg:grid-cols-4 xl:grid-cols-7 [&>*]:p-3.5">
                        <StatTile icon={School} label="Total Kelas" value={courses.length} tone="brand" />
                        <StatTile icon={PlayCircle} label="Berlangsung" value={statusSummary.ongoing} tone="success" />
                        <StatTile icon={Clock} label="Belum Mulai" value={statusSummary.upcoming} tone="info" />
                        <StatTile icon={Flag} label="Selesai" value={statusSummary.finished} tone="steel" />
                        <StatTile icon={CalendarClock} label="Total Jadwal" value={statusSummary.schedules} tone="brand" />
                        <StatTile icon={ClipboardList} label="Total Ujian" value={statusSummary.tests} tone="warning" />
                        <StatTile icon={Gauge} label="Sisa Kuota" value={remainingQuota ?? "-"} tone="highlight" />
                    </StatGrid>

                    {courses.length === 0 ? (
                        <EmptyState
                            icon={School}
                            title="Belum ada kelas"
                            description="Buat kelas pertama Anda lalu bagikan kodenya ke peserta."
                            action={createButton}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {coursesWithStatus.map((course: any) => {
                                const tone = toneFromStatus(course.status.label);
                                return (
                                    <EntityCard
                                        key={course.id}
                                        tone={tone}
                                        icon={School}
                                        title={course.name}
                                        subtitle={course.description && course.description !== "-" ? course.description : undefined}
                                        badges={
                                            <>
                                                <CodeChip
                                                    code={course.code}
                                                    copied={copiedCodeId === course.id}
                                                    onCopy={() => handleCopyCode(course.id, course.code)}
                                                />
                                                <StatusPill tone={tone}>{course.status.label}</StatusPill>
                                            </>
                                        }
                                        actions={
                                            <>
                                                <Button asChild>
                                                    <Link href={route("teacher.showCourse", course.id)}>
                                                        <Eye />
                                                        Lihat Kelas
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" asChild>
                                                    <Link href={route("teacher.editCourse", course.id)}>
                                                        <Pencil />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    disabled={!canCreateMore}
                                                    onClick={() => {
                                                        if (!canCreateMore) return;
                                                        router.post(route("teacher.duplicateCourse", course.id));
                                                    }}
                                                >
                                                    <Copy />
                                                    Duplikat
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:ml-auto"
                                                    onClick={() => {
                                                        setSelectedCourseId(course.id);
                                                        setOpenDeleteModal(true);
                                                    }}
                                                >
                                                    <Trash />
                                                    Hapus
                                                </Button>
                                            </>
                                        }
                                    >
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <Link href={route("course.modules.index", course.id)}>
                                                {course.modules_count > 0 ? (
                                                    <Chip tone="success" icon={FileText}>Modul: {course.modules_count}</Chip>
                                                ) : (
                                                    <Chip tone="warning" icon={FileText}>Tidak ada modul</Chip>
                                                )}
                                            </Link>
                                            <Chip tone="info" icon={CalendarClock}>Jadwal: {course.course_schedules_count ?? 0}</Chip>
                                            <Chip tone="brand" icon={ClipboardList}>Ujian: {course.course_tests_count ?? 0}</Chip>
                                            <span className="mx-1 hidden h-4 w-px bg-border sm:inline-block" />
                                            {course.accessItems.length > 0 ? (
                                                course.accessItems.map((access: string) => (
                                                    <Chip key={access} tone="highlight" icon={KeyRound}>
                                                        {normalizeAccessLabel(access)}
                                                    </Chip>
                                                ))
                                            ) : (
                                                <span className="text-xs italic text-muted-foreground">Tidak ada akses materi</span>
                                            )}
                                        </div>
                                        <Timeline
                                            start={course.start_date}
                                            end={course.end_date}
                                            tone={tone}
                                            startLabel={
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarClock className="size-3.5" />
                                                    {formatDateRange(course.start_date, course.end_date)}
                                                </span>
                                            }
                                        />
                                    </EntityCard>
                                );
                            })}
                        </div>
                    )}

                    <ConfirmDialog
                        title="Hapus Kelas"
                        description="Apakah Anda yakin ingin menghapus kelas ini?"
                        open={openDeleteModal}
                        onClose={() => setOpenDeleteModal(false)}
                        onConfirm={handleDeleteSelected}
                    />
                </div>
            </div>
        </TeacherLayout>
    );
}
