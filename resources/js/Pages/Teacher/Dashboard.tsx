"use client";

import * as React from "react";
import TeacherLayout from "@/Layouts/TeacherLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import {
    BookOpen,
    BookPlus,
    CalendarClock,
    CheckCircle2,
    Clock3,
    Database,
    Flag,
    LayoutDashboard,
    School,
    Target,
    TrendingUp,
    Users,
} from "lucide-react";
import {
    EmptyState,
    PageHeader,
    StatGrid,
    StatTile,
    StatusPill,
} from "@/Components/app-shell/kit";
import { Button } from "@/Components/ui/button";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/Components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { format, isAfter, isBefore, isWithinInterval } from "date-fns";
import { id } from "date-fns/locale";

interface CourseStats {
    date: string;
    courseRegistrations: number;
    testRegistrations: number;
}

function getStatus(start: string, end: string) {
    const now = new Date();
    if (isBefore(now, new Date(start))) return "upcoming";
    if (isAfter(now, new Date(end))) return "finished";
    return "ongoing";
}

const getInitials = (name: string) =>
    name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "??";

export default function Dashboard({
    courses = [],
    courseStats = [],
}: {
    courses: any[];
    courseStats: CourseStats[];
}) {
    const { flash, auth }: any = usePage().props;
    const user = auth?.user;
    const [timeRange, setTimeRange] = React.useState("90d");
    const [filteredStats, setFilteredStats] = React.useState(courseStats);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        const now = new Date();
        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        setFilteredStats(
            courseStats.filter((stat) => {
                const statDate = new Date(stat.date);
                return statDate >= cutoffDate && statDate <= now;
            }),
        );
    }, [timeRange, courseStats]);

    const now = new Date();
    const totalKelas = courses.length;
    const kelasAktif = courses.filter((c: any) =>
        isWithinInterval(now, { start: new Date(c.start_date), end: new Date(c.end_date) }),
    ).length;
    const kelasSelesai = courses.filter((c: any) => isAfter(now, new Date(c.end_date))).length;
    const kelasBelumMulai = courses.filter((c: any) => isBefore(now, new Date(c.start_date))).length;

    const totalSchedules = courses.reduce(
        (acc: number, c: any) => acc + Number(c.course_schedules_count ?? 0),
        0,
    );
    const totalTests = courses.reduce(
        (acc: number, c: any) => acc + Number(c.course_tests_count ?? 0),
        0,
    );
    const totalParticipants = courses.reduce(
        (acc: number, c: any) => acc + Number(c.participants_count ?? 0),
        0,
    );

    const upcomingSchedules = courses
        .flatMap((c: any) =>
            (c.course_schedules ?? []).map((s: any) => ({
                ...s,
                courseName: c.name,
                courseId: c.id,
            })),
        )
        .filter((s: any) => isAfter(new Date(s.scheduled_at), now))
        .sort(
            (a: any, b: any) =>
                new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
        )
        .slice(0, 4);

    const activeAndUpcomingCourses = courses
        .filter((c: any) => getStatus(c.start_date, c.end_date) !== "finished")
        .slice(0, 4);

    const statusToneMap: Record<string, { label: string; tone: "success" | "info" | "steel" }> = {
        ongoing: { label: "Aktif", tone: "success" },
        upcoming: { label: "Belum Mulai", tone: "info" },
        finished: { label: "Selesai", tone: "steel" },
    };

    return (
        <TeacherLayout>
            <Head title="Dashboard Pengajar" />

            <div className="mx-auto max-w-xl py-8 lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl">
                <div className="flex flex-1 flex-col gap-5 px-4 pt-0">
                    {/* Identitas Pengajar & Aksi Utama */}
                    <div className="tls-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
                        <div className="flex items-center gap-4 min-w-0">
                            {user?.profile_url ? (
                                <img
                                    src={user.profile_url}
                                    alt={`Foto profil ${user.name}`}
                                    className="size-14 shrink-0 rounded-2xl object-cover shadow-sm ring-1 ring-border"
                                />
                            ) : (
                                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 text-lg font-bold text-white shadow-sm">
                                    {getInitials(user?.name || "Pengajar")}
                                </div>
                            )}
                            <PageHeader
                                icon={LayoutDashboard}
                                eyebrow="Panel Pengajar"
                                title={`Selamat datang, ${user?.name?.split(" ").slice(0, 3).join(" ") ?? "Pengajar"}`}
                                description="Pantau seluruh aktivitas kelas, jadwal, ujian, dan peserta Brevet Learning System."
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                            <Button variant="outline" asChild>
                                <Link href={route("teacher.courses")}>
                                    <School />
                                    Daftar Kelas
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={route("teacher.createCourse")}>
                                    <BookPlus />
                                    Buat Kelas Baru
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Ringkasan Statistik */}
                    <StatGrid>
                        <StatTile icon={BookOpen} label="Total Kelas" value={totalKelas} tone="brand" />
                        <StatTile icon={CheckCircle2} label="Kelas Aktif" value={kelasAktif} tone="success" />
                        <StatTile icon={Clock3} label="Belum Mulai" value={kelasBelumMulai} tone="info" />
                        <StatTile icon={Flag} label="Kelas Selesai" value={kelasSelesai} tone="steel" />
                    </StatGrid>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <StatTile icon={CalendarClock} label="Total Jadwal" value={totalSchedules} tone="info" />
                        <StatTile icon={Target} label="Total Ujian" value={totalTests} tone="highlight" />
                        <StatTile icon={Users} label="Total Peserta" value={totalParticipants} tone="brand" />
                    </div>

                    {/* Grafik & Kelas Aktif */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        <Card className="tls-card pt-0 lg:col-span-2">
                            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                                <div className="grid flex-1 gap-1">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <TrendingUp className="size-5 text-primary" />
                                        Statistik Pendaftar Kelas dan Ujian
                                    </CardTitle>
                                    <CardDescription>
                                        Menampilkan jumlah pendaftar kelas dan ujian berdasarkan rentang waktu.
                                    </CardDescription>
                                </div>
                                <Select value={timeRange} onValueChange={setTimeRange}>
                                    <SelectTrigger
                                        className="w-[160px] rounded-lg sm:ml-auto"
                                        aria-label="Pilih rentang waktu"
                                    >
                                        <SelectValue placeholder="3 Bulan Terakhir" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="90d" className="rounded-lg">
                                            3 Bulan Terakhir
                                        </SelectItem>
                                        <SelectItem value="30d" className="rounded-lg">
                                            30 Hari Terakhir
                                        </SelectItem>
                                        <SelectItem value="7d" className="rounded-lg">
                                            7 Hari Terakhir
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                                <ChartContainer
                                    config={{
                                        courseRegistrations: {
                                            label: "Pendaftar Kelas",
                                            color: "#0F8268",
                                        },
                                        testRegistrations: {
                                            label: "Pendaftar Ujian",
                                            color: "#F7B519",
                                        },
                                    }}
                                    className="aspect-auto h-[260px] w-full"
                                >
                                    <AreaChart data={filteredStats}>
                                        <defs>
                                            <linearGradient id="fillCourseBls" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#16A382" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#16A382" stopOpacity={0.04} />
                                            </linearGradient>
                                            <linearGradient id="fillTestBls" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F7B519" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#F7B519" stopOpacity={0.04} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            minTickGap={32}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return date.toLocaleDateString("id-ID", {
                                                    month: "short",
                                                    day: "numeric",
                                                });
                                            }}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={
                                                <ChartTooltipContent
                                                    labelFormatter={(value) =>
                                                        new Date(value).toLocaleDateString("id-ID", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })
                                                    }
                                                    indicator="dot"
                                                />
                                            }
                                        />
                                        <Area
                                            dataKey="courseRegistrations"
                                            name="Pendaftar Kelas"
                                            type="bump"
                                            fill="url(#fillCourseBls)"
                                            stroke="#0F8268"
                                            strokeWidth={2}
                                            stackId="1"
                                        />
                                        <Area
                                            dataKey="testRegistrations"
                                            name="Pendaftar Ujian"
                                            type="bump"
                                            fill="url(#fillTestBls)"
                                            stroke="#F7B519"
                                            strokeWidth={2}
                                            stackId="2"
                                        />
                                        <ChartLegend content={<ChartLegendContent />} />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Kelas Aktif & Mendatang */}
                        <div className="tls-card flex flex-col p-5">
                            <div className="mb-4 flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                                        Kelas
                                    </p>
                                    <h2 className="mt-0.5 text-lg font-bold text-foreground">
                                        Aktif &amp; Mendatang
                                    </h2>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={route("teacher.courses")}>Semua</Link>
                                </Button>
                            </div>

                            {activeAndUpcomingCourses.length === 0 ? (
                                <EmptyState
                                    icon={BookOpen}
                                    title="Belum ada kelas aktif"
                                    description="Buat kelas baru untuk mulai mengelola pembelajaran."
                                    action={
                                        <Button asChild size="sm">
                                            <Link href={route("teacher.createCourse")}>Buat Kelas</Link>
                                        </Button>
                                    }
                                />
                            ) : (
                                <div className="space-y-3">
                                    {activeAndUpcomingCourses.map((course: any) => {
                                        const st = getStatus(course.start_date, course.end_date);
                                        const badge = statusToneMap[st] ?? statusToneMap.upcoming;
                                        return (
                                            <Link
                                                key={course.id}
                                                href={route("teacher.showCourse", course.id)}
                                                className="block rounded-xl border border-border bg-muted/40 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/70"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="line-clamp-1 text-sm font-semibold text-foreground">
                                                        {course.name}
                                                    </p>
                                                    <StatusPill tone={badge.tone}>
                                                        {badge.label}
                                                    </StatusPill>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Users className="size-3" />
                                                        {course.participants_count ?? 0} peserta
                                                    </span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <CalendarClock className="size-3" />
                                                        {course.course_schedules_count ?? 0} jadwal
                                                    </span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <Database className="size-3" />
                                                        {course.course_tests_count ?? 0} ujian
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Jadwal Kelas Mendatang */}
                    <div className="tls-card p-5 md:p-6">
                        <div className="mb-4 flex items-center justify-between gap-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-info">
                                    Jadwal
                                </p>
                                <h2 className="mt-0.5 text-lg font-bold text-foreground">
                                    Jadwal Kelas Mendatang
                                </h2>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route("teacher.courses")}>Lihat Kelas</Link>
                            </Button>
                        </div>

                        {upcomingSchedules.length === 0 ? (
                            <EmptyState
                                icon={CalendarClock}
                                title="Belum ada jadwal mendatang"
                                description="Jadwal pertemuan kelas yang akan datang akan muncul di sini."
                            />
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {upcomingSchedules.map((s: any) => (
                                    <div
                                        key={s.id}
                                        className="rounded-xl border border-border bg-muted/40 px-4 py-3"
                                    >
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                                            {s.courseName}
                                        </p>
                                        <p className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">
                                            {s.title}
                                        </p>
                                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <CalendarClock className="size-3.5 shrink-0 text-primary" />
                                            {format(new Date(s.scheduled_at), "d MMM yyyy • HH:mm", { locale: id })}
                                        </p>
                                        {s.zoom_link && (
                                            <a
                                                href={s.zoom_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                                            >
                                                Buka Link Meeting →
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Aksi Cepat */}
                    <div className="tls-card p-5 md:p-6">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Aksi Cepat
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                                { label: "Buat Kelas", icon: BookPlus, href: route("teacher.createCourse"), variant: "default" as const },
                                { label: "Daftar Kelas", icon: School, href: route("teacher.courses"), variant: "outline" as const },
                                { label: "Daftar Peserta", icon: Users, href: route("teacher.participants"), variant: "outline" as const },
                                { label: "Bank Soal", icon: Database, href: route("teacher.questionBanks"), variant: "outline" as const },
                            ].map((a) => (
                                <Button key={a.label} variant={a.variant} asChild className="h-auto flex-col gap-2 py-4">
                                    <Link href={a.href}>
                                        <a.icon className="size-5" />
                                        <span className="text-xs font-semibold">{a.label}</span>
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </TeacherLayout>
    );
}
