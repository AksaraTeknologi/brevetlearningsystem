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
import { Banknote, File } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import FormFieldsGeneralInformation from "./FormFieldsGeneralInformation";
import FormFieldsIncomeTax from "./FormFieldIncomeTax";

const formSchema = z.object({
    id: z.string().uuid(),
    object_id: z.number().int(),
    bupot_period: z.string(),
    bupot_year: z.string(),
    bupot_status: z.enum(["normal", "perbaikan"]),
    is_foreign: z.enum(["true", "false"]),
    customer_id: z.string().min(16).max(16),
    customer_name: z.string(),
    customer_address: z.string(),
    customer_passport: z.string().nullable(),
    customer_country: z.string(),
    customer_ptkp: z.string(),
    customer_position: z.string(),
    facility: z.enum([
        "fasilitas lainnya",
        "pph ditanggung pemerintah",
        "tanpa fasilitas",
    ]),
    tax_type: z.string(),
    tax_code: z.string(),
    dpp: z.number(),
    rates: z.number(),
    tax: z.number(),
    kap: z.string(),
    doc_type: z.string(),
    doc_no: z.string(),
    doc_date: z.date(),
    nitku: z.string(),
    status: z.enum([
        "created",
        "approved",
        "canceled",
        "deleted",
        "amanded",
        "draft",
    ]),
});

export default function FormEditMP({ user, bupot, objects, ter }: any) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ...bupot,
            doc_date: new Date(bupot.doc_date),
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const formattedValues = {
            ...values,
            doc_date: format(values.doc_date, "yyyy-MM-dd"),
        };

        router.put(route("mp.update", bupot.id), formattedValues);
    }

    function handleSetStatus(status: any) {
        form.setValue("status", status);
    }

    return (
        <Authenticated>
            <Head title="Edit eBupot MP" />

            <div className="py-8 mx-auto lg:px-4">
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <Link href={route("mp.notIssued")}>
                                    eBupot MP Belum Terbit
                                </Link>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Edit eBupot MP</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <FormPageHeader
                        title="Edit eBupot MP"
                        backHref={route("mp.notIssued")}
                    />

                    <div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <FormSection
                                    icon={<File />}
                                    title="Informasi Umum"
                                >
                                    <FormFieldsGeneralInformation
                                        form={form}
                                        ter={ter}
                                        isEditMode={true}
                                    />
                                </FormSection>

                                <FormSection
                                    icon={<Banknote />}
                                    title="Fasilitas Perpajakan"
                                >
                                    <FormFieldsIncomeTax
                                        form={form}
                                        objects={objects}
                                        user={user}
                                    />
                                </FormSection>
                                <FormActions cancelHref={route("mp.notIssued")}>
                                    <Button
                                        type="submit"
                                        onClick={() => handleSetStatus("created")}
                                    >
                                        Simpan
                                    </Button>
                                    {bupot.status === "draft" && (
                                        <Button
                                            type="submit"
                                            onClick={() => handleSetStatus("draft")}
                                        >
                                            Simpan Draf
                                        </Button>
                                    )}
                                </FormActions>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
