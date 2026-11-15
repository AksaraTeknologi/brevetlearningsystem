import {
    FormPageHeader,
    FormSection,
    FormActions,
} from "@/Components/app-shell/FormPage";
import { Button } from "@/Components/ui/button";
import { Form } from "@/Components/ui/form";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Head, Link, router } from "@inertiajs/react";
import { format } from "date-fns";
import { File, Sheet, UserPen } from "lucide-react";
import { useForm } from "react-hook-form";
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

export default function FormEditExportInvoice({ other }: any) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ...other,
            correction_number: 1,
            other_date: new Date(other.other_date),
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const formattedValues = {
            ...values,
            other_date: format(values.other_date, "yyyy-MM-dd"),
        };

        router.put(route("other.update", other.id), formattedValues);
    }

    return (
        <Authenticated>
            <Head title="Edit Dokumen Lain Keluaran" />

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
                                    Edit Dokumen Lain Keluaran
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <FormPageHeader
                        title="Edit Dokumen Lain Keluaran"
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
                                        isEditMode={true}
                                    />
                                </FormSection>
                                <FormActions cancelHref={route("other.export")}>
                                    <Button type="submit">Simpan Perubahan</Button>
                                </FormActions>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
