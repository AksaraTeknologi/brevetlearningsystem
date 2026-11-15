import AuthShell from "@/Components/auth/AuthShell";
import {
    authIcon,
    authInput,
    authLabel,
    MasukButton,
    PortalCard,
} from "@/Components/auth/parts";
import InputError from "@/Components/layout/InputError";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Eye,
    EyeOff,
    IdCard,
    Loader2,
    LockKeyhole,
    Mail,
    MapPin,
    Phone,
    User,
    type LucideIcon,
} from "lucide-react";
import { FormEventHandler, useState, type ReactNode } from "react";

function Field({
    id,
    label,
    icon: Icon,
    error,
    hint,
    className,
    children,
}: {
    id: string;
    label: string;
    icon: LucideIcon;
    error?: string;
    hint?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <Label htmlFor={id} className={authLabel}>
                {label}
            </Label>
            <div className="relative">
                <Icon aria-hidden className={authIcon} />
                {children}
            </div>
            {hint && !error && (
                <p className="text-xs text-muted-foreground dark:text-white/50">{hint}</p>
            )}
            <InputError message={error} />
        </div>
    );
}

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        phone_number: "",
        npwp: "",
        address: "",
        password: "",
        password_confirmation: "",
    });

    const handleNpwpChange = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, "");
        setData("npwp", numericValue.slice(0, 16));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    const inputCls = cn(authInput, "pl-11");
    const eyeBtn =
        "absolute inset-y-0 right-1 grid w-10 place-items-center rounded-md text-brand-900/70 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 dark:text-white/60 dark:hover:text-white";

    return (
        <AuthShell headerVariant="card" headerAction={<MasukButton />} footerAlign="center">
            <Head title="Buat Akun" />

            <PortalCard className="mx-auto max-w-4xl">
                <div className="text-center">
                    <img
                        src="/images/logo.png"
                        alt="Brevet Learning System"
                        className="mx-auto h-14 w-auto dark:hidden md:h-16"
                    />
                    <img
                        src="/images/logo putih.png"
                        alt="Brevet Learning System"
                        className="mx-auto hidden h-14 w-auto dark:block md:h-16"
                    />
                    <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-brand-950 dark:text-white md:text-[30px]">
                        Buat Akun Brevet Learning System
                    </h1>
                    <p className="mx-auto mt-2 max-w-xl text-[15px] text-muted-foreground dark:text-white/60">
                        Silakan lengkapi data diri untuk mendaftar akun.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="mx-auto mt-8 grid max-w-3xl gap-x-6 gap-y-5 md:grid-cols-2"
                >
                    <Field id="name" label="Nama Lengkap" icon={User} error={errors.name}>
                        <Input
                            id="name"
                            name="name"
                            value={data.name}
                            autoComplete="name"
                            placeholder="Nama lengkap sesuai identitas"
                            onChange={(e) => setData("name", e.target.value)}
                            aria-invalid={!!errors.name}
                            autoFocus
                            required
                            disabled={processing}
                            className={inputCls}
                        />
                    </Field>

                    <Field id="email" label="Email" icon={Mail} error={errors.email}>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoComplete="email"
                            placeholder="nama@email.com"
                            onChange={(e) => setData("email", e.target.value)}
                            aria-invalid={!!errors.email}
                            required
                            disabled={processing}
                            className={inputCls}
                        />
                    </Field>

                    <Field
                        id="phone_number"
                        label="Nomor Telepon"
                        icon={Phone}
                        error={errors.phone_number}
                    >
                        <Input
                            id="phone_number"
                            type="tel"
                            inputMode="tel"
                            name="phone_number"
                            value={data.phone_number}
                            autoComplete="tel"
                            placeholder="08xxxxxxxxxx"
                            onChange={(e) => setData("phone_number", e.target.value)}
                            aria-invalid={!!errors.phone_number}
                            required
                            disabled={processing}
                            className={inputCls}
                        />
                    </Field>

                    <Field
                        id="npwp"
                        label="NPWP/NIK"
                        icon={IdCard}
                        error={errors.npwp}
                        hint={`16 digit angka · ${data.npwp.length}/16`}
                    >
                        <Input
                            id="npwp"
                            name="npwp"
                            inputMode="numeric"
                            value={data.npwp}
                            placeholder="Contoh: 1234567890000000"
                            onChange={(e) => handleNpwpChange(e.target.value)}
                            maxLength={16}
                            pattern="[0-9]{16}"
                            autoComplete="off"
                            aria-invalid={!!errors.npwp}
                            required
                            disabled={processing}
                            className={cn(inputCls, "font-mono tracking-wide")}
                        />
                    </Field>

                    <Field
                        id="address"
                        label="Alamat"
                        icon={MapPin}
                        error={errors.address}
                        className="md:col-span-2"
                    >
                        <Input
                            id="address"
                            name="address"
                            value={data.address}
                            autoComplete="street-address"
                            placeholder="Jl. Contoh No. 123"
                            onChange={(e) => setData("address", e.target.value)}
                            aria-invalid={!!errors.address}
                            required
                            disabled={processing}
                            className={inputCls}
                        />
                    </Field>

                    <Field
                        id="password"
                        label="Kata Sandi"
                        icon={LockKeyhole}
                        error={errors.password}
                    >
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={data.password}
                            autoComplete="new-password"
                            placeholder="Buat kata sandi"
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
                            className={eyeBtn}
                        >
                            {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                        </button>
                    </Field>

                    <Field
                        id="password_confirmation"
                        label="Konfirmasi Kata Sandi"
                        icon={LockKeyhole}
                        error={errors.password_confirmation}
                    >
                        <Input
                            id="password_confirmation"
                            type={showConfirmPassword ? "text" : "password"}
                            name="password_confirmation"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            placeholder="Ulangi kata sandi"
                            onChange={(e) =>
                                setData("password_confirmation", e.target.value)
                            }
                            aria-invalid={!!errors.password_confirmation}
                            required
                            disabled={processing}
                            className={cn(inputCls, "pr-12")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={processing}
                            aria-label={
                                showConfirmPassword
                                    ? "Sembunyikan konfirmasi kata sandi"
                                    : "Tampilkan konfirmasi kata sandi"
                            }
                            className={eyeBtn}
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="size-[18px]" />
                            ) : (
                                <Eye className="size-[18px]" />
                            )}
                        </button>
                    </Field>

                    <div className="mt-2 flex flex-col-reverse items-center gap-4 md:col-span-2 md:flex-row md:justify-between">
                        <p className="text-sm text-muted-foreground dark:text-white/60">
                            Sudah memiliki akun?{" "}
                            <Link
                                href={route("login")}
                                className={cn(
                                    "font-bold text-brand-800 underline-offset-4 hover:underline dark:text-highlight",
                                    processing && "pointer-events-none opacity-50",
                                )}
                            >
                                Masuk
                            </Link>
                        </p>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-11 w-full rounded-[10px] px-10 text-base font-bold shadow-[0_10px_24px_-12px_rgba(13,77,64,0.6)] dark:shadow-none md:w-auto"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Mendaftar...
                                </>
                            ) : (
                                "Daftar"
                            )}
                        </Button>
                    </div>
                </form>
            </PortalCard>
        </AuthShell>
    );
}
