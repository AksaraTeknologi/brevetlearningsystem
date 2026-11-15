import AuthShell from "@/Components/auth/AuthShell";
import { MasukButton } from "@/Components/auth/parts";
import { usePage } from "@inertiajs/react";
import { PropsWithChildren } from "react";

/**
 * Layout tamu untuk halaman pendaftaran & akun (Perorangan, Reset Sandi, dll).
 * Memakai header kartu bergaya Coretax; dipaksa mode terang karena isi
 * halaman-halaman ini belum mendukung mode gelap.
 */
export default function Guest({ children }: PropsWithChildren) {
    // Halaman seperti Verifikasi Email & Konfirmasi Sandi diakses user yang sudah
    // login; tombol "Masuk" hanya untuk pengunjung yang belum login.
    const isLoggedIn = !!(usePage().props as any).auth?.user;

    return (
        <AuthShell
            headerVariant="card"
            headerAction={isLoggedIn ? undefined : <MasukButton />}
            footerAlign="center"
            showThemeToggle={false}
            forceLight
        >
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 md:px-10">
                <div className="w-full max-w-sm md:max-w-5xl">{children}</div>
            </div>
        </AuthShell>
    );
}
