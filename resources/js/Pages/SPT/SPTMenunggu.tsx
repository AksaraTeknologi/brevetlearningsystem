import { columns } from "@/Components/layout/SPT/columns";
import { DataTableSPT } from "@/Components/layout/SPT/data-table";
import { Button } from "@/Components/ui/button";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { File, FileText, FileX, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SPTMenunggu({ spts }: any) {
    const { flash }: any = usePage().props;
    const [initialSpts, setInitialSpts] = useState(spts);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    const handleRefresh = () => {
        router.get(
            route("spt.waiting"),
            {},
            {
                onSuccess: (page) => {
                    setInitialSpts(page.props.spts);
                },
            }
        );
    };

    return (
        <Authenticated>
            <Head title="SPT Menunggu Pembayaran" />

            <div className="py-8 mx-auto max-w-xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl">
                <div className="flex flex-1 flex-col gap-4 px-4 pt-0">
                    <h1 className="text-2xl font-semibold text-primary">
                        SPT Menunggu Pembayaran
                    </h1>

                    <div className="p-5 md:p-8 rounded-xl bg-sidebar border">
                        <div className="flex gap-2">
                            <Button
                                className="bg-highlight text-highlight-foreground hover:bg-highlight/90"
                                onClick={handleRefresh}
                            >
                                <RefreshCcw />
                            </Button>
                            <Button
                                className="bg-steel text-steel-foreground hover:bg-steel/90"
                                disabled
                            >
                                <File />
                            </Button>
                            <Button
                                className="bg-success hover:bg-success/90 text-success-foreground"
                                disabled
                            >
                                <FileX />
                            </Button>
                            <Button
                                className="bg-destructive hover:bg-destructive/90"
                                disabled
                            >
                                <FileText />
                            </Button>
                        </div>
                        <DataTableSPT columns={columns} data={initialSpts} />
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
