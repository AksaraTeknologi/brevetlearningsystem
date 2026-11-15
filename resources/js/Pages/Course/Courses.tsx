import { Head, Link, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/Components/ui/button";
import {
    Award,
    BookOpen,
    CalendarCheck,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock,
    Eye,
    GraduationCap,
    PlayCircle,
    Plus,
    StopCircle,
} from "lucide-react";
import {
    EmptyState,
    EntityCard,
    fmtDate,
    MetaGrid,
    Notice,
    PageHeader,
    StatGrid,
    StatTile,
    StatusPill,
    Timeline,
    toneFromStatus,
} from "@/Components/app-shell/kit";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";

function formatLocalDateTime(value?: string | null) {
    if (!value) return "-";

    const normalized = String(value).trim();

    const matched = normalized.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
    );

    let date: Date | null = null;

    if (matched) {
        date = new Date(
            Number(matched[1]),
            Number(matched[2]) - 1,
            Number(matched[3]),
            Number(matched[4]),
            Number(matched[5]),
            Number(matched[6] ?? 0),
        );
    } else {
        const parsed = new Date(normalized);
        date = Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (!date) return "-";

    return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getCourseStatusDisplay(serverStatus: string) {
    switch (serverStatus) {
        case 'upcoming':
            return {
                label: "Belum Mulai",
                color: "border border-amber-200 bg-amber-100 text-amber-800",
            };
        case 'finished':
            return {
                label: "Selesai",
                color: "border border-rose-200 bg-rose-100 text-rose-700",
            };
        case 'ongoing':
            return {
                label: "Sedang Berlangsung",
                color: "border border-emerald-200 bg-emerald-100 text-emerald-700",
            };
        default:
            return {
                label: "-",
                color: "border border-border bg-muted text-muted-foreground",
            };
    }
}

export default function Courses({ courses = [] }: any) {
    const { flash, auth }: any = usePage().props;
    const noProfilePhoto = !auth?.user?.profile_url;
    const active_course = usePage().props.active_course as {
        id: number;
        name: string;
        access_rights: string[];
    } | null;
    const [open, setOpen] = useState(false);
    const [classCode, setClassCode] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const handleJoinClass = async () => {
        setLoading(true);
        router.post(
            route("courses.join"),
            { code: classCode },
            {
                onSuccess: () => {
                    setOpen(false);
                    setClassCode("");
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const counts = {
        total: courses.length,
        ongoing: courses.filter((c: any) => (c.course_status ?? "ongoing") === "ongoing").length,
        upcoming: courses.filter((c: any) => c.course_status === "upcoming").length,
        finished: courses.filter((c: any) => c.course_status === "finished").length,
    };

    const joinDialog = (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">
                    <Plus size={18} />
                    Gabung Kelas
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gabung Kelas</DialogTitle>
                    <DialogDescription>
                        Masukkan kode kelas yang diberikan oleh pengajar untuk
                        bergabung ke kelas.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Input
                        placeholder="Kode Kelas"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        autoFocus
                    />
                    <Button
                        onClick={handleJoinClass}
                        disabled={loading || !classCode}
                    >
                        {loading ? "Memproses..." : "Gabung"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Daftar Kelas Saya" />
            <div className="flex flex-col gap-5">
                <PageHeader
                    icon={GraduationCap}
                    title="Kelas Saya"
                    description="Kelas yang Anda ikuti beserta jadwal, nilai, dan status pengerjaannya."
                    actions={joinDialog}
                />

                <StatGrid>
                    <StatTile icon={BookOpen} label="Total Kelas" value={counts.total} tone="brand" />
                    <StatTile icon={PlayCircle} label="Berlangsung" value={counts.ongoing} tone="success" />
                    <StatTile icon={Clock} label="Belum Mulai" value={counts.upcoming} tone="info" />
                    <StatTile icon={CheckCircle2} label="Selesai" value={counts.finished} tone="steel" />
                </StatGrid>

                {courses.length === 0 ? (
                    <EmptyState
                        icon={GraduationCap}
                        title="Belum ada kelas"
                        description="Anda belum bergabung di kelas manapun. Minta kode kelas ke pengajar lalu tekan Gabung Kelas."
                        action={joinDialog}
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {courses.map((course: any) => {
                            const status = getCourseStatusDisplay(course.course_status ?? "ongoing");
                            const tone = toneFromStatus(status.label);
                            const isActive = active_course?.id === course.id;
                            const hasOtherActive =
                                active_course?.id && active_course?.id !== course.id;
                            const averageScore = course.score;
                            const nextUpcomingSchedule = course.next_schedule_upcoming;
                            const nextUpcomingTest = course.next_test_upcoming;

                            return (
                                <EntityCard
                                    key={course.id}
                                    tone={isActive ? "highlight" : tone}
                                    icon={GraduationCap}
                                    title={course.name}
                                    subtitle={course.description || "-"}
                                    badges={
                                        <>
                                            {isActive && (
                                                <StatusPill tone="highlight">Kelas Aktif</StatusPill>
                                            )}
                                            <StatusPill tone={tone}>{status.label}</StatusPill>
                                        </>
                                    }
                                    actions={
                                        <>
                                            {noProfilePhoto ? (
                                                <Button variant="outline" disabled>
                                                    <Eye />
                                                    Lihat Detail
                                                </Button>
                                            ) : (
                                                <Button variant="outline" asChild>
                                                    <Link href={route("courses.detail", course.id)}>
                                                        <Eye />
                                                        Lihat Detail
                                                    </Link>
                                                </Button>
                                            )}
                                            {!isActive ? (
                                                <Button
                                                    variant="success"
                                                    onClick={() =>
                                                        router.post(route("courses.start", course.id))
                                                    }
                                                    disabled={
                                                        noProfilePhoto ||
                                                        (course.course_status !== "ongoing" &&
                                                            !course.has_active_remedial) ||
                                                        Boolean(hasOtherActive)
                                                    }
                                                >
                                                    <PlayCircle />
                                                    Mulai Mengerjakan
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    className="border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
                                                    onClick={() => router.post(route("courses.stop"))}
                                                >
                                                    <StopCircle />
                                                    Hentikan Pengerjaan
                                                </Button>
                                            )}
                                        </>
                                    }
                                >
                                    <MetaGrid
                                        className="lg:grid-cols-3"
                                        items={[
                                            { icon: CalendarDays, label: "Mulai", value: fmtDate(course.start_date) },
                                            { icon: CalendarCheck, label: "Selesai", value: fmtDate(course.end_date) },
                                            {
                                                icon: Award,
                                                label: "Nilai",
                                                value:
                                                    averageScore !== null && averageScore !== undefined ? (
                                                        <span className="text-base text-brand-ink">{averageScore}</span>
                                                    ) : (
                                                        <span className="font-medium italic text-muted-foreground">
                                                            Belum dinilai
                                                        </span>
                                                    ),
                                            },
                                        ]}
                                    />
                                    <Timeline
                                        start={course.start_date}
                                        end={course.end_date}
                                        tone={tone}
                                        startLabel="Progres durasi kelas"
                                    />

                                    {(nextUpcomingSchedule || nextUpcomingTest) && (
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                            {nextUpcomingSchedule && (
                                                <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-sm">
                                                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-foreground">Jadwal Kelas terdekat</div>
                                                        <div className="truncate text-foreground">{nextUpcomingSchedule.title || "-"}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {formatLocalDateTime(nextUpcomingSchedule.starts_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {nextUpcomingTest && (
                                                <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-info/30 bg-info/5 p-3 text-sm">
                                                    <ClipboardList className="mt-0.5 size-4 shrink-0 text-info" />
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-info">
                                                            {nextUpcomingTest.state === "ongoing"
                                                                ? "Ujian Kelas sedang berlangsung"
                                                                : "Ujian Kelas terdekat"}
                                                        </div>
                                                        <div className="truncate text-foreground">{nextUpcomingTest.title || "-"}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {formatLocalDateTime(nextUpcomingTest.starts_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {noProfilePhoto && (
                                        <Notice tone="warning" title="Foto Profil Diperlukan">
                                            Anda harus mengunggah foto profil terlebih dahulu sebelum mengerjakan kelas.{" "}
                                            <Link href={route("dashboard")} className="font-semibold underline hover:opacity-80">
                                                Upload di Dashboard →
                                            </Link>
                                        </Notice>
                                    )}

                                    {status.label === "Sedang Berlangsung" ? (
                                        hasOtherActive && (
                                            <Notice tone="destructive">
                                                Anda memiliki kelas aktif lain. Selesaikan kelas tersebut terlebih
                                                dahulu sebelum mengerjakan kelas ini.
                                            </Notice>
                                        )
                                    ) : status.label === "Belum Mulai" ? (
                                        <Notice tone="info">
                                            Kelas belum mulai. Tunggu waktu mulai kelas untuk dapat mengerjakan.
                                        </Notice>
                                    ) : status.label === "Selesai" ? (
                                        course.has_active_remedial ? (
                                            <Notice tone="warning" title="Perlu Remedial">
                                                Terdapat ujian remedial yang perlu Anda kerjakan pada kelas ini.
                                                {course.remedial_deadline && (
                                                    <>
                                                        {" "}Batas akhir pengumpulan:{" "}
                                                        <span className="font-semibold">
                                                            {new Date(course.remedial_deadline).toLocaleString("id-ID", {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}{" "}
                                                            WIB
                                                        </span>
                                                        .
                                                    </>
                                                )}
                                            </Notice>
                                        ) : (
                                            <Notice tone="steel">
                                                Kelas sudah selesai. Anda tidak dapat mengerjakan kelas ini lagi.
                                            </Notice>
                                        )
                                    ) : null}
                                </EntityCard>
                            );
                        })}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
