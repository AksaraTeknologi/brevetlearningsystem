import {
    FormPageHeader,
    FormSection,
} from "@/Components/app-shell/FormPage";
import ItemDetail from "@/Components/layout/ItemDetail";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import { Button } from "@/Components/ui/button";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Banknote, BookMarked, File } from "lucide-react";

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
});

export default function SP({ user, bupot }: any) {
    return (
        <Authenticated>
            <Head title="eBupot SP" />

            <div className="py-8 mx-auto lg:px-4">
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <Link href={route("sp.notIssued")}>
                                    eBupot SP Belum Terbit
                                </Link>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Detail eBupot SP
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <FormPageHeader
                        title="Detail eBupot SP"
                        backHref={route("sp.notIssued")}
                        actions={
                            <Button
                                onClick={() =>
                                    router.get(route("sp.edit", bupot.id))
                                }
                            >
                                Edit
                            </Button>
                        }
                    />

                    <div>
                        <FormSection icon={<File />} title="Informasi Umum">
                            <ItemDetail
                                title="Masa Pajak"
                                detail={`${bupot.bupot_period} ${bupot.bupot_year}`}
                            />
                            <ItemDetail
                                title="Status"
                                detail={bupot.bupot_status}
                                className="capitalize"
                            />
                        </FormSection>

                        <FormSection
                            icon={<Banknote />}
                            title="Pajak Penghasilan (Rp)"
                        >
                            <ItemDetail
                                title="Fasilitas Pajak yang Dimiliki oleh Penerima
                            Penghasilan"
                                detail={bupot.facility}
                                className="capitalize"
                            />
                            <ItemDetail
                                title="Nama Objek Pajak"
                                detail={bupot.object.tax_name}
                            />
                            <ItemDetail
                                title="Jenis Pajak"
                                detail={bupot.object.tax_type}
                            />
                            <ItemDetail
                                title="Kode Objek Pajak"
                                detail={bupot.object.tax_code}
                            />
                            <ItemDetail
                                title="Sifat Pajak Penghasilan"
                                detail={bupot.object.tax_nature}
                                className="capitalize"
                            />
                            <ItemDetail
                                title="Dasar Pengenaan Pajak"
                                detail={rupiahFormatter.format(bupot.dpp || 0)}
                            />
                            <ItemDetail
                                title="Tarif"
                                detail={`${bupot.rates}%`}
                            />
                            <ItemDetail
                                title="Pajak Penghasilan"
                                detail={rupiahFormatter.format(bupot.tax || 0)}
                            />
                            <ItemDetail title="KAP" detail={bupot.object.kap} />
                        </FormSection>

                        <FormSection
                            icon={<BookMarked />}
                            title="Dokumen Referensi"
                        >
                            <ItemDetail
                                title="Jenis Dokumen"
                                detail={bupot.doc_type}
                                className="capitalize"
                            />
                            <ItemDetail
                                title="Nomor Dokumen"
                                detail={bupot.doc_no}
                            />
                            <ItemDetail
                                title="Tanggal Dokumen"
                                detail={bupot.doc_date}
                            />
                            <ItemDetail
                                title="NITKU / Nomor Identitas Sub Unit Organisasi*"
                                detail={`${user.npwp}000000 - ${user.name}`}
                            />
                        </FormSection>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
