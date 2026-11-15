import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import { Input } from "@/Components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import {
    BookOpen,
    CalendarIcon,
    CalendarRange,
    ChevronLeft,
    ChevronRight,
    RefreshCcw,
    School,
    Search,
    UserRound,
    Users,
} from "lucide-react";
import {
    Chip,
    EmptyState,
    EntityCard,
    PageHeader,
    StatusPill,
    toneFromStatus,
} from "@/Components/app-shell/kit";
import { useEffect, useMemo, useRef, useState } from "react";

type FilterState = {
    search: string;
    teacher_id: string;
    status: string;
    start_date_from: string;
    start_date_to: string;
    end_date_from: string;
    end_date_to: string;
};

const defaultFilters: FilterState = {
    search: "",
    teacher_id: "",
    status: "",
    start_date_from: "",
    start_date_to: "",
    end_date_from: "",
    end_date_to: "",
};

const toYmd = (date: Date) => {
    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60 * 1000,
    );

    return localDate.toISOString().slice(0, 10);
};

const parseYmd = (value: string) => {
    if (!value) {
        return undefined;
    }

    const [year, month, day] = value.split("-").map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(year, month - 1, day);
};

const formatFilterDateLabel = (value: string) => {
    const date = parseYmd(value);

    if (!date) {
        return "";
    }

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

const formatDate = (value?: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

const getCourseStatus = (course: any) => {
    const now = new Date();
    const startDate = course?.start_date ? new Date(course.start_date) : null;
    const endDate = course?.end_date ? new Date(course.end_date) : null;

    if (
        !startDate ||
        !endDate ||
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
    ) {
        return {
            label: "Tanpa Jadwal",
            className: "bg-muted text-foreground",
        };
    }

    if (now < startDate) {
        return {
            label: "Belum Mulai",
            className: "bg-orange-100 text-orange-700",
        };
    }

    if (now > endDate) {
        return {
            label: "Selesai",
            className: "bg-fuchsia-100 text-fuchsia-700",
        };
    }

    return {
        label: "Aktif",
        className: "bg-emerald-100 text-emerald-700",
    };
};

const normalizeFilterPayload = (filters: FilterState) => {
    return Object.fromEntries(
        Object.entries(filters).filter(
            ([, value]) => String(value).trim() !== "",
        ),
    );
};

const parseAccessRights = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value as string[];
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    return [];
};

export default function DaftarKelas({ courses, teachers, filters = {} }: any) {
    const [filterState, setFilterState] = useState<FilterState>({
        ...defaultFilters,
        ...filters,
    });
    const isFirstRender = useRef(true);
    const skipAutoFilter = useRef(false);

    const cards = courses?.data ?? [];

    const hasActiveFilter = useMemo(
        () =>
            Object.values(filterState).some(
                (value) => String(value).trim() !== "",
            ),
        [filterState],
    );

    const applyFilters = (nextFilters: FilterState) => {
        router.get(
            route("admin.courses"),
            normalizeFilterPayload(nextFilters),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (skipAutoFilter.current) {
            skipAutoFilter.current = false;
            return;
        }

        const debounce = window.setTimeout(() => {
            applyFilters(filterState);
        }, 350);

        return () => window.clearTimeout(debounce);
    }, [filterState]);

    const setFilterValue = (key: keyof FilterState, value: string) => {
        setFilterState((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const resetFilter = () => {
        skipAutoFilter.current = true;
        setFilterState(defaultFilters);
        applyFilters(defaultFilters);
    };

    return (
        <AdminLayout>
            <Head title="Daftar Kelas" />

            <div className="py-8 mx-auto max-w-xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl">
                <div className="flex flex-1 flex-col gap-4 px-4 pt-0">
                    <PageHeader icon={School} title="Daftar Kelas" description="Daftar seluruh kelas yang dibuat pemateri beserta informasi pemateri dan status jadwal." />

                    <div className="tls-card p-4 md:p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
                            <div className="xl:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        value={filterState.search}
                                        onChange={(event) =>
                                            setFilterValue(
                                                "search",
                                                event.target.value,
                                            )
                                        }
                                        className="pl-9"
                                        placeholder="Cari nama kelas atau kode"
                                    />
                                </div>
                            </div>
                            <div>
                                <Select
                                    value={filterState.teacher_id || "all"}
                                    onValueChange={(value) =>
                                        setFilterValue(
                                            "teacher_id",
                                            value === "all" ? "" : value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Pemateri" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Pemateri
                                        </SelectItem>
                                        {teachers.map((teacher: any) => (
                                            <SelectItem
                                                key={teacher.id}
                                                value={teacher.id}
                                            >
                                                {teacher.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Select
                                    value={filterState.status || "all"}
                                    onValueChange={(value) =>
                                        setFilterValue(
                                            "status",
                                            value === "all" ? "" : value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Status
                                        </SelectItem>
                                        <SelectItem value="active">
                                            Aktif
                                        </SelectItem>
                                        <SelectItem value="upcoming">
                                            Belum Mulai
                                        </SelectItem>
                                        <SelectItem value="finished">
                                            Selesai
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-2 xl:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Rentang Tanggal Mulai
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        "justify-start text-left font-normal",
                                                        !filterState.start_date_from &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {filterState.start_date_from
                                                        ? formatFilterDateLabel(
                                                              filterState.start_date_from,
                                                          )
                                                        : "Mulai dari"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    toYear={
                                                        new Date().getFullYear() +
                                                        5
                                                    }
                                                    selected={parseYmd(
                                                        filterState.start_date_from,
                                                    )}
                                                    onSelect={(date) =>
                                                        setFilterValue(
                                                            "start_date_from",
                                                            date
                                                                ? toYmd(date)
                                                                : "",
                                                        )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        "justify-start text-left font-normal",
                                                        !filterState.start_date_to &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {filterState.start_date_to
                                                        ? formatFilterDateLabel(
                                                              filterState.start_date_to,
                                                          )
                                                        : "Mulai sampai"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    toYear={
                                                        new Date().getFullYear() +
                                                        5
                                                    }
                                                    selected={parseYmd(
                                                        filterState.start_date_to,
                                                    )}
                                                    onSelect={(date) =>
                                                        setFilterValue(
                                                            "start_date_to",
                                                            date
                                                                ? toYmd(date)
                                                                : "",
                                                        )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Rentang Tanggal Selesai
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        "justify-start text-left font-normal",
                                                        !filterState.end_date_from &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {filterState.end_date_from
                                                        ? formatFilterDateLabel(
                                                              filterState.end_date_from,
                                                          )
                                                        : "Selesai dari"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    toYear={
                                                        new Date().getFullYear() +
                                                        5
                                                    }
                                                    selected={parseYmd(
                                                        filterState.end_date_from,
                                                    )}
                                                    onSelect={(date) =>
                                                        setFilterValue(
                                                            "end_date_from",
                                                            date
                                                                ? toYmd(date)
                                                                : "",
                                                        )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        "justify-start text-left font-normal",
                                                        !filterState.end_date_to &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {filterState.end_date_to
                                                        ? formatFilterDateLabel(
                                                              filterState.end_date_to,
                                                          )
                                                        : "Selesai sampai"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    toYear={
                                                        new Date().getFullYear() +
                                                        5
                                                    }
                                                    selected={parseYmd(
                                                        filterState.end_date_to,
                                                    )}
                                                    onSelect={(date) =>
                                                        setFilterValue(
                                                            "end_date_to",
                                                            date
                                                                ? toYmd(date)
                                                                : "",
                                                        )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 xl:col-span-4 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetFilter}
                                    disabled={!hasActiveFilter}
                                >
                                    Reset Filter
                                </Button>
                                <Button
                                    type="button"
                                    className="bg-highlight text-highlight-foreground hover:bg-highlight/90"
                                    onClick={() => applyFilters(filterState)}
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {cards.length === 0 && (
                                <EmptyState icon={School} title="Belum ada kelas yang ditemukan." className="col-span-full" />
                            )}

                            {cards.map((course: any) => {
                                const status = getCourseStatus(course);
                                const accessRights = parseAccessRights(
                                    course.access_rights,
                                );

                                return (
                                    <EntityCard
                                        key={course.id}
                                        tone={toneFromStatus(status.label)}
                                        icon={School}
                                        title={course.name}
                                        subtitle={course.description || "-"}
                                        badges={<Chip tone="brand" className="font-mono">{course.code}</Chip>}
                                        actions={
                                            <Button variant="outline" asChild>
                                                <Link href={route("admin.showTeacherCourse", { id: course.teacher_id, courseId: course.id })}>
                                                    <BookOpen className="h-4 w-4" />
                                                    Lihat Detail
                                                </Link>
                                            </Button>
                                        }
                                    >
                                        <div className="space-y-2 text-sm">
                                            <p className="flex items-center gap-2 text-muted-foreground"><UserRound className="size-4" /> <span className="font-semibold text-foreground">{course.user?.name || "-"}</span></p>
                                            <p className="flex items-center gap-2 text-muted-foreground"><CalendarRange className="size-4" /> {formatDate(course.start_date)} – {formatDate(course.end_date)}</p>
                                            <p className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" /> {course.participants_count ?? 0} peserta</p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            <StatusPill tone={toneFromStatus(status.label)}>{status.label}</StatusPill>
                                            {accessRights.length > 0 ? (
                                                accessRights.map((access) => (
                                                    <Chip key={`${course.id}-${access}`} tone="highlight">
                                                        {access === "efaktur" ? "e-Faktur" : access === "ebupot" ? "e-Bupot" : access}
                                                    </Chip>
                                                ))
                                            ) : (
                                                <Chip tone="steel">Tidak ada akses materi</Chip>
                                            )}
                                        </div>
                                    </EntityCard>
                                );
                            })}
                        </div>

                        {courses?.links?.length > 3 && (
                            <div className="flex flex-wrap items-center gap-2 mt-6">
                                {courses.links.map(
                                    (link: any, index: number) => {
                                        const key = `${link.label}-${index}`;
                                        const isPrevious =
                                            index === 0 ||
                                            String(link.label).includes("&laquo;") ||
                                            String(link.label).toLowerCase().includes("previous") ||
                                            String(link.label).toLowerCase().includes("sebelumnya");
                                        const isNext =
                                            index === courses.links.length - 1 ||
                                            String(link.label).includes("&raquo;") ||
                                            String(link.label).toLowerCase().includes("next") ||
                                            String(link.label).toLowerCase().includes("berikutnya");

                                        const label = String(link.label)
                                            .replace("&laquo;", "")
                                            .replace("&raquo;", "")
                                            .trim();

                                        const content = isPrevious ? (
                                            <ChevronLeft className="h-4 w-4" />
                                        ) : isNext ? (
                                            <ChevronRight className="h-4 w-4" />
                                        ) : (
                                            label
                                        );

                                        if (!link.url) {
                                            return (
                                                <span
                                                    key={key}
                                                    aria-disabled="true"
                                                    className="inline-flex items-center justify-center min-w-[36px] h-9 px-3 py-1.5 rounded-md border text-sm text-gray-400 opacity-50 cursor-not-allowed select-none"
                                                >
                                                    {content}
                                                </span>
                                            );
                                        }

                                        return (
                                            <Link
                                                key={key}
                                                href={link.url}
                                                preserveState
                                                preserveScroll
                                                 className={`inline-flex items-center justify-center min-w-[36px] h-9 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                                                    link.active
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "hover:bg-muted text-foreground bg-card"
                                                }`}
                                            >
                                                {content}
                                            </Link>
                                        );
                                    },
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
