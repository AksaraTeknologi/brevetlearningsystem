import AuthSplit, { authFieldIcon, authFieldInput } from "@/Components/auth/AuthSplit";
import InputError from "@/Components/layout/InputError";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Info, Loader2, Mail, MailCheck, Send } from "lucide-react";
import { FormEventHandler } from "react";

const STEPS = [
    "Masukkan email yang terdaftar di akun BLS Anda.",
    "Buka tautan reset yang kami kirim ke email tersebut.",
    "Buat kata sandi baru, lalu masuk kembali.",
];

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("password.email"));
    };

    return (
        <AuthSplit>
            <Head title="Lupa Kata Sandi" />

            <Link
                href={route("login")}
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    processing && "pointer-events-none opacity-50",
                )}
            >
                <ArrowLeft className="size-4" />
                Kembali ke login
            </Link>

            <h2 className="mt-6 text-[28px] font-extrabold tracking-[-0.02em] text-foreground md:text-[32px]">
                Lupa kata sandi?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Masukkan email akun Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi.
            </p>

            {status && (
                <div
                    role="status"
                    className="mt-6 flex items-start gap-2.5 rounded-xl bg-highlight-soft px-4 py-3 text-sm font-medium text-highlight-foreground dark:bg-highlight/15 dark:text-highlight"
                >
                    <MailCheck className="mt-0.5 size-4 shrink-0" />
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="mt-8 space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                        Email
                    </Label>
                    <div className="relative">
                        <Mail aria-hidden className={authFieldIcon} />
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
                            className={authFieldInput}
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                <Button type="submit" size="lg" disabled={processing} className="h-12 w-full text-base font-bold">
                    {processing ? (
                        <>
                            <Loader2 className="animate-spin" />
                            Mengirim...
                        </>
                    ) : (
                        <>
                            Kirim tautan reset
                            <Send />
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-8 rounded-2xl bg-muted p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Info className="size-4 text-brand-ink" />
                    Cara mengatur ulang
                </p>
                <ol className="mt-3 space-y-2 text-[13px] text-muted-foreground">
                    {STEPS.map((t, i) => (
                        <li key={t} className="flex gap-2.5">
                            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-highlight text-[11px] font-bold text-highlight-foreground">
                                {i + 1}
                            </span>
                            {t}
                        </li>
                    ))}
                </ol>
                <p className="mt-3 text-[13px] text-muted-foreground">
                    Tidak menerima email? Cek folder spam atau hubungi admin/pengajar kelas Anda.
                </p>
            </div>
        </AuthSplit>
    );
}
