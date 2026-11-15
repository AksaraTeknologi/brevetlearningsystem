import { Badge } from "@/Components/ui/badge";

export default function FakturMasukan({ fakturs }: { fakturs: any[] }) {
    if (
        fakturs.filter((faktur: any) => faktur.type === "masukan").length === 0
    ) {
        return (
            <div className="mb-4 rounded-xl bg-sidebar border p-4">
                <h2 className="font-semibold mb-2">Faktur Masukan</h2>
                <p className="text-muted-foreground">
                    Belum ada faktur masukan yang dibuat.
                </p>
            </div>
        );
    }

    return (
        <div className="mb-4 rounded-xl bg-sidebar border p-4">
            <h2 className="font-semibold mb-2">Faktur Masukan</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                    <thead>
                        <tr className="bg-muted">
                            <th className="px-2 py-1 border text-left">No</th>
                            <th className="px-2 py-1 border text-left">
                                Nomor Faktur
                            </th>
                            <th className="px-2 py-1 border text-left">
                                Nama Pembeli
                            </th>
                            <th className="px-2 py-1 border text-left">
                                Masa Pajak
                            </th>
                            <th className="px-2 py-1 border text-left">DPP</th>
                            <th className="px-2 py-1 border text-left">
                                DPP Lain
                            </th>
                            <th className="px-2 py-1 border text-left">PPN</th>
                            <th className="px-2 py-1 border text-left">
                                Status
                            </th>
                            <th className="px-2 py-1 border text-left">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fakturs
                            .filter((faktur: any) => faktur.type === "masukan")
                            .map((faktur: any, idx: number) => (
                                <tr key={faktur.id}>
                                    <td className="border px-2 py-1">
                                        {idx + 1}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {faktur.invoice_number ?? faktur.id}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {faktur.customer_name ?? "-"}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {faktur.invoice_period &&
                                        faktur.invoice_year
                                            ? `${faktur.invoice_period} ${faktur.invoice_year}`
                                            : "-"}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {faktur.dpp
                                            ? `Rp ${faktur.dpp.toLocaleString(
                                                  "id-ID"
                                              )}`
                                            : "-"}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {faktur.dpp_lain
                                            ? `Rp ${faktur.dpp_lain.toLocaleString(
                                                  "id-ID"
                                              )}`
                                            : "-"}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {faktur.ppn
                                            ? `Rp ${faktur.ppn.toLocaleString(
                                                  "id-ID"
                                              )}`
                                            : "-"}
                                    </td>
                                    <td className="border px-2 py-1 capitalize">
                                        {(() => {
                                            let colorClass =
                                                "bg-steel text-steel-foreground hover:bg-steel/90";
                                            switch (faktur.status) {
                                                case "approved":
                                                    colorClass =
                                                        "bg-info text-info-foreground hover:bg-info/90";
                                                    break;
                                                case "created":
                                                    colorClass =
                                                        "bg-success text-success-foreground hover:bg-success/90";
                                                    break;
                                                case "canceled":
                                                    colorClass =
                                                        "bg-warning text-warning-foreground hover:bg-warning/90";
                                                    break;
                                                case "deleted":
                                                    colorClass =
                                                        "bg-destructive text-destructive-foreground hover:bg-destructive/90";
                                                    break;
                                                case "amanded":
                                                    colorClass =
                                                        "bg-steel text-steel-foreground hover:bg-steel/90";
                                                    break;
                                                default:
                                                    colorClass =
                                                        "bg-steel text-steel-foreground hover:bg-steel/90";
                                            }
                                            return (
                                                <Badge className={colorClass}>
                                                    {faktur.status ?? "-"}
                                                </Badge>
                                            );
                                        })()}
                                    </td>
                                    <td className="border px-2 py-1">
                                        <a
                                            href={route(
                                                "invoice.downloadPDF",
                                                faktur.id
                                            )}
                                            target="_blank"
                                            className="text-blue-600 underline"
                                        >
                                            PDF
                                        </a>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
