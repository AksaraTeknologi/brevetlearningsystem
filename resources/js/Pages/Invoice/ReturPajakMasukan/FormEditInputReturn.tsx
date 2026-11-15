import {
    FormPageHeader,
    FormSection,
    FormActions,
} from "@/Components/app-shell/FormPage";
import { columns } from "@/Components/layout/InvoiceItems/columns";
import { DataTableInvoiceItems } from "@/Components/layout/InvoiceItems/data-table";
import { Button } from "@/Components/ui/button";
import { Form } from "@/Components/ui/form";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { format } from "date-fns";
import { File } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import FormFieldsInputReturn from "./FormFieldsInputReturn";
import { useEffect } from "react";

const formSchema = z.object({
    id: z.string().uuid(),
    invoice_id: z.string().uuid(),
    retur_number: z.string(),
    retur_date: z.date(),
    retur_period: z.string(),
    retur_year: z.string(),
    dpp: z.number(),
    dpp_lain: z.number(),
    ppn: z.number(),
    ppnbm: z.number(),
    type: z.enum(["keluaran", "masukan"]),
    status: z.enum(["created", "approved", "canceled", "deleted", "amanded"]),
});

export default function FormEditInputReturn({ retur, invoices }: any) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ...retur,
            retur_date: new Date(retur.retur_date),
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const formattedValues = {
            ...values,
            retur_date: format(values.retur_date, "yyyy-MM-dd"),
        };
        router.put(route("retur.update", retur.id), formattedValues);
    }

    return (
        <Authenticated>
            <Head title="Edit Retur Pajak Masukan" />

            <div className="py-8 mx-auto lg:px-4">
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <Link href={route("retur.input")}>
                                    Retur Pajak Masukan
                                </Link>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Edit Retur Pajak Masukan
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <FormPageHeader
                        title="Edit Retur Pajak Masukan"
                        backHref={route("retur.input")}
                    />

                    <div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <FormSection
                                    icon={<File />}
                                    title="Dokumen Retur Pajak Masukan"
                                >
                                    <FormFieldsInputReturn
                                        form={form}
                                        invoices={invoices}
                                        isEditMode={true}
                                    />
                                </FormSection>
                                <FormActions cancelHref={route("retur.input")}>
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
