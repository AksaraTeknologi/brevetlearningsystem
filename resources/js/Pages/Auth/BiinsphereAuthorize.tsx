import { Button } from '@/Components/ui/button';
import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, ArrowRightLeft, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import React, { FormEventHandler } from 'react';

interface AuthorizeUser {
    id: number | string;
    name: string;
    email: string;
    role?: string;
}

interface BiinsphereAuthorizeProps {
    user: AuthorizeUser;
    /** One-time state from Biinsphere; the signed token carries it back. */
    state: string;
    /** Set when this account is already connected to a Biinsphere account. */
    connected_to?: { username: string | null } | null;
}

export default function BiinsphereAuthorize({ user, state, connected_to }: BiinsphereAuthorizeProps) {
    const { post, processing } = useForm({ state });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('biinsphere.authorize.post'));
    };

    const handleCancel = () => {
        if (window.opener) {
            window.close();
        } else {
            window.history.back();
        }
    };

    const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

    return (
        <>
            <Head title="Otorisasi Tautan Akun - Biinsphere & Brevet Learning System" />

            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans">
                {/* Subtle Background Glows matching Brevet Learning System theme */}
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#212C5F]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#3B4A8F]/10 rounded-full blur-3xl pointer-events-none" />

                {/* Main Auth Card */}
                <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative z-10 transition-all">
                    {/* Header Banner - Navy to Royal Indigo Gradient */}
                    <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#212C5F] to-[#3B4A8F] px-6 pt-8 pb-7 text-center">
                        {/* Decorative Background Circles */}
                        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full blur-sm pointer-events-none" />
                        <div className="absolute -left-6 -top-6 w-28 h-28 bg-white/5 rounded-full blur-sm pointer-events-none" />

                        {/* Connected Badges */}
                        <div className="relative z-10 flex items-center justify-center gap-3 mb-5">
                            {/* Biinsphere App Badge */}
                            <div className="w-[52px] h-[52px] rounded-2xl bg-white/95 backdrop-blur-md p-1.5 flex items-center justify-center shadow-lg border border-white/30">
                                <img src="/images/biinsphere_logo.png" alt="Biinsphere" className="w-full h-full object-contain" />
                            </div>

                            {/* Link Animation Pill */}
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white/90 shadow-sm animate-pulse">
                                <ArrowRightLeft className="w-4 h-4 text-blue-200" />
                            </div>

                            {/* Brevet Learning System App Badge */}
                            <div className="w-[52px] h-[52px] rounded-2xl bg-white/95 backdrop-blur-md p-2 flex items-center justify-center shadow-lg shadow-[#212C5F]/30 border border-white/30">
                                <img
                                    src="/images/logo.png"
                                    alt="Brevet Learning System"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        // Fallback if image fails to load
                                        (e.target as HTMLElement).style.display = 'none';
                                        const parent = (e.target as HTMLElement).parentElement;
                                        if (parent) {
                                            parent.innerText = 'BLS';
                                            parent.className += ' font-bold text-[#212C5F] text-sm';
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Title & Subtitle */}
                        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                            Otorisasi Tautan Akun
                        </h1>
                        <p className="text-xs md:text-sm text-blue-100/90 mt-1.5 leading-relaxed max-w-sm mx-auto">
                            Aplikasi <span className="font-semibold text-white">Biinsphere</span> meminta izin untuk terhubung dengan profil <span className="font-semibold text-white">Brevet Learning System</span> Anda.
                        </p>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-6 md:p-7 space-y-5">
                        {/* Active User Box */}
                        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-100 flex items-center gap-3.5 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#212C5F] to-[#3B4A8F] text-white font-bold text-lg flex items-center justify-center shadow-sm shrink-0">
                                {userInitial}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-slate-800 truncate">
                                    {user?.name || 'Pengguna Brevet Learning System'}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                    {user?.email}
                                </div>
                                <div className="mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 capitalize">
                                        {user?.role || 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {connected_to ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <span>
                                        Akun ini sudah terhubung ke Biinsphere
                                        {connected_to.username ? (
                                            <>
                                                {' '}
                                                sebagai <span className="font-semibold">@{connected_to.username}</span>
                                            </>
                                        ) : null}
                                        . Satu akun hanya bisa terhubung ke satu akun Biinsphere.
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCancel}
                                    className="w-full h-auto py-3 px-4 rounded-xl font-semibold"
                                >
                                    Tutup
                                </Button>
                            </div>
                        ) : (
                            <>
                            {/* Permission Scopes */}
                            <div className="space-y-2.5">
                                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Hak Akses yang Diberikan:
                                </p>
                                <div className="bg-slate-50/60 rounded-xl p-3.5 border border-slate-100 space-y-2.5 text-xs text-slate-700">
                                    <div className="flex items-start gap-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Verifikasi identitas dan autentikasi akun Brevet Learning System Anda</span>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Tautkan akun secara permanen untuk Single Sign-On (SSO)</span>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Akses otomatis ke Brevet Learning System tanpa login ulang</span>
                                    </div>
                                </div>
                            </div>

                            {/* Security / Policy Notice */}
                            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900/80 leading-relaxed">
                                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <span>
                                    Penautan akun bersifat permanen.
                                </span>
                            </div>

                            {/* Actions Form */}
                            <form onSubmit={handleSubmit} className="pt-2 space-y-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={processing}
                                        className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer text-center"
                                    >
                                        Batal
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-[2] py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#212C5F] to-[#3B4A8F] hover:from-[#2A376F] hover:to-[#4A5AA3] shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                <span>Menghubungkan...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Izinkan & Hubungkan</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
