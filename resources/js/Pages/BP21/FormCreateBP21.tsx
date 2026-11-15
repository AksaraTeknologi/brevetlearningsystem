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
import { Banknote, BookMarked, File } from "lucide-react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
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
import FormFieldsReferenceDocument from "./FormFieldReferenceDocument";

const formSchema = z.object({
    id: z.string().uuid(),
    object_id: z.number().int(),
    bupot_period: z.string(),
    bupot_year: z.string(),
    bupot_status: z.enum(["normal", "perbaikan"]),
    customer_id: z.string().min(16).max(16),
    customer_name: z.string(),
    customer_nitku: z.string(),
    customer_ptkp: z.string(),
    facility: z.enum([
        "fasilitas lainnya",
        "pph ditanggung pemerintah",
        "tanpa fasilitas",
    ]),
    tax_type: z.string(),
    tax_code: z.string(),
    tax_nature: z.string(),
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

export default function FormCreateBP21({ user, objects, bupots, ter }: any) {
    const defaultId = uuidv4();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: defaultId,
            bupot_status: "normal",
            facility: "tanpa fasilitas",
            tax_type: "",
            tax_code: "",
            tax_nature: "",
            dpp: 0,
            rates: 0,
            tax: 0,
            kap: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const formattedValues = {
            ...values,
            doc_date: format(values.doc_date, "yyyy-MM-dd"),
        };

        router.post(route("bp21.store"), formattedValues);
    }

    function handleSetStatus(status: any) {
        form.setValue("status", status);
    }

    return (
        <Authenticated>
            <Head title="Buat eBupot BP21" />

            <div className="py-8 mx-auto lg:px-4">
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <Link href={route("bp21.notIssued")}>
                                    BP21 Belum Terbit
                                </Link>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Buat eBupot BP21
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <FormPageHeader
                        title="Buat eBupot BP21"
                        backHref={route("bp21.notIssued")}
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
                                        bupots={bupots}
                                        isEditMode={false}
                                    />
                                </FormSection>

                                <FormSection
                                    icon={<Banknote />}
                                    title="Pajak Penghasilan (Rp)"
                                >
                                    <FormFieldsIncomeTax
                                        form={form}
                                        ter={ter}
                                        objects={objects}
                                    />
                                </FormSection>

                                <FormSection
                                    icon={<BookMarked />}
                                    title="Dokumen Referensi"
                                >
                                    <FormFieldsReferenceDocument
                                        form={form}
                                        user={user}
                                    />
                                </FormSection>
                                <FormActions cancelHref={route("bp21.notIssued")}>
                                    <Button
                                        type="submit"
                                        onClick={() => handleSetStatus("created")}
                                    >
                                        Kirim
                                    </Button>
                                    <Button
                                        type="submit"
                                        onClick={() => handleSetStatus("draft")}
                                    >
                                        Simpan Draf
                                    </Button>
                                </FormActions>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
