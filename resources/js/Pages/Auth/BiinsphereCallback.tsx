import { Head } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CallbackUser {
    id: number | string;
    name: string;
    email: string;
}

interface BiinsphereCallbackProps {
    token: string;
    user: CallbackUser;
    /** This platform's code on Biinsphere. */
    platform_code: string;
    /** The configured Biinsphere app URL (BIINSPHERE_FRONTEND_URL); the only place the token goes. */
    biinsphere_url: string;
}

export default function BiinsphereCallback({ token, user, platform_code, biinsphere_url }: BiinsphereCallbackProps) {
    const [openerNotified, setOpenerNotified] = useState(false);
    const [countdownProgress, setCountdownProgress] = useState(0);

    // Without an opener, go back to Biinsphere with the token in the fragment:
    // it is never sent to a server or in a Referer header.
    const redirectUrl = `${biinsphere_url}/profile#link_token=${encodeURIComponent(token)}&platform_code=${encodeURIComponent(platform_code)}`;

    useEffect(() => {
        let notified = false;

        // 1. Popup: hand the token to the opener, only if it is Biinsphere.
        //    postMessage drops the message when the opener has another origin.
        if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage(
                    { type: 'BIINSPHERE_LINK_PLATFORM', platform_code, token },
                    new URL(biinsphere_url).origin,
                );
                notified = true;
                setOpenerNotified(true);
            } catch (error) {
                console.error('Error posting message to window.opener:', error);
            }
        }

        // Animate countdown progress bar
        const interval = setInterval(() => {
            setCountdownProgress((prev) => (prev >= 100 ? 100 : prev + 10));
        }, 100);

        // 2. Either close the window if popup, or redirect if standalone tab
        const timer = setTimeout(() => {
            if (notified) {
                window.close();
            } else {
                window.location.href = redirectUrl;
            }
        }, 1100);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [token, platform_code, biinsphere_url, redirectUrl]);

    return (
        <>
            <Head title="Menghubungkan Akun ke Biinsphere..." />

            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans">
                {/* Ambient Background Glows */}
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#212C5F]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#3B4A8F]/10 rounded-full blur-3xl pointer-events-none" />

                {/* Main Callback Card */}
                <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative z-10 transition-all text-center">
                    {/* Header Banner */}
                    <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#212C5F] to-[#3B4A8F] px-6 pt-8 pb-7 text-center">
                        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full blur-sm pointer-events-none" />
                        <div className="absolute -left-6 -top-6 w-28 h-28 bg-white/5 rounded-full blur-sm pointer-events-none" />

                        {/* Connected Badges */}
                        <div className="relative z-10 flex items-center justify-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/95 backdrop-blur-md p-1.5 flex items-center justify-center shadow-lg border border-white/30">
                                <img src="/images/biinsphere_logo.png" alt="Biinsphere" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/90 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-white/95 backdrop-blur-md p-2 flex items-center justify-center shadow-md border border-white/30">
                                <img
                                    src="/images/logo.png"
                                    alt="Brevet Learning System"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                        const parent = (e.target as HTMLElement).parentElement;
                                        if (parent) {
                                            parent.innerText = 'BLS';
                                            parent.className += ' font-bold text-[#212C5F] text-xs';
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <h1 className="text-xl font-bold text-white tracking-tight">
                            {openerNotified ? 'Akun Berhasil Ditautkan!' : 'Otorisasi Berhasil!'}
                        </h1>
                        <p className="text-xs text-blue-100/90 mt-1 max-w-xs mx-auto leading-relaxed">
                            {openerNotified
                                ? 'Sinkronisasi dengan Biinsphere telah selesai.'
                                : 'Mengalihkan Anda kembali ke Biinsphere...'}
                        </p>
                    </div>

                    {/* Content Body */}
                    <div className="p-7 space-y-6">
                        {/* Status Icon */}
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shadow-sm relative group">
                                <CheckCircle2 className="w-9 h-9 text-emerald-600 animate-in zoom-in-75 duration-300" />
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                                </span>
                            </div>
                        </div>

                        {/* Status Info Box */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                            <p className="text-sm font-semibold text-slate-800">
                                {user?.name}
                            </p>
                            <p className="text-xs text-slate-500">
                                {user?.email}
                            </p>
                            <p className="text-[11px] text-emerald-600 font-medium pt-1">
                                ✓ Profil Brevet Learning System berhasil terhubung
                            </p>
                        </div>

                        {/* Progress Bar & Subtext */}
                        <div className="space-y-2">
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-[#212C5F] to-[#3B4A8F] h-2 rounded-full transition-all duration-150 ease-out"
                                    style={{ width: `${countdownProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400">
                                {openerNotified
                                    ? 'Jendela ini akan tertutup otomatis...'
                                    : 'Sedang mengalihkan, mohon tunggu sebentar...'}
                            </p>
                        </div>

                        {/* Manual Action Button (Fallback if popup didn't close or user is in full tab) */}
                        <div className="pt-1">
                            <a
                                href={redirectUrl}
                                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#212C5F] to-[#3B4A8F] hover:from-[#2A376F] hover:to-[#4A5AA3] shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
                            >
                                <span>Lanjutkan ke Biinsphere</span>
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
