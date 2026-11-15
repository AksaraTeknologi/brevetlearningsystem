import { useCallback, useEffect, useState } from "react";

/**
 * Tema terang/gelap untuk seluruh aplikasi.
 * Disimpan di localStorage dan diterapkan sebagai class `dark` di <html>
 * (skrip kecil di app.blade.php menerapkannya sebelum halaman tampil
 * agar tidak berkedip).
 */
export const THEME_KEY = "bls-theme";
export type Theme = "light" | "dark";

export function readTheme(): Theme {
    try {
        return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    } catch {
        return "light";
    }
}

export function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>("light");

    useEffect(() => {
        const t = readTheme();
        setTheme(t);
        applyTheme(t);
    }, []);

    const toggle = useCallback(() => {
        setTheme((prev) => {
            const next: Theme = prev === "dark" ? "light" : "dark";
            applyTheme(next);
            try {
                localStorage.setItem(THEME_KEY, next);
            } catch {}
            return next;
        });
    }, []);

    return { theme, toggle };
}

/**
 * Paksa mode terang selama komponen terpasang (halaman tamu yang belum
 * mendukung mode gelap). Class `dark` di <html> dilepas sementara agar popup
 * yang dirender lewat portal (dropdown, select, dialog) ikut terang, lalu
 * tema tersimpan dipasang kembali saat pindah halaman.
 */
export function useForceLight(enabled: boolean) {
    useEffect(() => {
        if (!enabled) return;
        document.documentElement.classList.remove("dark");
        return () => applyTheme(readTheme());
    }, [enabled]);
}
