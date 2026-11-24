import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { router } from "@inertiajs/react";
import axios from "axios";
import { AlertTriangle, CalendarClock, ClipboardList, Copy, Plus, RefreshCw, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import DateTimeField from "./DateTimeField";
import toast from "react-hot-toast";

type Bank = { id: string; name: string; questions_count: number; is_active: boolean };

type ScheduleRow = {
    key: string;
    title: string;
    scheduled_at: string; // "YYYY-MM-DDTHH:mm"
    zoom_link: string | null;
    origin_label?: string;
};

type TestRow = {
    key: string;
    title: string;
    question_bank_id: string;
    description: string | null;
    duration: number;
    passing_score: number;
    questions_to_show: number | null;
    max_attempts: number;
    show_score: boolean;
    show_correct_answers: boolean;
    reference_link: any;
    start_date: string;
    end_date: string;
};

type Props = {
    course: { id: string; name: string } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

let rowCounter = 0;
const nextKey = () => `row-${++rowCounter}`;

// "2026-11-14 15:00:00" -> "2026-11-14T15:00"
const toInput = (value?: string | null) => (value ? value.replace(" ", "T").slice(0, 16) : "");
// "2026-11-14T15:00" -> "2026-11-14 15:00:00"
const fromInput = (value: string, seconds = "00") => (value ? `${value.replace("T", " ")}:${seconds}` : "");

const todayText = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

function firstError(errors: Record<string, string>) {
    const values = Object.values(errors);
    return values.length > 0 ? values[0] : "Gagal menyimpan kelas baru.";
}

export default function DuplicateCourseDialog({ course, open, onOpenChange }: Props) {
    const [step, setStep] = useState<"form" | "preview">("form");
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState(todayText());
    const [withTests, setWithTests] = useState(true);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
    const [tests, setTests] = useState<TestRow[]>([]);
    const [endDate, setEndDate] = useState("");
    const [warnings, setWarnings] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setStep("form");
            setName("");
            setStartDate(todayText());
            setWithTests(true);
            setSchedules([]);
            setTests([]);
            setWarnings([]);
            setErrors({});
        }
    }, [open, course?.id]);

    if (!course) return null;

    const mapTests = (rows: any[]): TestRow[] =>
        rows.map((test) => ({
            key: nextKey(),
            title: test.title,
            question_bank_id: test.question_bank_id,
            description: test.description ?? null,
            duration: Number(test.duration ?? 0),
            passing_score: Number(test.passing_score ?? 0),
            questions_to_show: test.questions_to_show ?? null,
            max_attempts: Number(test.max_attempts ?? 0),
            show_score: test.show_score ?? true,
            show_correct_answers: test.show_correct_answers ?? false,
            reference_link: test.reference_link ?? null,
            start_date: toInput(test.start_date),
            end_date: toInput(test.end_date),
        }));

    async function loadPreview() {
        if (!startDate) {
            toast.error("Isi tanggal mulai kelas baru.");
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(route("teacher.duplicateCoursePreview", course!.id), {
                start_date: startDate,
                with_tests: withTests,
            });
            const plan = data.plan;
            setBanks(data.banks ?? []);
            setSchedules(
                (plan.schedules ?? []).map((row: any) => ({
                    key: nextKey(),
                    title: row.title,
                    scheduled_at: toInput(row.scheduled_at),
                    zoom_link: row.zoom_link ?? null,
                    origin_label: row.origin_label,
                })),
            );
            setTests(mapTests(plan.tests ?? []));
            setEndDate(toInput(plan.end_date));
            setWarnings(plan.warnings ?? []);
            if (!name.trim()) setName(data.suggested_name ?? "");
            setErrors({});
            setStep("preview");
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Gagal membuat pratinjau.");
        } finally {
            setLoading(false);
        }
    }

    async function recomputeTests() {
        const rows = schedules.filter((row) => row.title.trim() && row.scheduled_at);
        if (rows.length === 0) {
            toast.error("Jadwal masih kosong.");
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(route("teacher.duplicateCoursePreview", course!.id), {
                start_date: startDate,
                with_tests: withTests,
                schedules: rows.map((row) => ({ title: row.title, scheduled_at: fromInput(row.scheduled_at) })),
            });
            setTests(mapTests(data.plan.tests ?? []));
            setEndDate(toInput(data.plan.end_date));
            setWarnings(data.plan.warnings ?? []);
            toast.success("Ujian dan tanggal akhir kelas dihitung ulang dari jadwal.");
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Gagal menghitung ulang.");
        } finally {
            setLoading(false);
        }
    }

    function save() {
        if (!name.trim()) {
            toast.error("Isi nama kelas baru.");
            return;
        }
        setSaving(true);
        router.post(
            route("teacher.duplicateCourse", course!.id),
            {
                name: name.trim(),
                start_date: `${startDate} 00:00:00`,
                end_date: fromInput(endDate, "59"),
                schedules: schedules
                    .filter((row) => row.title.trim() || row.scheduled_at)
                    .map((row) => ({
                        title: row.title.trim(),
                        scheduled_at: fromInput(row.scheduled_at),
                        zoom_link: row.zoom_link || null,
                    })),
                course_tests: tests.map((test) => ({
                    title: test.title.trim(),
                    description: test.description,
                    question_bank_id: test.question_bank_id,
                    duration: test.duration,
                    passing_score: test.passing_score,
                    questions_to_show: test.questions_to_show,
                    max_attempts: test.max_attempts,
                    show_score: test.show_score,
                    show_correct_answers: test.show_correct_answers,
                    reference_link: test.reference_link,
                    start_date: fromInput(test.start_date),
                    end_date: fromInput(test.end_date, "59"),
                })),
            },
            {
                onError: (errs: any) => {
                    setErrors(errs);
                    toast.error(firstError(errs));
                },
                onSuccess: () => onOpenChange(false),
                onFinish: () => setSaving(false),
            },
        );
    }

    const updateSchedule = (key: string, patch: Partial<ScheduleRow>) =>
        setSchedules((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    const updateTest = (key: string, patch: Partial<TestRow>) =>
        setTests((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Copy className="size-5" />
                        Duplikat {course.name}
                    </DialogTitle>
                    <DialogDescription>
                        Jadwal disusun dari rotasi kelas sejenis yang sedang berjalan mulai tanggal yang dipilih.
                        Semua isian hanya usulan dan bisa diubah sebelum disimpan.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1 text-sm">
                        <span className="font-medium">Nama kelas baru</span>
                        <Input
                            value={name}
                            placeholder="Otomatis, mis. WEEKEND 107"
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>
                    <div className="space-y-1 text-sm">
                        <span className="font-medium">Tanggal mulai kelas</span>
                        <DateTimeField
                            withTime={false}
                            value={startDate}
                            onChange={(value) => {
                                setStartDate(value);
                                setStep("form");
                            }}
                        />
                    </div>
                    <label className="flex items-end gap-2 pb-2 text-sm">
                        <Checkbox
                            checked={withTests}
                            onCheckedChange={(checked) => {
                                setWithTests(checked === true);
                                setStep("form");
                            }}
                        />
                        <span>Buat ujian sekaligus (bisa dihapus/diubah nanti)</span>
                    </label>
                </div>

                {step === "form" && (
                    <div className="flex justify-end">
                        <Button onClick={loadPreview} disabled={loading}>
                            <CalendarClock />
                            {loading ? "Menyusun..." : "Lihat Pratinjau"}
                        </Button>
                    </div>
                )}

                {step === "preview" && (
                    <div className="space-y-5">
                        {warnings.length > 0 && (
                            <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                {warnings.map((warning) => (
                                    <p key={warning} className="flex gap-2">
                                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                        {warning}
                                    </p>
                                ))}
                            </div>
                        )}

                        <section className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 font-semibold">
                                    <CalendarClock className="size-4" /> Jadwal ({schedules.length})
                                </h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setSchedules((rows) => [
                                            ...rows,
                                            { key: nextKey(), title: "", scheduled_at: "", zoom_link: null, origin_label: "Ditambahkan manual" },
                                        ])
                                    }
                                >
                                    <Plus /> Tambah sesi
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {schedules.map((row) => (
                                    <div key={row.key} className="grid items-start gap-2 rounded-xl border p-2 sm:grid-cols-[minmax(0,1fr)_300px_auto]">
                                        <div>
                                            <Input
                                                value={row.title}
                                                placeholder="Judul sesi, mis. PPN - SESI 01"
                                                onChange={(e) => updateSchedule(row.key, { title: e.target.value })}
                                            />
                                            {row.origin_label && (
                                                <p className="mt-1 text-xs text-muted-foreground">{row.origin_label}</p>
                                            )}
                                        </div>
                                        <div>
                                            <DateTimeField
                                                value={row.scheduled_at}
                                                defaultTime="15:00"
                                                onChange={(value) => updateSchedule(row.key, { scheduled_at: value })}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => setSchedules((rows) => rows.filter((r) => r.key !== row.key))}
                                        >
                                            <Trash />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {withTests && (
                            <section className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="flex items-center gap-2 font-semibold">
                                        <ClipboardList className="size-4" /> Ujian ({tests.length})
                                    </h3>
                                    <Button variant="outline" size="sm" onClick={recomputeTests} disabled={loading}>
                                        <RefreshCw /> Hitung ulang dari jadwal
                                    </Button>
                                </div>
                                {tests.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Tidak ada ujian yang dibuat.</p>
                                )}
                                {tests.map((test) => (
                                    <div key={test.key} className="space-y-3 rounded-xl border bg-muted/20 p-3">
                                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                                            <label className="space-y-1 text-xs">
                                                <span className="text-muted-foreground">Judul ujian</span>
                                                <Input value={test.title} onChange={(e) => updateTest(test.key, { title: e.target.value })} />
                                            </label>
                                            <div className="space-y-1 text-xs">
                                                <span className="text-muted-foreground">Bank soal</span>
                                                <Select
                                                    value={test.question_bank_id || undefined}
                                                    onValueChange={(value) => updateTest(test.key, { question_bank_id: value })}
                                                >
                                                    <SelectTrigger className="h-9 rounded-xl">
                                                        <SelectValue placeholder="Pilih bank soal" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {banks.map((bank) => (
                                                            <SelectItem key={bank.id} value={bank.id}>
                                                                {bank.name} ({bank.questions_count} soal)
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="self-end text-destructive"
                                                title="Hapus ujian ini"
                                                onClick={() => setTests((rows) => rows.filter((r) => r.key !== test.key))}
                                            >
                                                <Trash />
                                            </Button>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <div className="space-y-1 text-xs">
                                                <span className="text-muted-foreground">Dibuka</span>
                                                <DateTimeField value={test.start_date} onChange={(value) => updateTest(test.key, { start_date: value })} />
                                            </div>
                                            <div className="space-y-1 text-xs">
                                                <span className="text-muted-foreground">Ditutup</span>
                                                <DateTimeField value={test.end_date} defaultTime="23:59" onChange={(value) => updateTest(test.key, { end_date: value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <label className="space-y-1 text-xs">
                                                <span className="text-muted-foreground">Nilai lulus</span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={test.passing_score}
                                                    onChange={(e) => updateTest(test.key, { passing_score: Number(e.target.value) })}
                                                />
                                            </label>
                                            <label className="space-y-1 text-xs">
                                                <span className="text-muted-foreground">Maks pengerjaan</span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={test.max_attempts}
                                                    onChange={(e) => updateTest(test.key, { max_attempts: Number(e.target.value) })}
                                                />
                                                <span className="block text-[11px] text-muted-foreground">0 = tanpa batas</span>
                                            </label>
                                            <label className="space-y-1 text-xs">
                                                <span className="text-muted-foreground">Soal ditampilkan</span>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={test.questions_to_show ?? ""}
                                                    onChange={(e) =>
                                                        updateTest(test.key, {
                                                            questions_to_show: e.target.value === "" ? null : Number(e.target.value),
                                                        })
                                                    }
                                                />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}

                        <section className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1 text-sm">
                                <span className="font-medium">Tanggal akhir kelas</span>
                                <DateTimeField value={endDate} defaultTime="23:59" onChange={setEndDate} />
                                <span className="block text-xs text-muted-foreground">
                                    Usulan = tutup ujian terakhir. Remedial terbuka otomatis sehari setelahnya bila diaktifkan.
                                </span>
                            </div>
                        </section>

                        {Object.keys(errors).length > 0 && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                                {Object.entries(errors).slice(0, 6).map(([field, message]) => (
                                    <p key={field}>{message}</p>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button onClick={save} disabled={saving || loading}>
                                <Copy />
                                {saving ? "Menyimpan..." : "Simpan Kelas Baru"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
