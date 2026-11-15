import { Head, Link, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/Components/ui/button";
import {
    CalendarDays,
    CalendarX,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    Clock,
    PlayCircle,
    Plus,
    Trophy,
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

function getTestStatusDisplay(serverStatus: string) {
    switch (serverStatus) {
        case 'upcoming':
            return { label: "Belum Mulai", color: "text-muted-foreground bg-muted" };
        case 'finished':
            return { label: "Selesai", color: "text-destructive bg-red-100" };
        case 'ongoing':
            return { label: "Sedang Berlangsung", color: "text-success bg-green-100" };
        default:
            return { label: "-", color: "text-gray-400 bg-muted/50" };
    }
}

export default function Tests({ tests = [] }: any) {
    const { flash }: any = usePage().props;
    const active_test = usePage().props.active_test as {
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
            route("tests.join"),
            { code: classCode },
            {
                onSuccess: () => {
                    setOpen(false);
                    setClassCode("");
                },
                onFinish: () => setLoading(false),
            }
        );
    };

    const counts = {
        total: tests.length,
        ongoing: tests.filter((t: any) => (t.test_status ?? "ongoing") === "ongoing").length,
        upcoming: tests.filter((t: any) => t.test_status === "upcoming").length,
        finished: tests.filter((t: any) => t.test_status === "finished").length,
    };

    const joinDialog = (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">
                    <Plus size={18} />
                    Gabung Ujian
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gabung Ujian</DialogTitle>
                    <DialogDescription>
                        Masukkan kode Ujian yang diberikan oleh pengajar untuk
                        bergabung ke Ujian.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Input
                        placeholder="Kode Ujian"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        autoFocus
                    />
                    <Button onClick={handleJoinClass} disabled={loading || !classCode}>
                        {loading ? "Memproses..." : "Gabung"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Daftar Ujian Saya" />
            <div className="flex flex-col gap-5">
                <PageHeader
                    icon={ClipboardCheck}
                    title="Ujian Saya"
                    description="Ujian yang Anda ikuti, jadwal pelaksanaan, dan nilai terbaik Anda."
                    actions={joinDialog}
                />

                <StatGrid>
                    <StatTile icon={ClipboardList} label="Total Ujian" value={counts.total} tone="brand" />
                    <StatTile icon={PlayCircle} label="Berlangsung" value={counts.ongoing} tone="success" />
                    <StatTile icon={Clock} label="Belum Mulai" value={counts.upcoming} tone="info" />
                    <StatTile icon={CheckCircle2} label="Selesai" value={counts.finished} tone="steel" />
                </StatGrid>

                {tests.length === 0 ? (
                    <EmptyState
                        icon={ClipboardCheck}
                        title="Belum ada ujian"
                        description="Anda belum bergabung di Ujian manapun. Masukkan kode ujian dari pengajar untuk bergabung."
                        action={joinDialog}
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {tests.map((test: any) => {
                            const status = getTestStatusDisplay(test.test_status ?? "ongoing");
                            const tone = toneFromStatus(status.label);
                            const hasOtherActive =
                                active_test?.id && active_test?.id !== test.id;
                            const averageScore = test.score;

                            return (
                                <EntityCard
                                    key={test.id}
                                    tone={tone}
                                    icon={ClipboardCheck}
                                    title={test.title}
                                    subtitle={test.description || "-"}
                                    badges={<StatusPill tone={tone}>{status.label}</StatusPill>}
                                    actions={
                                        <Button
                                            variant="success"
                                            onClick={() => router.visit(route("tests.detail", test.id))}
                                            disabled={test.test_status !== "ongoing" || Boolean(hasOtherActive)}
                                        >
                                            <PlayCircle />
                                            Mulai Mengerjakan
                                        </Button>
                                    }
                                >
                                    <MetaGrid
                                        className="lg:grid-cols-3"
                                        items={[
                                            { icon: CalendarDays, label: "Dimulai", value: fmtDate(test.start_date, true) },
                                            { icon: CalendarX, label: "Ditutup", value: fmtDate(test.end_date, true) },
                                            {
                                                icon: Trophy,
                                                label: "Nilai Terbaik",
                                                value: test.show_score ? (
                                                    averageScore !== null && averageScore !== undefined ? (
                                                        <span className="text-base text-brand-ink">{averageScore}</span>
                                                    ) : (
                                                        <span className="font-medium italic text-muted-foreground">Belum dinilai</span>
                                                    )
                                                ) : (
                                                    <span className="font-medium italic text-muted-foreground">Belum diumumkan</span>
                                                ),
                                            },
                                        ]}
                                    />
                                    <Timeline start={test.start_date} end={test.end_date} tone={tone} startLabel="Progres jadwal ujian" />

                                    {status.label === "Sedang Berlangsung" ? (
                                        hasOtherActive && (
                                            <Notice tone="destructive">
                                                Anda memiliki Ujian aktif lain. Selesaikan Ujian tersebut terlebih
                                                dahulu sebelum mengerjakan Ujian ini.
                                            </Notice>
                                        )
                                    ) : status.label === "Belum Mulai" ? (
                                        <Notice tone="info">
                                            Ujian belum mulai. Tunggu waktu mulai Ujian untuk dapat mengerjakan.
                                        </Notice>
                                    ) : status.label === "Selesai" ? (
                                        <Notice tone="steel">
                                            Ujian sudah selesai. Anda tidak dapat mengerjakan Ujian ini lagi.
                                        </Notice>
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
