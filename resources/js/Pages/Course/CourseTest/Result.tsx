import { Head, Link } from "@inertiajs/react";
import HeaderOnlyLayout from "@/Layouts/HeaderOnlyLayout";

export default function Result({ course, test, attempt, review }: any) {
    const showScore = Boolean(test?.show_score ?? true);
    const showCorrectAnswers = Boolean(test?.show_correct_answers ?? true);
    const statusLabel = attempt?.passed ? "Lulus" : "Tidak lulus";
    const statusClass = attempt?.passed
        ? "bg-emerald-100 text-emerald-700"
        : "bg-rose-100 text-rose-700";

    return (
        <HeaderOnlyLayout
            title={`Hasil Ujian - ${test?.title ?? ""}`}
            backHref={route("courses.courseTests.detail", [
                course?.id,
                test?.id,
            ])}
        >
            <Head title={`Hasil Ujian - ${test?.title ?? ""}`} />
            <div className="py-6 px-4">
                <div className="max-w-5xl mx-auto space-y-6">
                    {!showScore && showCorrectAnswers && (
                        <div className="flex justify-end">
                            <Link
                                href={route("courses.courseTests.detail", [
                                    course?.id,
                                    test?.id,
                                ])}
                                className="px-4 py-2 rounded border bg-emerald-50"
                            >
                                Kembali ke Detail Ujian
                            </Link>
                        </div>
                    )}

                    {showScore || showCorrectAnswers ? (
                        <>
                            {showScore && (
                                <div className="bg-card border rounded-xl p-6 shadow-sm flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">
                                            Skor Anda
                                        </div>
                                        <div className="text-3xl font-semibold">
                                            {attempt?.score ?? 0}
                                        </div>
                                        <div
                                            className={`mt-1 inline-flex text-xs px-2 py-0.5 rounded-full ${attempt?.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                                        >
                                            {attempt?.passed
                                                ? "Lulus"
                                                : "Tidak Lulus"}{" "}
                                            (KKM {test?.passing_score ?? 0})
                                        </div>
                                    </div>
                                    <Link
                                        href={route("courses.courseTests.detail", [
                                            course?.id,
                                            test?.id,
                                        ])}
                                        className="px-4 py-2 rounded border bg-emerald-50"
                                    >
                                        Kembali ke Detail Ujian
                                    </Link>
                                </div>
                            )}

                            {showCorrectAnswers && (
                                <div className="bg-card border rounded-xl p-6 shadow-sm">
                                    <h2 className="text-lg font-semibold mb-4">
                                        Review Jawaban
                                    </h2>
                                    <div className="space-y-4">
                                        {review?.map((r: any, idx: number) => (
                                            <div
                                                key={r.id}
                                                className="border rounded-lg p-4"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium">
                                                        Soal {idx + 1}
                                                    </div>
                                                    {r.is_correct === true && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                                            Benar
                                                        </span>
                                                    )}
                                                    {r.is_correct === false && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                                            Salah
                                                        </span>
                                                    )}
                                                    {r.is_correct === null && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                                                            Tidak dinilai
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2">
                                                    {r.question_text}
                                                </div>
                                                {r.question_type ===
                                                "short_answer" ? (
                                                    <div className="mt-2">
                                                        <div className="text-sm text-muted-foreground">
                                                            Jawaban Anda:
                                                        </div>
                                                        <div className="mt-1 whitespace-pre-wrap bg-muted/50 border rounded p-2">
                                                            {r.selected || "-"}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-3 space-y-2">
                                                        {r.options?.map(
                                                            (o: any) => {
                                                                const isSelected =
                                                                    r.selected ===
                                                                    o.id;
                                                                const isCorrect =
                                                                    o.is_correct;
                                                                return (
                                                                    <div
                                                                        key={o.id}
                                                                        className={`p-2 rounded border text-sm ${isCorrect ? "bg-emerald-50 border-emerald-200" : isSelected ? "bg-rose-50 border-rose-200" : "bg-card"}`}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="radio"
                                                                                disabled
                                                                                checked={
                                                                                    isSelected
                                                                                }
                                                                            />
                                                                            <span>
                                                                                {
                                                                                    o.option_text
                                                                                }
                                                                            </span>
                                                                            {isCorrect && (
                                                                                <span className="ml-auto text-xs text-emerald-700">
                                                                                    Kunci
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                                {showScore && showCorrectAnswers && r.explanation && (
                                                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-sm text-brand-ink">
                                                        <div className="font-semibold text-brand-ink mb-1">
                                                            Pembahasan
                                                        </div>
                                                        <div className="whitespace-pre-wrap leading-relaxed">
                                                            {r.explanation}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-card border rounded-xl p-8 shadow-sm text-center">
                            <div className="max-w-md mx-auto">
                                <div className="mb-4">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                                    >
                                        Status: {statusLabel}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">
                                    Hasil Ujian
                                </h2>
                                <p className="text-muted-foreground mb-6">
                                    Nilai disembunyikan oleh pengajar. Anda
                                    hanya dapat melihat status kelulusan.
                                </p>
                                <Link
                                    href={route("courses.courseTests.detail", [
                                        course?.id,
                                        test?.id,
                                    ])}
                                    className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                                >
                                    Kembali ke Detail Ujian
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </HeaderOnlyLayout>
    );
}
