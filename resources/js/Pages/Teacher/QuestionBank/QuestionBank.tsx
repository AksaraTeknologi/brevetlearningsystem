import ConfirmDialog from "@/Components/layout/ConfirmDialog";
import { Button } from "@/Components/ui/button";
import TeacherLayout from "@/Layouts/TeacherLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    BookOpen,
    CheckCircle2,
    CircleOff,
    Database,
    Layers,
    Pencil,
    Plus,
    Trash,
} from "lucide-react";
import {
    EmptyState,
    EntityCard,
    MetaGrid,
    PageHeader,
    StatGrid,
    StatTile,
    StatusPill,
} from "@/Components/app-shell/kit";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type QuestionBank = {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    tests_count: number;
};

export default function QuestionBank({
    questionBanks = [],
}: {
    questionBanks: QuestionBank[];
}) {
    const { flash }: any = usePage().props;
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const handleDelete = () => {
        if (!selectedBankId) return;

        router.delete(route("teacher.destroyQuestionBank", selectedBankId), {
            preserveScroll: true,
            onSuccess: () => {
                setOpenDeleteModal(false);
                setSelectedBankId(null);
            },
        });
    };

    const totalBanks = questionBanks.length;
    const activeBanks = questionBanks.filter((bank) => bank.is_active).length;
    const nonActiveBanks = totalBanks - activeBanks;
    const banksInUse = questionBanks.filter(
        (bank) => bank.tests_count > 0,
    ).length;
    const totalTestsUsingBanks = questionBanks.reduce(
        (acc, bank) => acc + (bank.tests_count || 0),
        0,
    );

    const addButton = (
        <Button asChild>
            <Link href={route("teacher.createQuestionBank")}>
                <Plus className="h-4 w-4" />
                Tambah Bank Soal
            </Link>
        </Button>
    );

    return (
        <TeacherLayout>
            <Head title="Bank Soal" />

            <div className="py-8 mx-auto max-w-xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl">
                <div className="flex flex-1 flex-col gap-5 px-4 pt-0">
                    <PageHeader
                        icon={Database}
                        title="Bank Soal"
                        description="Kelola bank soal untuk digunakan kembali di banyak ujian."
                        actions={addButton}
                    />

                    <StatGrid className="lg:grid-cols-5">
                        <StatTile icon={Database} label="Total Bank Soal" value={totalBanks} tone="brand" />
                        <StatTile icon={CheckCircle2} label="Aktif" value={activeBanks} tone="success" />
                        <StatTile icon={CircleOff} label="Nonaktif" value={nonActiveBanks} tone="steel" />
                        <StatTile icon={BookOpen} label="Dipakai Ujian" value={banksInUse} tone="info" />
                        <StatTile icon={Layers} label="Total Pemakaian" value={totalTestsUsingBanks} tone="highlight" />
                    </StatGrid>

                    {questionBanks.length === 0 ? (
                        <EmptyState
                            icon={Database}
                            title="Belum ada bank soal"
                            description="Tambahkan bank soal pertama Anda."
                            action={addButton}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {questionBanks.map((bank) => (
                                <EntityCard
                                    key={bank.id}
                                    tone={bank.is_active ? "success" : "steel"}
                                    icon={Database}
                                    title={bank.name}
                                    subtitle={bank.description && bank.description !== "-" ? bank.description : undefined}
                                    badges={
                                        <StatusPill tone={bank.is_active ? "success" : "steel"}>
                                            {bank.is_active ? "Aktif" : "Nonaktif"}
                                        </StatusPill>
                                    }
                                    actions={
                                        <>
                                            <Button asChild>
                                                <Link href={route("teacher.questionBankQuestions.index", bank.id)}>
                                                    <Database className="h-4 w-4" />
                                                    Kelola Soal
                                                </Link>
                                            </Button>
                                            <Button variant="outline" asChild>
                                                <Link href={route("teacher.editQuestionBank", bank.id)}>
                                                    <Pencil className="h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:ml-auto"
                                                onClick={() => {
                                                    setSelectedBankId(bank.id);
                                                    setOpenDeleteModal(true);
                                                }}
                                            >
                                                <Trash className="h-4 w-4" />
                                                Hapus
                                            </Button>
                                        </>
                                    }
                                >
                                    <MetaGrid
                                        className="grid-cols-2 lg:grid-cols-2"
                                        items={[
                                            {
                                                icon: bank.is_active ? CheckCircle2 : CircleOff,
                                                label: "Status",
                                                value: bank.is_active ? "Aktif" : "Nonaktif",
                                            },
                                            { icon: BookOpen, label: "Dipakai Ujian", value: `${bank.tests_count} ujian` },
                                        ]}
                                    />
                                </EntityCard>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                title="Hapus Bank Soal"
                description="Apakah Anda yakin ingin menghapus bank soal ini?"
                open={openDeleteModal}
                onClose={() => setOpenDeleteModal(false)}
                onConfirm={handleDelete}
            />
        </TeacherLayout>
    );
}
