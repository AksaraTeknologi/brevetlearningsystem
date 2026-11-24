import { Button } from "@/Components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { router } from "@inertiajs/react";
import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import DateTimeField from "./DateTimeField";
import toast from "react-hot-toast";

type Props = {
    course: { id: string; end_date?: string | null };
    courseTests: any[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

// Tanggal akhir kelas "2026-12-16 23:59:59" -> objek tanggal lokal.
function parseCourseDate(value?: string | null) {
    if (!value) return null;
    const [datePart] = value.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

const toLocalInput = (date: Date, time: string) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${time}`;

export default function BulkRemedialDialog({ course, courseTests, open, onOpenChange }: Props) {
    const courseEnd = parseCourseDate(course.end_date);
    const remedialStart = courseEnd ? new Date(courseEnd.getFullYear(), courseEnd.getMonth(), courseEnd.getDate() + 1) : null;
    const suggestedEnd = courseEnd
        ? toLocalInput(new Date(courseEnd.getFullYear(), courseEnd.getMonth(), courseEnd.getDate() + 7), "23:59")
        : "";

    const [endAt, setEndAt] = useState(suggestedEnd);
    const [saving, setSaving] = useState(false);
    const activeCount = courseTests.filter((test) => test.remedial_enabled).length;

    useEffect(() => {
        if (open) setEndAt(suggestedEnd);
    }, [open, course.end_date]);

    function submit(enabled: boolean) {
        if (enabled && !endAt) {
            toast.error("Isi tanggal dan jam selesai remedial.");
            return;
        }
        setSaving(true);
        router.post(
            route("teacher.courseTests.bulkRemedial", course.id),
            {
                enabled,
                remedial_end_date: enabled ? `${endAt.replace("T", " ")}:59` : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
                onError: (errors: any) => toast.error(Object.values(errors)[0] as string),
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="size-5" />
                        Atur Remedial Semua Ujian
                    </DialogTitle>
                    <DialogDescription>
                        Berlaku untuk {courseTests.length} ujian di kelas ini. Saat ini remedial aktif di {activeCount} ujian.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-sm">
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
                        Remedial dibuka otomatis sehari setelah kelas berakhir
                        {remedialStart
                            ? ` (mulai ${remedialStart.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} pukul 00.00)`
                            : ""}
                        . Nilai lulus, durasi, dan kumpulan soal mengikuti pengaturan tiap ujian.
                    </p>
                    <div className="space-y-1">
                        <span className="font-medium">Waktu selesai remedial</span>
                        <DateTimeField value={endAt} defaultTime="23:59" onChange={setEndAt} />
                        <span className="block text-xs text-muted-foreground">
                            Usulan: akhir kelas + 7 hari. Bisa diubah sesuai kebutuhan.
                        </span>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button
                        variant="outline"
                        className="text-destructive"
                        disabled={saving || activeCount === 0}
                        onClick={() => submit(false)}
                    >
                        Matikan remedial semua
                    </Button>
                    <Button disabled={saving || courseTests.length === 0} onClick={() => submit(true)}>
                        {saving ? "Menyimpan..." : "Aktifkan remedial semua"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
