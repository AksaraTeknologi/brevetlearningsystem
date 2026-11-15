import {
    FormPageHeader,
    FormSection,
    FormActions,
} from "@/Components/app-shell/FormPage";
import { Button } from "@/Components/ui/button";
import { Form } from "@/Components/ui/form";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { format } from "date-fns";
import { File, Sheet, UserPen } from "lucide-react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import FormFieldsTransactionDocument from "./FormFieldsTransactionDocument";
import FormFieldBuyerInformation from "./FormFieldBuyerInformation";
import FormFieldTransactionDetail from "./FormFieldTransactionDetail";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import { useEffect } from "react";

const formSchema = z.object({
    id: z.string().uuid(),
    transaction_type: z.string(),
    transaction_detail: z.string(),
    transaction_doc: z.string(),
    other_no: z.string(),
    other_date: z.date(),
    other_period: z.string(),
    other_year: z.string(),
    customer_id: z.string(),
    customer_name: z.string(),
    customer_phone: z.string(),
    customer_address: z.string(),
    dpp: z.number(),
    dpp_lain: z.number(),
    ppn: z.number(),
    ppnbm: z.number(),
    type: z.enum(["keluaran", "masukan"]),
    status: z.enum(["created", "approved", "canceled", "deleted", "amanded"]),
    correction_number: z.number().optional(),
});

export default function FormCreateExportInvoice({}: any) {
    const defaultId = uuidv4();
    const user = usePage().props.auth.user;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: defaultId,
            transaction_type: "Ekspor",
            customer_phone: user.phone_number,
            dpp: 0,
            dpp_lain: 0,
            ppn: 0,
            ppnbm: 0,
            type: "keluaran",
            status: "created",
            correction_number: 0,
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const formattedValues = {
            ...values,
            other_date: format(values.other_date, "yyyy-MM-dd"),
        };

        router.post(route("other.store"), formattedValues);
    }

    return (
        <Authenticated>
            <Head title="Tambah Dokumen Lain Keluaran" />

            <div className="py-8 mx-auto lg:px-4">
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <Link href={route("other.export")}>
                                    Dokumen Lain Keluaran
                                </Link>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Buat Dokumen Lain Keluaran
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <FormPageHeader
                        title="Buat Dokumen Lain Keluaran"
                        backHref={route("other.export")}
                    />

                    <div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <FormSection
                                    icon={<File />}
                                    title="Dokumen Transaksi"
                                >
                                    <FormFieldsTransactionDocument
                                        form={form}
                                    />
                                </FormSection>

                                <FormSection
                                    icon={<UserPen />}
                                    title="Informasi Pembeli"
                                >
                                    <FormFieldBuyerInformation form={form} />
                                </FormSection>

                                <FormSection
                                    icon={<Sheet />}
                                    title="Detail Transaksi"
                                >
                                    <FormFieldTransactionDetail
                                        form={form}
                                        isEditMode={false}
                                    />
                                </FormSection>
                                <FormActions cancelHref={route("other.export")}>
                                    <Button type="submit">Kirim</Button>
                                </FormActions>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
