import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatNPWP(npwp: string): string {
    if (!npwp) return "-";
    const cleaned = npwp.replace(/\D/g, "");

    if (cleaned.length !== 15) return npwp;

    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(
        5,
        8
    )}.${cleaned.slice(8, 9)}-${cleaned.slice(9, 12)}.${cleaned.slice(12, 15)}`;
}

/**
 * Memformat tanggal ke zona waktu WIB (Asia/Jakarta, UTC+7)
 * Memastikan tampilan seragam di semua perangkat terlepas dari timezone lokal OS.
 */
export function formatDateTimeWIB(
    value?: string | null,
    options?: { withSeconds?: boolean; withWibSuffix?: boolean }
): string {
    if (!value) return "-";
    try {
        let str = String(value).trim();
        // Jika format YYYY-MM-DD HH:mm:ss tanpa timezone/Z, asumsikan dari database UTC
        if (!str.includes("Z") && !/[+-]\d{2}:?\d{2}$/.test(str)) {
            str = str.replace(" ", "T") + "Z";
        }
        const date = new Date(str);
        if (isNaN(date.getTime())) return value;

        const formatter = new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: options?.withSeconds ? "2-digit" : undefined,
            hour12: false,
        });

        const formatted = formatter.format(date).replace(/\./g, ":");
        return options?.withWibSuffix !== false ? `${formatted} WIB` : formatted;
    } catch {
        return value;
    }
}

/**
 * Mengambil komponen tanggal (YYYY-MM-DD) dan jam (HH:mm) dalam zona waktu WIB (Asia/Jakarta)
 */
export function getWibParts(dateString?: string | null): { date: Date; time: string } | null {
    if (!dateString) return null;
    try {
        let str = String(dateString).trim();
        if (!str.includes("Z") && !/[+-]\d{2}:?\d{2}$/.test(str)) {
            str = str.replace(" ", "T") + "Z";
        }
        const d = new Date(str);
        if (isNaN(d.getTime())) return null;

        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).formatToParts(d);

        const map: Record<string, string> = {};
        for (const p of parts) {
            map[p.type] = p.value;
        }

        const hour = map.hour === "24" ? "00" : map.hour;
        return {
            date: new Date(`${map.year}-${map.month}-${map.day}T00:00:00`),
            time: `${hour}:${map.minute}`,
        };
    } catch {
        return null;
    }
}
