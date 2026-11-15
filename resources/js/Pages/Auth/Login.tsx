import AuthSplit, { authFieldIcon, authFieldInput } from "@/Components/auth/AuthSplit";
import InputError from "@/Components/layout/InputError";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    ArrowRight,
    Eye,
    EyeOff,
    Loader2,
    LockKeyhole,
    ShieldCheck,
    User,
} from "lucide-react";
import { FormEventHandler, useState } from "react";

const SECURITY_TIPS = [
    "Jangan meminjamkan akun atau membagikan kata sandi.",
    "Hindari tautan mencurigakan dari WhatsApp atau email.",
    "Kunci perangkat saat tidak digunakan.",
];

export default function Login({
    status,
    canResetPassword = true,
}: {
    status?: string;
    canResetPassword?: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    const inputCls = authFieldInput;
    const iconCls = authFieldIcon;

    return (
        <AuthSplit>
            <Head title="Masuk" />

                            <p className="text-sm font-semibold text-muted-foreground lg:hidden">
                                Belajar pajak, <span className="text-brand-ink">siap praktik.</span>
                            </p>
                            <h2 className="mt-1 text-[28px] font-extrabold tracking-[-0.02em] text-foreground md:text-[32px] lg:mt-0">
                                Masuk ke akun Anda
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                Gunakan email terdaftar. Akun dibuat oleh admin atau pengajar kelas Anda.
                            </p>

                            {status && (
                                <div
                                    role="status"
                                    className="mt-6 rounded-xl bg-highlight-soft px-4 py-3 text-sm font-medium text-highlight-foreground dark:bg-highlight/15 dark:text-highlight"
                                >
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit} className="mt-8 space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-semibold">
                                        Email
                                    </Label>
                                    <div className="relative">
                                        <User aria-hidden className={iconCls} />
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            autoComplete="email"
                                            placeholder="nama@email.com"
                                            onChange={(e) => setData("email", e.target.value)}
                                            aria-invalid={!!errors.email}
                                            autoFocus
                                            required
                                            disabled={processing}
                                            className={inputCls}
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <Label htmlFor="password" className="text-sm font-semibold">
                                            Kata Sandi
                                        </Label>
                                        {canResetPassword && (
                                            <Link
                                                href={route("password.request")}
                                                className={cn(
                                                    "rounded text-sm font-semibold text-brand-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                    processing && "pointer-events-none opacity-50",
                                                )}
                                            >
                                                Lupa kata sandi?
                                            </Link>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <LockKeyhole aria-hidden className={iconCls} />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={data.password}
                                            autoComplete="current-password"
                                            placeholder="Masukkan kata sandi"
                                            onChange={(e) => setData("password", e.target.value)}
                                            aria-invalid={!!errors.password}
                                            required
                                            disabled={processing}
                                            className={cn(inputCls, "pr-12")}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={processing}
                                            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                            className="absolute inset-y-0 right-1 grid w-11 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                        >
                                            {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={processing}
                                    className="h-12 w-full text-base font-bold"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            Masuk
                                            <ArrowRight />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Registrasi mandiri disembunyikan di BLS (akun dikelola Admin/Pengajar). */}

                            <div className="mt-8 rounded-2xl bg-muted p-4">
                                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <ShieldCheck className="size-4 text-brand-ink" />
                                    Jaga keamanan akun
                                </p>
                                <ul className="mt-2 space-y-1.5 text-[13px] text-muted-foreground">
                                    {SECURITY_TIPS.map((t) => (
                                        <li key={t} className="flex gap-2">
                                            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-highlight" />
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Link
                                href={route("about")}
                                className={cn(
                                    "mt-6 block text-center text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
                                    processing && "pointer-events-none opacity-50",
                                )}
                            >
                                Apa itu Brevet Learning System?
                            </Link>
        </AuthSplit>
    );
}
