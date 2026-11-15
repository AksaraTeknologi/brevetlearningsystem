import TeacherLayout from "@/Layouts/TeacherLayout";
import { Head, Link, router, usePage, useForm } from "@inertiajs/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/Components/ui/button";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import {
    AlignLeft,
    CalendarDays,
    CalendarX,
    ClipboardCheck,
    Copy,
    Database,
    Download,
    Eye,
    FileText,
    FileUp,
    Info,
    Layers,
    ListChecks,
    LoaderCircle,
    Pencil,
    Search,
    SlidersHorizontal,
    Target,
    Timer,
    Trash,
    Upload,
    UserPlus,
    Users,
} from "lucide-react";
import {
    CodeChip,
    IconTile,
    InfoGrid,
    MetaGrid,
    PageHeader,
    Section,
    StatGrid,
    StatTile,
    StatusPill,
    Timeline,
} from "@/Components/app-shell/kit";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/Components/layout/ConfirmDialog";
import toast from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/Components/ui/dialog";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import {
    participantColumns,
    ParticipantColumns,
} from "@/Components/layout/TestUser/columns";
import { DataTableParticipant } from "@/Components/layout/TestUser/data-table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/Components/ui/alert-dialog";
import { ReferenceLinksDisplay } from "@/Components/exam/ReferenceLinksInput";

export default function DetailTest({
    course,
    test = [],
    participants = [],
}: any) {
    //participants = []
    const { flash, errors }: any = usePage().props;
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [selectedParticipantIds, setSelectedParticipantIds] = useState<
        string[]
    >([]);
    const [addParticipantOpen, setAddParticipantOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [pdfViewOpen, setPdfViewOpen] = useState(false);
    const [deleteModulOpen, setDeleteModulOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [showScore, setShowScore] = useState(test.show_score ?? true);
    const [copiedCode, setCopiedCode] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        file: null as File | null,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    // Simpan status toggle ke localStorage
    useEffect(() => {
        localStorage.setItem(
            `test_${test.id}_show_score`,
            JSON.stringify(showScore),
        );
    }, [showScore, test.id]);

    const handleToggleShowScore = (checked: boolean) => {
        setShowScore(checked);
        router.post(
            route("teacher.updateShowScore", test.id),
            { show_score: checked },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        checked
                            ? "Nilai ditampilkan ke peserta"
                            : "Nilai disembunyikan dari peserta",
                    );
                },
                onError: () => {
                    toast.error("Gagal mengubah status tampilan nilai");
                    setShowScore(!checked); // Kembalikan state jika gagal
                },
            },
        );
    };

    const handleViewModul = () => {
        window.open(route("test.viewModul", test.id), "_blank");
    };

    const handleDeleteModul = async () => {
        try {
            router.delete(route("test.deleteModul", test.id), {
                preserveState: true,
                onSuccess: () => {
                    toast.success("Modul berhasil dihapus");
                    setDeleteModulOpen(false);
                },
                onError: (errors) => {
                    console.error("Delete errors:", errors);
                    toast.error("Gagal menghapus modul");
                },
            });
        } catch (error) {
            toast.error("Terjadi kesalahan saat menghapus modul");
            console.error("Delete modul error:", error);
        }
    };

    const handleRemoveParticipant = (participantId: string) => {
        router.delete(
            route("teacher.removeTestParticipant", [test.id, participantId]),
            {
                preserveScroll: true,
            },
        );
    };

    const handleSearchUsers = (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        fetch(
            `${route("teacher.searchUsers")}?search=${encodeURIComponent(
                query,
            )}&test_id=${test.id}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            },
        )
            .then((response) => response.json())
            .then((data) => {
                setSearchResults(data.searchResults || []);
                setIsSearching(false);
            })
            .catch((error) => {
                console.error("Search error:", error);
                setIsSearching(false);
            });
    };

    const handleAddParticipant = (userId: string) => {
        router.post(
            route("teacher.addTestParticipant", test.id),
            { user_id: userId },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setAddParticipantOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                },
            },
        );
    };

    const handleCopyCode = async () => {
        if (!test?.code) return;

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(test.code);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = test.code;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            }

            setCopiedCode(true);
            toast.success(`Kode ujian ${test.code} berhasil disalin`);

            setTimeout(() => {
                setCopiedCode(false);
            }, 1500);
        } catch (error) {
            toast.error("Gagal menyalin kode ujian");
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleSearchUsers(searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const participantsData: ParticipantColumns[] = participants.map(
        (p: any) => ({
            id: p.id,
            user: p.user,
            average_score: p.average_score,
            best_score: p.best_score,
            feedback: p.feedback,
            test_id: test.id,
            show_score: showScore, // Pass status ke columns
        }),
    );

    const totalSoalBank = Number(test.question_count ?? 0);
    const soalDitampilkan = Number(test.questions_to_show ?? totalSoalBank);
    const isCustomSoalDitampilkan =
        test.questions_to_show !== null &&
        typeof test.questions_to_show !== "undefined";
    const tanggalPelaksanaan = test.start_date
        ? `${format(new Date(test.start_date), "d MMMM yyyy", { locale: id })} - ${format(new Date(test.start_date), "HH:mm", { locale: id })}`
        : "-";
    const ujianDitutup = test.end_date
        ? `${format(new Date(test.end_date), "d MMMM yyyy", { locale: id })} - ${format(new Date(test.end_date), "HH:mm", { locale: id })}`
        : "-";

    const columns = participantColumns(handleRemoveParticipant);

    return (
        <TeacherLayout>
            <Head title={`Detail Ujian - ${test.title}`} />
            <div className="py-8 mx-auto lg:px-4">
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <Link href={route("teacher.tests")}>
                                    Daftar Ujian
                                </Link>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Detail Ujian</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <PageHeader
                        icon={ClipboardCheck}
                        eyebrow="Detail Ujian"
                        title={test.title}
                        description={test.description || undefined}
                        actions={
                            <>
                                <CodeChip code={test.code} copied={copiedCode} onCopy={handleCopyCode} />
                                <Button asChild>
                                    <Link href={route("teacher.editTest", test.id)}>
                                        <Pencil size={16} />
                                        Edit Ujian
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setOpenDeleteModal(true)}
                                >
                                    <Trash size={16} />
                                    Hapus
                                </Button>
                            </>
                        }
                    />

                    <StatGrid>
                        <StatTile icon={Timer} label="Durasi" value={`${test.duration || "-"} mnt`} tone="brand" />
                        <StatTile icon={Target} label="Passing Grade" value={test.passing_score || "-"} tone="success" />
                        <StatTile icon={Database} label="Total Soal Bank" value={totalSoalBank} tone="info" />
                        <StatTile icon={ListChecks} label="Soal Ditampilkan" value={soalDitampilkan} tone="highlight" />
                    </StatGrid>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                        <Section icon={Info} title="Informasi Ujian" className="lg:col-span-3">
                            <InfoGrid
                                items={[
                                    { icon: ClipboardCheck, label: "Nama Ujian", value: test.title || "-" },
                                    { icon: Database, label: "Bank Soal", value: test.question_bank?.name || "-" },
                                    { icon: AlignLeft, label: "Deskripsi", value: test.description || "-", full: true },
                                    { icon: CalendarDays, label: "Tanggal Pelaksanaan", value: tanggalPelaksanaan },
                                    { icon: CalendarX, label: "Ujian Ditutup", value: ujianDitutup },
                                ]}
                            />
                            <div className="mt-4">
                                <Timeline start={test.start_date} end={test.end_date} startLabel="Progres jadwal ujian" />
                            </div>
                        </Section>

                        <div className="flex flex-col gap-5 lg:col-span-2">
                            <Section icon={SlidersHorizontal} title="Pengaturan Soal">
                                <MetaGrid
                                    className="grid-cols-1 lg:grid-cols-1"
                                    items={[
                                        { icon: Database, label: "Bank Soal", value: test.question_bank?.name || "-" },
                                        { icon: Layers, label: "Total Soal Bank", value: totalSoalBank },
                                        { icon: ListChecks, label: "Soal Ditampilkan", value: soalDitampilkan },
                                    ]}
                                />
                                <p className="mt-3 text-xs text-muted-foreground">
                                    {isCustomSoalDitampilkan
                                        ? "Mode custom aktif: jumlah soal ditampilkan diatur manual."
                                        : "Mode otomatis: jumlah soal ditampilkan mengikuti total soal bank."}
                                </p>
                            </Section>

                            <Section icon={Eye} title="Tampilkan Nilai ke Peserta">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        {showScore
                                            ? "Peserta dapat melihat nilai ujian mereka"
                                            : 'Peserta hanya melihat "Selamat anda telah mengerjakan ujian"'}
                                    </p>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <Switch checked={showScore} onCheckedChange={handleToggleShowScore} />
                                        <StatusPill tone={showScore ? "success" : "steel"}>
                                            {showScore ? "Ditampilkan" : "Disembunyikan"}
                                        </StatusPill>
                                    </div>
                                </div>
                            </Section>
                        </div>
                    </div>

                    <div>
                        <div>
                            <div>
                                <ReferenceLinksDisplay links={test.reference_link} />
                            </div>
                        </div>
                    </div>

                    <div className="tls-card p-5 md:p-6">
                        <div className="flex items-center justify-between gap-2 flex-wrap md:flex-nowrap">
                            <h2 className="flex items-center gap-2.5 text-lg font-bold text-brand-950">
                                <IconTile icon={Users} size="sm" />
                                Daftar Peserta ({participants.length})
                            </h2>
                            <div className="flex items-center gap-2">
                                <Dialog
                                    open={addParticipantOpen}
                                    onOpenChange={setAddParticipantOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                        >
                                            <UserPlus size={16} />
                                            Tambah Peserta
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Tambah Peserta
                                            </DialogTitle>
                                            <DialogDescription>
                                                Cari dan tambahkan peserta ke
                                                Ujian ini.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="relative">
                                                <Search
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                                    size={16}
                                                />
                                                <Input
                                                    placeholder="Cari nama atau email peserta..."
                                                    className="pl-10"
                                                    value={searchQuery}
                                                    onChange={(e) =>
                                                        setSearchQuery(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            {/* Search Results */}
                                            <div className="max-h-64 overflow-y-auto">
                                                {isSearching && (
                                                    <div className="text-center py-4 text-muted-foreground">
                                                        Mencari...
                                                    </div>
                                                )}

                                                {!isSearching &&
                                                    searchQuery.length >= 2 &&
                                                    searchResults.length ===
                                                        0 && (
                                                        <div className="text-center py-4 text-muted-foreground">
                                                            Tidak ada peserta
                                                            ditemukan
                                                        </div>
                                                    )}

                                                {searchResults.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center justify-between p-3 border rounded hover:bg-muted/50"
                                                    >
                                                        <div>
                                                            <div className="font-medium">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleAddParticipant(
                                                                    user.id,
                                                                )
                                                            }
                                                            className="bg-success hover:bg-green-700 text-success-foreground"
                                                        >
                                                            Tambah
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <Button
                                    variant="outline"
                                    className="text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                    asChild
                                >
                                    <a
                                        href={route(
                                            "teacher.exportTestParticipants",
                                            test.id,
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2"
                                    >
                                        <FileUp size={16} />
                                        Export Excel
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
                <ConfirmDialog
                    title="Hapus Ujian"
                    description="Apakah Anda yakin ingin menghapus Ujian ini?"
                    open={openDeleteModal}
                    onClose={() => setOpenDeleteModal(false)}
                    onConfirm={() => {
                        router.delete(route("teacher.destroyTest", test.id), {
                            preserveScroll: true,
                        });
                    }}
                />
            </div>
        </TeacherLayout>
    );
}
