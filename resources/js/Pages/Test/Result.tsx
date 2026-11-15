import { Head, Link } from "@inertiajs/react";
import HeaderOnlyLayout from "@/Layouts/HeaderOnlyLayout";

import { Button } from "@/Components/ui/button";
import { EmptyState, Notice, Section, StatusPill } from "@/Components/app-shell/kit";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, CheckCircle2, CircleHelp, Lightbulb, ListChecks, X, XCircle } from "lucide-react";

function ScoreRing({ score, passed }: { score: number; passed: boolean }) {
    const pct = Math.max(0, Math.min(100, Number(score) || 0));
    return (
        <div
            className="relative grid size-28 shrink-0 place-items-center rounded-full"
            style={{
                background: `conic-gradient(hsl(var(${passed ? "--success" : "--destructive"})) ${pct * 3.6}deg, hsl(var(--muted)) 0deg)`,
            }}
        >
            <div className="grid size-[5.5rem] place-items-center rounded-full bg-card">
                <span className="text-3xl font-bold text-foreground">{score ?? 0}</span>
            </div>
        </div>
    );
}

export default function Result({ test, attempt, review }: any) {
    const showScore = Boolean(test?.show_score ?? true);
    const showCorrectAnswers = Boolean(test?.show_correct_answers ?? true);
    const list: any[] = Array.isArray(review) ? review : [];
    const correct = list.filter((r) => r.is_correct === true).length;
    const wrong = list.filter((r) => r.is_correct === false).length;
    const ungraded = list.filter((r) => r.is_correct === null).length;

    const backButton = (
        <Button variant="outline" asChild>
            <Link href={route("tests.detail", test?.id)}>
                <ArrowLeft />
                Kembali ke Deskripsi
            </Link>
        </Button>
    );

    return (
        <HeaderOnlyLayout
            title={`Hasil Ujian - ${test?.title ?? ""}`}
            backHref={route("tests.index")}
        >
            <Head title={`Hasil Ujian - ${test?.title ?? ""}`} />
            <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
                {!showScore && showCorrectAnswers && <div className="flex justify-end">{backButton}</div>}

                {showScore || showCorrectAnswers ? (
                    <>
                        {showScore && (
                            <section className="tls-card flex flex-col gap-5 p-5 md:flex-row md:items-center md:p-6">
                                <ScoreRing score={attempt?.score ?? 0} passed={Boolean(attempt?.passed)} />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skor Anda</p>
                                    <h2 className="text-xl font-bold text-brand-950">{test?.title}</h2>
                                    <StatusPill tone={attempt?.passed ? "success" : "destructive"}>
                                        {attempt?.passed ? "Lulus" : "Tidak Lulus"} (KKM {test?.passing_score ?? 0})
                                    </StatusPill>
                                    {list.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1 text-sm">
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1 font-semibold text-success">
                                                <CheckCircle2 className="size-4" /> {correct} Benar
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-1 font-semibold text-destructive">
                                                <XCircle className="size-4" /> {wrong} Salah
                                            </span>
                                            {ungraded > 0 && (
                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
                                                    <CircleHelp className="size-4" /> {ungraded} Tidak dinilai
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="shrink-0">{backButton}</div>
                            </section>
                        )}

                        {showCorrectAnswers && (
                            <Section icon={ListChecks} title="Review Jawaban" description={`${list.length} soal`}>
                                <div className="space-y-4">
                                    {list.map((r: any, idx: number) => (
                                        <div
                                            key={r.id}
                                            className={cn(
                                                "rounded-2xl border border-l-4 border-border p-4",
                                                r.is_correct === true && "border-l-success",
                                                r.is_correct === false && "border-l-destructive",
                                                r.is_correct === null && "border-l-steel"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-950">
                                                    <span className="grid size-7 place-items-center rounded-lg bg-muted text-xs">{idx + 1}</span>
                                                    Soal {idx + 1}
                                                </span>
                                                {r.is_correct === true && <StatusPill tone="success">Benar</StatusPill>}
                                                {r.is_correct === false && <StatusPill tone="destructive">Salah</StatusPill>}
                                                {r.is_correct === null && <StatusPill tone="steel">Tidak dinilai</StatusPill>}
                                            </div>
                                            <div className="mt-3 text-foreground">{r.question_text}</div>
                                            {r.question_type === "short_answer" ? (
                                                <div className="mt-3">
                                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jawaban Anda</div>
                                                    <div className="mt-1 whitespace-pre-wrap rounded-xl border border-border bg-muted/50 p-3 text-sm">
                                                        {r.selected || "-"}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-3 space-y-2">
                                                    {r.options?.map((o: any, oi: number) => {
                                                        const isSelected = r.selected === o.id;
                                                        const isCorrect = o.is_correct;
                                                        return (
                                                            <div
                                                                key={o.id}
                                                                className={cn(
                                                                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm",
                                                                    isCorrect
                                                                        ? "border-success/40 bg-success/10"
                                                                        : isSelected
                                                                        ? "border-destructive/40 bg-destructive/10"
                                                                        : "border-border bg-card"
                                                                )}
                                                            >
                                                                <span
                                                                    className={cn(
                                                                        "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold",
                                                                        isCorrect
                                                                            ? "border-success bg-success text-success-foreground"
                                                                            : isSelected
                                                                            ? "border-destructive bg-destructive text-destructive-foreground"
                                                                            : "border-border text-muted-foreground"
                                                                    )}
                                                                    aria-label={isSelected ? "Jawaban Anda" : undefined}
                                                                >
                                                                    {isCorrect ? <Check className="size-3.5" /> : isSelected ? <X className="size-3.5" /> : String.fromCharCode(65 + oi)}
                                                                </span>
                                                                <span className="flex-1">{o.option_text}</span>
                                                                {isSelected && (
                                                                    <span className="text-xs font-semibold text-muted-foreground">Jawaban Anda</span>
                                                                )}
                                                                {isCorrect && <span className="text-xs font-semibold text-success">Kunci</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {showScore && showCorrectAnswers && r.explanation && (
                                                <Notice tone="info" className="mt-3" title={<span className="inline-flex items-center gap-1.5"><Lightbulb className="size-4" /> Pembahasan</span>}>
                                                    <div className="whitespace-pre-wrap text-foreground">{r.explanation}</div>
                                                </Notice>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </>
                ) : (
                    <EmptyState
                        icon={CheckCircle2}
                        title="Selamat Anda Telah Mengerjakan Ujian"
                        description="Ujian Anda telah berhasil dikumpulkan. Nilai akan diumumkan oleh pengajar."
                        action={
                            <Button variant="success" asChild>
                                <Link href={route("tests.index")}>Kembali ke Daftar Ujian</Link>
                            </Button>
                        }
                        className="tls-card border-solid py-14"
                    />
                )}
            </div>
        </HeaderOnlyLayout>
    );
}
