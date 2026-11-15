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
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { useState, useEffect } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import FormFieldsInvoiceDocument from "./FormFieldsTransactionDocument";
import FormFieldBuyerInformation from "./FormFieldsBuyerInformation";
import FormFieldTransactionDetail from "./FormFieldsTransactionDetail";
import toast from "react-hot-toast";

const formSchema = z.object({
    id: z.string().uuid(),
    transaction_id: z.number().int(),
    transaction_code: z.string(),
    invoice_number: z.string(),
    invoice_date: z.date(),
    invoice_period: z.string(),
    invoice_year: z.string(),
    invoice_reference: z.string(),
    customer_id: z.string(),
    customer_name: z.string(),
    customer_address: z.string(),
    customer_email: z.string(),
    dpp: z.number(),
    dpp_lain: z.number(),
    ppn: z.number(),
    ppnbm: z.number(),
    dpp_split: z.number(),
    ppn_split: z.number(),
    ppnbm_split: z.number(),
    correction_number: z.number().int().max(127),
    type: z.enum(["keluaran", "masukan"]),
    status: z.enum([
        "created",
        "approved",
        "canceled",
        "deleted",
        "amanded",
        "credited",
        "uncredited",
    ]),
    payment_type: z.enum(["lunas", "uang muka", "pelunasan"]),
});

export default function FormEditInputInvoice({
    invoice,
    items,
    invoiceCount,
}: any) {
    const [invoiceItems, setInvoiceItems] = useState<any[]>(items || []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ...invoice,
            invoice_date: new Date(invoice.invoice_date),
            invoice_reference: "",
            customer_email: "customer@biinspira.co.id",
            dpp_split: 0,
            ppn_split: 0,
            ppnbm_split: 0,
            correction_number: 0,
            type: "masukan",
            payment_type: "lunas",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const invoiceNumberPrefix = values.invoice_number.substring(0, 2);

        const transactionId = parseInt(invoiceNumberPrefix, 10);
        if (isNaN(transactionId) || transactionId < 1 || transactionId > 10) {
            toast.error("Nomor faktur tidak valid!");
            return;
        }

        const formattedValues = {
            ...values,
            invoice_date: format(values.invoice_date, "yyyy-MM-dd"),
            items: items.length > 0 ? items : [],
        };

        router.put(route("invoice.update", invoice.id), formattedValues);
    }

    return (
        <Authenticated>
            <Head title="Edit Faktur Pajak Masukan" />

            <div className="py-8 mx-auto lg:px-4">
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <Link href={route("invoice.input")}>
                                    Pajak Masukan
                                </Link>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Tambah Faktur Pajak Masukan
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <FormPageHeader
                        title="Tambah Faktur Pajak Masukan"
                        backHref={route("invoice.input")}
                    />

                    <div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <FormSection
                                    icon={<File />}
                                    title="Dokumen Faktur"
                                >
                                    <FormFieldsInvoiceDocument
                                        form={form}
                                        invoiceCount={invoiceCount}
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
                                <FormActions cancelHref={route("invoice.input")}>
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
