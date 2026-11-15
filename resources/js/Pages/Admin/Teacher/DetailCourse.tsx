import { Head, Link } from "@inertiajs/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    AlignLeft,
    CalendarClock,
    CalendarRange,
    ClipboardCheck,
    Download,
    Eye,
    FileText,
    Info,
    KeyRound,
    School,
    UserRound,
    Users,
} from "lucide-react";
import {
    Chip,
    CodeChip,
    IconTile,
    InfoGrid,
    PageHeader,
    Section,
    StatGrid,
    StatTile,
    Timeline,
} from "@/Components/app-shell/kit";
import { Button } from "@/Components/ui/button";
import { DataTableParticipant } from "@/Components/layout/UserCourse/data-table";
import { ParticipantColumns } from "@/Components/layout/UserCourse/columns";
import { DataTableColumnHeader } from "@/Components/layout/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

export default function DetailCourse({
    teacherId,
    course,
    participants = [],
    courseSchedules = [],
    courseTests = [],
}: any) {
    const formatLocalDateTime = (value?: string | null) => {
        if (!value) {
            return "-";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return format(date, "d MMMM yyyy HH:mm", { locale: id });
    };

    const columns = useMemo<ColumnDef<ParticipantColumns>[]>(
        () => [
            {
                accessorKey: "no",
                header: "No",
                cell: ({ row }) => <p>{row.index + 1}</p>,
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: "user.name",
                id: "user_name",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Nama" />
                ),
                cell: ({ row }) => {
                    const user = row.original.user;
                    const getInitials = (name: string) => {
                        return (
                            name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase() || "??"
                        );
                    };

                    return (
                        <div className="flex items-center gap-3 w-[220px]">
                            {user?.profile_url ? (
                                <img
                                    src={user.profile_url}
                                    alt={`Foto profil ${user.name}`}
                                    className="h-8 w-8 rounded-xl object-cover shadow-sm ring-1 ring-border shrink-0"
                                />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-xs font-bold text-white shadow-sm shrink-0">
                                    {getInitials(user?.name || "??")}
                                </div>
                            )}
                            <p className="font-medium text-foreground">
                                {user?.name || "-"}
                            </p>
                        </div>
                    );
                },
            },
            {
                accessorKey: "user.email",
                id: "user_email",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Email" />
                ),
                cell: ({ row }) => <p>{row.original.user?.email || "-"}</p>,
            },
            {
                accessorKey: "user.phone_number",
                id: "user_phone_number",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="No. WA" />
                ),
                cell: ({ row }) => (
                    <p>{row.original.user?.phone_number || "-"}</p>
                ),
            },
            {
                accessorKey: "average_score",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Nilai" />
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        <div className="font-mono font-bold text-primary">
                            {row.original.average_score !== null &&
                            typeof row.original.average_score !== "undefined" ? (
                                row.original.average_score
                            ) : (
                                <span className="italic text-gray-400 text-sm">
                                    Belum dinilai
                                </span>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "feedback",
                header: "Feedback",
                cell: ({ row }) => (
                    <p className="w-[200px] truncate">
                        {row.original.feedback ?? "-"}
                    </p>
                ),
            },
        ],
        [],
    );

    const participantsData = useMemo<ParticipantColumns[]>(
        () =>
            participants.map((p: any) => ({
                id: p.id,
                user: p.user,
                average_score: p.average_score ?? null,
                feedback: p.feedback ?? null,
                course_id: String(course?.id ?? ""),
            })),
        [participants, course?.id],
    );

    return (
        <AdminLayout>
            <Head title={`Detail Kelas - ${course.name}`} />
            <div className="py-8 mx-auto lg:px-4">
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <Link href={route("admin.teachers")}>
                                    Daftar Pengajar
                                </Link>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <Link
                                    href={route("admin.showTeacher", teacherId)}
                                >
                                    {course.user?.name || "Pengajar"}
                                </Link>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Kelas {course.name}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <PageHeader
                        icon={School}
                        eyebrow="Detail Kelas"
                        title={course.name}
                        description={course.description && course.description !== "-" ? course.description : undefined}
                        actions={<CodeChip code={course.code || "-"} onCopy={() => navigator.clipboard?.writeText(course.code || "")} />}
                    />

                    <StatGrid>
                        <StatTile icon={CalendarClock} label="Jadwal Kelas" value={courseSchedules.length} tone="info" />
                        <StatTile icon={ClipboardCheck} label="Ujian Kelas" value={courseTests.length} tone="brand" />
                        <StatTile icon={Users} label="Peserta" value={participants.length} tone="success" />
                        <StatTile icon={FileText} label="Modul" value={course.modules_count || 0} tone="highlight" />
                    </StatGrid>

                    {/* Informasi Kelas */}
                    <Section icon={Info} title="Informasi Kelas">
                        <InfoGrid
                            items={[
                                { icon: School, label: "Nama Kelas", value: course.name },
                                {
                                    icon: UserRound,
                                    label: "Nama Pengajar",
                                    value: (
                                        <Link href={route("admin.showTeacher", teacherId)} className="text-info hover:underline">
                                            {course.user?.name || "-"}
                                        </Link>
                                    ),
                                },
                                { icon: AlignLeft, label: "Deskripsi", value: course.description || "-", full: true },
                                {
                                    icon: CalendarRange,
                                    label: "Tanggal Pelaksanaan",
                                    value: `${course.start_date ? format(new Date(course.start_date), "d MMMM yyyy", { locale: id }) : "-"} – ${course.end_date ? format(new Date(course.end_date), "d MMMM yyyy", { locale: id }) : "-"}`,
                                },
                                {
                                    icon: KeyRound,
                                    label: "Akses Materi",
                                    value: course.access_rights ? (
                                        <span className="flex flex-wrap gap-1.5">
                                            {(Array.isArray(course.access_rights) ? course.access_rights : JSON.parse(course.access_rights)).map((access: string) => (
                                                <Chip key={access} tone="highlight">
                                                    {access === "efaktur" ? "e-Faktur" : access === "ebupot" ? "e-Bupot" : access}
                                                </Chip>
                                            ))}
                                        </span>
                                    ) : (
                                        <span className="font-medium italic text-muted-foreground">Tidak ada akses materi</span>
                                    ),
                                },
                                {
                                    icon: FileText,
                                    label: "Modul",
                                    value: (
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={route("admin.showTeacherCourseModules", { teacherId: course.teacher_id, courseId: course.id })}>
                                                <FileText size={14} />
                                                Lihat Modul ({course.modules_count || "Belum ada modul"})
                                            </Link>
                                        </Button>
                                    ),
                                },
                            ]}
                        />
                        <div className="mt-4">
                            <Timeline start={course.start_date} end={course.end_date} startLabel="Progres durasi kelas" />
                        </div>
                    </Section>

                    {/* Jadwal Kelas */}
                    <div className="tls-card p-5 md:p-6 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="flex items-center gap-2.5 text-lg font-bold text-brand-950">
                                <IconTile icon={CalendarClock} size="sm" />
                                Jadwal Kelas ({courseSchedules.length})
                            </h2>
                        </div>

                        {courseSchedules.length > 0 ? (
                            <div className="space-y-2">
                                {courseSchedules.map((schedule: any) => (
                                    <div
                                        key={schedule.id}
                                        className="rounded-lg border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                                    >
                                        <div>
                                            <div className="font-semibold text-foreground">
                                                {schedule.title}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatLocalDateTime(
                                                    schedule.scheduled_at,
                                                )}
                                            </div>
                                        </div>
                                        {schedule.zoom_link ? (
                                            <a
                                                href={schedule.zoom_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm font-medium text-blue-700 hover:underline"
                                            >
                                                Buka Link Meeting
                                            </a>
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">
                                                Link meeting belum diisi
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">
                                Belum ada jadwal kelas.
                            </div>
                        )}
                    </div>

                    {/* Ujian Kelas */}
                    <div className="tls-card p-5 md:p-6 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="flex items-center gap-2.5 text-lg font-bold text-brand-950">
                                <IconTile icon={ClipboardCheck} size="sm" />
                                Ujian Kelas ({courseTests.length})
                            </h2>
                        </div>

                        {courseTests.length > 0 ? (
                            <div className="space-y-2">
                                {courseTests.map((courseTest: any) => (
                                    <div
                                        key={courseTest.id}
                                        className="rounded-xl border bg-muted/30 p-4"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                            <div>
                                                <div className="font-semibold text-foreground text-base">
                                                    {courseTest.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Bank Soal:{" "}
                                                    {courseTest.question_bank
                                                        ?.name || "-"}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 md:justify-end md:self-start">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-blue-700 border-blue-200 hover:bg-blue-50"
                                                    asChild
                                                >
                                                    <Link
                                                        href={route(
                                                            "admin.showTeacherCourseTest",
                                                            {
                                                                teacherId:
                                                                    course.teacher_id,
                                                                courseId:
                                                                    course.id,
                                                                courseTestId:
                                                                    courseTest.id,
                                                            },
                                                        )}
                                                    >
                                                        <Eye size={14} />
                                                        Detail Ujian
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <div className="rounded-md border bg-card p-2">
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                    Durasi
                                                </p>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {courseTest.duration || 0}{" "}
                                                    menit
                                                </p>
                                            </div>
                                            <div className="rounded-md border bg-card p-2">
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                    Passing Score
                                                </p>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {courseTest.passing_score ||
                                                        0}
                                                </p>
                                            </div>
                                            <div className="rounded-md border bg-card p-2 col-span-2 md:col-span-1">
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                    Soal Ditampilkan
                                                </p>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {courseTest.questions_to_show ||
                                                        "Semua"}
                                                </p>
                                            </div>
                                            <div className="rounded-md border bg-card p-2">
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                    Maksimal Pengerjaan
                                                </p>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {Number(
                                                        courseTest.max_attempts ??
                                                            0,
                                                    ) <= 0
                                                        ? "Tidak terbatas"
                                                        : courseTest.max_attempts}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            <div className="rounded-md border border-dashed bg-card p-2">
                                                Jadwal Mulai:{" "}
                                                {courseTest.start_date
                                                    ? formatLocalDateTime(
                                                          courseTest.start_date,
                                                      )
                                                    : "-"}
                                            </div>
                                            <div className="rounded-md border border-dashed bg-card p-2">
                                                Jadwal Selesai:{" "}
                                                {courseTest.end_date
                                                    ? formatLocalDateTime(
                                                          courseTest.end_date,
                                                      )
                                                    : "-"}
                                            </div>
                                        </div>

                                        {courseTest.remedial_enabled && (
                                            <div className="mt-2 rounded-md border border-rose-200 bg-rose-50/60 p-2 text-xs text-rose-800">
                                                <span className="font-semibold">
                                                    Remedial Aktif:
                                                </span>{" "}
                                                Selesai pada{" "}
                                                {formatLocalDateTime(
                                                    courseTest.remedial_end_date,
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">
                                Belum ada ujian kelas.
                            </div>
                        )}
                    </div>

                    {/* Daftar Peserta */}
                    <div className="tls-card p-5 md:p-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="flex items-center gap-2.5 text-lg font-bold text-brand-950">
                                <IconTile icon={Users} size="sm" />
                                Daftar Peserta ({participants.length})
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="text-success bg-green-50 border-green-200 hover:bg-green-100"
                                    asChild
                                >
                                    <a
                                        href={route(
                                            "admin.showTeacherCourseExportParticipants",
                                            {
                                                id: course.teacher_id,
                                                courseId: course.id,
                                            },
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Download size={16} />
                                        Ekspor Peserta (.xlsx)
                                    </a>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-info bg-blue-50 border-blue-200 hover:bg-blue-100"
                                    asChild
                                >
                                    <a
                                        href={route(
                                            "admin.showTeacherCoursePhotos",
                                            {
                                                id: course.teacher_id,
                                                courseId: course.id,
                                            },
                                        )}
                                    >
                                        <Download size={16} />
                                        Unduh Foto (.zip)
                                    </a>
                                </Button>
                            </div>
                        </div>

                        <DataTableParticipant
                            columns={columns}
                            data={participantsData}
                        />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
