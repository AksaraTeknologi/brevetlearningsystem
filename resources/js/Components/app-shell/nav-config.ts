import {
    BookOpen,
    ClipboardList,
    CreditCard,
    FileText,
    Receipt,
    ShieldCheck,
    type LucideIcon,
} from "lucide-react";

/**
 * Konfigurasi menu utama (gaya Coretax) — satu sumber untuk menu desktop,
 * menu mobile, dan breadcrumb. Hak akses & route sama persis dengan menu lama.
 */

export type NavLink = {
    title: string;
    routeName: string;
    /** Pola route().current() yang membuat item ini aktif */
    match: string[];
};

export type NavGroup = {
    heading: string;
    items: NavLink[];
};

export type NavModule = {
    key: string;
    label: string;
    icon: LucideIcon;
    /** Pola route().current() yang membuat modul ini aktif */
    match: string[];
    /** Modul tanpa dropdown langsung menuju route ini */
    routeName?: string;
    /** Modul dengan mega menu */
    groups?: NavGroup[];
    /** Syarat hak akses (access_rights); kosong = selalu tampil */
    requires?: ("efaktur" | "ebupot")[];
};

export const NAV_MODULES: NavModule[] = [
    {
        key: "portal",
        label: "Portal Saya",
        icon: ShieldCheck,
        match: [
            "dashboard",
            "business-entities.*",
            "banks",
            "banks.*",
            "courses",
            "courses.*",
            "profile.*",
        ],
        groups: [
            {
                heading: "Portal Saya",
                items: [
                    { title: "Beranda", routeName: "dashboard", match: ["dashboard"] },
                    {
                        title: "Badan Usaha",
                        routeName: "business-entities.index",
                        match: ["business-entities.*"],
                    },
                    { title: "Bank Saya", routeName: "banks", match: ["banks", "banks.*"] },
                    { title: "Kelas Saya", routeName: "courses", match: ["courses", "courses.*"] },
                    { title: "Profil Saya", routeName: "profile.edit", match: ["profile.*"] },
                ],
            },
        ],
    },
    {
        key: "efaktur",
        label: "e-Faktur",
        icon: Receipt,
        routeName: "invoice.index",
        match: ["invoice.*", "retur.*", "other.*"],
        requires: ["efaktur"],
    },
    {
        key: "ebupot",
        label: "eBUPOT",
        icon: FileText,
        match: ["bppu.*", "bpnr.*", "sp.*", "cy.*", "bp21.*", "bp26.*", "bpa1.*", "bpa2.*", "mp.*"],
        requires: ["ebupot"],
        groups: [
            {
                heading: "Bukti Potong Unifikasi",
                items: [
                    { title: "BPPU", routeName: "bppu.notIssued", match: ["bppu.*"] },
                    { title: "BPNR", routeName: "bpnr.notIssued", match: ["bpnr.*"] },
                    { title: "Penyetoran Sendiri", routeName: "sp.notIssued", match: ["sp.*"] },
                    {
                        title: "Pemotongan Secara Digunggung",
                        routeName: "cy.notIssued",
                        match: ["cy.*"],
                    },
                ],
            },
            {
                heading: "Bukti Potong PPh 21/26",
                items: [
                    {
                        title: "BP 21 - Bukti Pemotongan Selain Pegawai Tetap",
                        routeName: "bp21.notIssued",
                        match: ["bp21.*"],
                    },
                    {
                        title: "BP 26 - Bukti Pemotongan Wajib Pajak Luar Negeri",
                        routeName: "bp26.notIssued",
                        match: ["bp26.*"],
                    },
                    {
                        title: "BP A1 - Bukti Pemotongan A1 Masa Pajak Terakhir",
                        routeName: "bpa1.notIssued",
                        match: ["bpa1.*"],
                    },
                    {
                        title: "BP A2 - Bukti Pemotongan A2 Masa Pajak Terakhir",
                        routeName: "bpa2.notIssued",
                        match: ["bpa2.*"],
                    },
                    {
                        title: "Bukti Pemotongan Bulanan Pegawai Tetap",
                        routeName: "mp.notIssued",
                        match: ["mp.*"],
                    },
                ],
            },
        ],
    },
    {
        key: "spt",
        label: "SPT",
        icon: ClipboardList,
        routeName: "spt.konsep",
        match: ["spt.*"],
        // SPT tampil jika punya salah satu hak akses (sama seperti menu lama)
        requires: ["efaktur", "ebupot"],
    },
    {
        key: "payment",
        label: "Pembayaran",
        icon: CreditCard,
        match: ["payment", "payment.*"],
        groups: [
            {
                heading: "Pembayaran",
                items: [
                    {
                        title: "Layanan Mandiri Kode Billing",
                        routeName: "payment.creation",
                        match: ["payment.creation"],
                    },
                    {
                        title: "Daftar Kode Billing Belum Bayar",
                        routeName: "payment.billing",
                        match: ["payment.billing"],
                    },
                ],
            },
        ],
    },
    {
        key: "ledger",
        label: "Buku Besar",
        icon: BookOpen,
        routeName: "ledger",
        match: ["ledger", "ledger.*"],
    },
];

export function isCurrent(patterns: string[]): boolean {
    return patterns.some((p) => {
        try {
            return !!route().current(p);
        } catch {
            return false;
        }
    });
}

export function visibleModules(accessRights: string[] | undefined | null) {
    const rights = accessRights ?? [];
    return NAV_MODULES.filter(
        (m) => !m.requires || m.requires.some((r) => rights.includes(r)),
    );
}

export function activeModule(modules: NavModule[]) {
    return modules.find((m) => isCurrent(m.match));
}
