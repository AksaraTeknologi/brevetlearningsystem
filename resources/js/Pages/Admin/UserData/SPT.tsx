import { Badge } from "@/Components/ui/badge";

export default function SPT({ spts }: { spts: any[] }) {
    if (!spts || spts.length === 0) {
        return (
            <div className="mb-4 rounded-xl bg-sidebar border p-4">
                <h2 className="font-semibold mb-2">SPT</h2>
                <p className="text-muted-foreground">Belum ada SPT yang dibuat.</p>
            </div>
        );
    }

    return (
        <div className="mb-4 rounded-xl bg-sidebar border p-4">
            <h2 className="font-semibold mb-2">SPT</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                    <thead>
                        <tr className="bg-muted">
                            <th className="px-2 py-1 border text-left">No</th>
                            <th className="px-2 py-1 border text-left">
                                Jenis SPT
                            </th>
                            <th className="px-2 py-1 border text-left">
                                Jenis Pajak
                            </th>
                            <th className="px-2 py-1 border text-left">
                                Periode
                            </th>
                            <th className="px-2 py-1 border text-left">
                                Tahun
                            </th>
                            <th className="px-2 py-1 border text-left">
                                Nilai Pajak
                            </th>
                            <th className="px-2 py-1 border text-left">
                                Tanggal Pembayaran
                            </th>
                            <th className="px-2 py-1 border text-left">
                                Status
                            </th>
                            <th className="px-2 py-1 border text-left">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {spts.map((spt: any, idx: number) => {
                            let tipe = "-";
                            if (spt.form_id === 1) tipe = "PPN";
                            else if (spt.form_id === 2) tipe = "Unifikasi";
                            else if (spt.form_id === 3) tipe = "21/26";
                            return (
                                <tr key={spt.id}>
                                    <td className="border px-2 py-1">
                                        {idx + 1}
                                    </td>
                                    <td className="border px-2 py-1">{tipe}</td>
                                    <td className="border px-2 py-1">
                                        {spt.correction_number === 0
                                            ? "Normal"
                                            : "Pembetulan"}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {spt.start_period && spt.end_period
                                            ? `${spt.start_period} - ${spt.end_period}`
                                            : "-"}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {spt.year}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {spt.tax_value
                                            ? `Rp ${spt.tax_value.toLocaleString(
                                                  "id-ID"
                                              )}`
                                            : "-"}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {spt.paid_date
                                            ? new Date(
                                                  spt.paid_date
                                              ).toLocaleDateString("id-ID")
                                            : "-"}
                                    </td>
                                    <td className="border px-2 py-1 capitalize">
                                        {(() => {
                                            let colorClass =
                                                "bg-steel text-steel-foreground hover:bg-steel/90";
                                            switch (spt.status) {
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
                                                case "rejected":
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
                                                    {spt.status ?? "-"}
                                                </Badge>
                                            );
                                        })()}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {spt.form_id === 2 ? (
                                            <a
                                                href={route(
                                                    "spt.downloadPDFUnifikasi",
                                                    spt.id
                                                )}
                                                target="_blank"
                                                className="text-blue-600 underline"
                                            >
                                                PDF
                                            </a>
                                        ) : spt.form_id === 3 ? (
                                            <a
                                                href={route(
                                                    "spt.downloadPDF21",
                                                    spt.id
                                                )}
                                                target="_blank"
                                                className="text-blue-600 underline"
                                            >
                                                PDF
                                            </a>
                                        ) : (
                                            <a
                                                href={route(
                                                    "spt.downloadPDF",
                                                    spt.id
                                                )}
                                                target="_blank"
                                                className="text-blue-600 underline"
                                            >
                                                PDF
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
