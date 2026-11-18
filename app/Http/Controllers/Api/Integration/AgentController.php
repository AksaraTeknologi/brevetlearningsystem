<?php

namespace App\Http\Controllers\Api\Integration;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\CourseTest;
use App\Models\IntegrationClient;
use App\Models\Platform;
use App\Models\QuestionBank;
use App\Models\User;
use App\Services\Brevet\CourseRemedialService;
use App\Services\Brevet\ParticipantEnroller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * API untuk agent Cava. Baca: ability `agent:read`. Ubah: `agent:write`
 * (selalu tercatat di integration_audit_logs). Semua tanggal = jam WIB
 * apa adanya ("Y-m-d H:i:s"), sama seperti di database.
 */
class AgentController extends Controller
{
    private const FORMAT = 'Y-m-d H:i:s';

    public function courses(Request $request): JsonResponse
    {
        $request->validate(['scope' => 'nullable|in:active,all', 'codes' => 'nullable|string|max:2000']);
        /** @var IntegrationClient $client */
        $client = $request->user();
        $codes = array_values(array_filter(array_map(fn ($c) => strtolower(trim($c)), explode(',', (string) $request->input('codes')))));

        $query = $client->courseQuery()
            ->with(['courseSchedules', 'courseTests.questionBank:id,name'])
            ->withCount('participants')
            ->orderBy('start_date');

        if ($codes !== []) {
            $query->where(fn ($q) => $q->whereIn(\DB::raw('LOWER(code)'), $codes));
        }

        if ($request->input('scope', 'active') === 'active') {
            // Termasuk kelas yang baru selesai (remedial & sertifikat) dan yang segera mulai.
            $query->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', now()->subDays(21)->format(self::FORMAT)))
                ->where(fn ($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', now()->addDays(45)->format(self::FORMAT)));
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()->map(fn (Course $course) => $this->courseData($course))->values(),
        ]);
    }

    public function questionBanks(Request $request): JsonResponse
    {
        /** @var IntegrationClient $client */
        $client = $request->user();

        $banks = QuestionBank::query()
            ->when($client->teacher_id, fn ($q) => $q->where('teacher_id', $client->teacher_id))
            ->withCount('questions')
            ->orderBy('name')
            ->get(['id', 'name', 'is_active'])
            ->map(fn ($bank) => [
                'id' => $bank->id,
                'name' => $bank->name,
                'is_active' => (bool) $bank->is_active,
                'questions_count' => (int) $bank->questions_count,
            ]);

        return response()->json(['success' => true, 'data' => $banks]);
    }

    public function participants(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|min:3|max:100']);
        /** @var IntegrationClient $client */
        $client = $request->user();
        $q = $request->string('q')->trim()->value();
        $phone = ParticipantEnroller::formatPhone($q);
        $courseIds = $client->courseQuery()->pluck('id');
        $platforms = Platform::pluck('name', 'id');

        $users = User::query()
            ->where('role', 'pengguna')
            ->whereHas('courseUsers', fn ($cu) => $cu->whereIn('course_id', $courseIds))
            ->where(fn ($w) => $w->where('email', 'like', "%{$q}%")
                ->orWhere('name', 'like', "%{$q}%")
                ->when(strlen($phone) >= 6, fn ($x) => $x->orWhere('phone_number', 'like', "%{$phone}%")))
            ->with(['courses' => fn ($c) => $c->whereIn('courses.id', $courseIds)])
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'platform' => $platforms[$user->platform_id] ?? null,
                'last_login_at' => $user->getRawOriginal('last_login_at'),
                'courses' => $user->courses->map(fn ($c) => ['name' => $c->name, 'code' => $c->code])->values(),
            ])->values(),
        ]);
    }

    /**
     * Nilai per ujian HANYA untuk peserta yang dikirim (email / no. HP) — agent
     * sebuah platform tidak menerima data peserta platform lain.
     * Status per ujian: passed (pernah lulus, ujian atau remedial), failed (sudah
     * mengerjakan, belum pernah lulus), none (belum mengerjakan).
     */
    public function grades(Request $request, string $courseId): JsonResponse
    {
        /** @var IntegrationClient $client */
        $client = $request->user();
        $course = $client->courseQuery()->with('courseTests')->findOrFail($courseId);

        $validated = $request->validate([
            'emails' => 'nullable|array|max:1000',
            'emails.*' => 'string|max:255',
            'phones' => 'nullable|array|max:1000',
            'phones.*' => 'nullable|string|max:30',
        ]);
        $emails = collect($validated['emails'] ?? [])->map(fn ($e) => strtolower(trim($e)))->filter()->unique();
        $phones = collect($validated['phones'] ?? [])->map(fn ($p) => ParticipantEnroller::formatPhone($p))->filter(fn ($p) => strlen($p) >= 8)->unique();

        $enrollments = $course->participants()->with('user:id,name,email,phone_number,last_login_at')->get()
            ->filter(fn ($cu) => $cu->user && (
                $emails->contains(strtolower($cu->user->email))
                || (strlen($phone = ParticipantEnroller::formatPhone($cu->user->phone_number)) >= 8 && $phones->contains($phone))
            ));

        $tests = $course->courseTests->sortBy(fn ($t) => (string) $t->getRawOriginal('start_date'))->values();
        $userIds = $enrollments->pluck('user_id');
        $attempts = \App\Models\CourseTestAttempt::whereIn('user_id', $userIds)
            ->whereIn('course_test_id', $tests->pluck('id'))
            ->whereNotNull('submitted_at')
            ->selectRaw('user_id, course_test_id, MAX(score) as best_score, MAX(passed) as any_passed, COUNT(id) as attempts')
            ->groupBy('user_id', 'course_test_id')
            ->get()
            ->keyBy(fn ($a) => $a->user_id . '|' . $a->course_test_id);

        return response()->json([
            'success' => true,
            'data' => [
                'course' => ['id' => $course->id, 'name' => $course->name, 'code' => $course->code],
                'tests' => $tests->map(fn ($t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'passing_score' => (int) $t->passing_score,
                    'start_date' => $t->getRawOriginal('start_date'),
                    'end_date' => $t->getRawOriginal('end_date'),
                    'remedial_enabled' => (bool) $t->remedial_enabled,
                    'remedial_end_date' => $t->getRawOriginal('remedial_end_date'),
                ])->values(),
                'students' => $enrollments->map(fn ($cu) => [
                    'name' => $cu->user->name,
                    'email' => $cu->user->email,
                    'phone_number' => $cu->user->phone_number,
                    'last_login_at' => $cu->user->getRawOriginal('last_login_at'),
                    'scores' => $tests->map(function ($t) use ($attempts, $cu) {
                        $a = $attempts->get($cu->user_id . '|' . $t->id);

                        return [
                            'test_id' => $t->id,
                            'best_score' => $a ? (int) $a->best_score : null,
                            'attempts' => $a ? (int) $a->attempts : 0,
                            'status' => !$a ? 'none' : ((bool) $a->any_passed ? 'passed' : 'failed'),
                        ];
                    })->values(),
                ])->values(),
            ],
        ]);
    }

    public function storeTest(Request $request, string $courseId): JsonResponse
    {
        /** @var IntegrationClient $client */
        $client = $request->user();
        $course = $client->courseQuery()->findOrFail($courseId);
        $defaults = config('brevet.test_defaults', []);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'question_bank_id' => ['required', 'uuid', Rule::exists('question_banks', 'id')
                ->where(fn ($q) => $q->where('teacher_id', $course->teacher_id))],
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'passing_score' => 'nullable|integer|min:0|max:100',
            'max_attempts' => 'nullable|integer|min:0',
            'questions_to_show' => 'nullable|integer|min:1',
            'duration' => 'nullable|integer|min:0',
        ]);

        $payload = [
            'title' => $validated['title'],
            'question_bank_id' => $validated['question_bank_id'],
            'start_date' => Carbon::parse($validated['start_date'])->format(self::FORMAT),
            'end_date' => Carbon::parse($validated['end_date'])->format(self::FORMAT),
            'passing_score' => $validated['passing_score'] ?? ($defaults['passing_score'] ?? 70),
            'max_attempts' => $validated['max_attempts'] ?? ($defaults['max_attempts'] ?? 5),
            'questions_to_show' => $this->cappedQuestions($validated['question_bank_id'], $validated['questions_to_show'] ?? ($defaults['questions_to_show'] ?? 30)),
            'duration' => $validated['duration'] ?? ($defaults['duration'] ?? 120),
            'show_score' => $defaults['show_score'] ?? true,
            'show_correct_answers' => $defaults['show_correct_answers'] ?? false,
            'remedial_enabled' => false,
            'requires_submission' => false,
        ];
        $this->ensureWithinCourse($course, $payload['start_date'], $payload['end_date']);

        $test = $course->courseTests()->create($payload);
        $client->audit('test.create', $test, ['course' => $course->name] + $payload);

        return response()->json(['success' => true, 'data' => $this->testData($test->fresh('questionBank'))], 201);
    }

    public function updateTest(Request $request, string $testId): JsonResponse
    {
        /** @var IntegrationClient $client */
        $client = $request->user();
        $test = CourseTest::whereIn('course_id', $client->courseQuery()->select('id'))->findOrFail($testId);
        $course = $test->course;

        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'passing_score' => 'nullable|integer|min:0|max:100',
            'max_attempts' => 'nullable|integer|min:0',
            'questions_to_show' => 'nullable|integer|min:1',
        ]);

        $changes = [];
        foreach (['start_date', 'end_date'] as $field) {
            if (!empty($validated[$field])) {
                $changes[$field] = Carbon::parse($validated[$field])->format(self::FORMAT);
            }
        }
        foreach (['passing_score', 'max_attempts'] as $field) {
            if (array_key_exists($field, $validated) && $validated[$field] !== null) {
                $changes[$field] = (int) $validated[$field];
            }
        }
        if (!empty($validated['questions_to_show'])) {
            $changes['questions_to_show'] = $this->cappedQuestions($test->question_bank_id, (int) $validated['questions_to_show']);
        }
        if ($changes === []) {
            throw ValidationException::withMessages(['start_date' => 'Tidak ada perubahan yang dikirim.']);
        }

        $start = $changes['start_date'] ?? $test->getRawOriginal('start_date');
        $end = $changes['end_date'] ?? $test->getRawOriginal('end_date');
        if ($start && $end && Carbon::parse($end)->lt(Carbon::parse($start))) {
            throw ValidationException::withMessages(['end_date' => 'Waktu selesai ujian tidak boleh sebelum waktu mulai.']);
        }
        $this->ensureWithinCourse($course, $start, $end);

        $before = array_intersect_key($test->getRawOriginal(), $changes);
        $test->update($changes);
        $client->audit('test.update', $test, ['course' => $course->name, 'before' => $before, 'after' => $changes]);

        return response()->json(['success' => true, 'data' => $this->testData($test->fresh('questionBank'))]);
    }

    public function remedial(Request $request, string $courseId): JsonResponse
    {
        /** @var IntegrationClient $client */
        $client = $request->user();
        $course = $client->courseQuery()->findOrFail($courseId);

        $validated = $request->validate([
            'enabled' => 'required|boolean',
            'remedial_end_date' => 'nullable|required_if:enabled,true,1|date',
            'test_ids' => 'nullable|array',
            'test_ids.*' => 'uuid',
        ]);

        $testIds = $validated['test_ids'] ?? [];
        $result = app(CourseRemedialService::class)->apply($course, $request->boolean('enabled'), $validated['remedial_end_date'] ?? null, $testIds);
        $client->audit('remedial', $course, [
            'enabled' => $request->boolean('enabled'),
            'end' => $result['end']?->format(self::FORMAT),
            'count' => $result['count'],
            'test_ids' => $testIds,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'count' => $result['count'],
                'remedial_start' => $result['start']?->format(self::FORMAT),
                'remedial_end' => $result['end']?->format(self::FORMAT),
            ],
        ]);
    }

    public function resetPassword(Request $request, string $userId): JsonResponse
    {
        /** @var IntegrationClient $client */
        $client = $request->user();
        $courseIds = $client->courseQuery()->pluck('id');
        $user = User::where('role', 'pengguna')
            ->whereHas('courseUsers', fn ($cu) => $cu->whereIn('course_id', $courseIds))
            ->findOrFail($userId);

        $phone = ParticipantEnroller::formatPhone($user->phone_number);
        if (strlen($phone) < 8) {
            throw ValidationException::withMessages(['phone_number' => 'Nomor HP peserta kosong atau tidak valid; reset manual di panel.']);
        }

        $user->update(['password' => Hash::make($phone)]);
        $client->audit('participant.reset_password', $user, ['email' => $user->email]);

        return response()->json(['success' => true, 'data' => ['email' => $user->email, 'password_hint' => 'nomor HP terdaftar']]);
    }

    /**
     * Isi link Zoom untuk semua jadwal (kelas dalam cakupan) pada waktu yang
     * sama — satu sesi dipakai bersama beberapa kelas.
     */
    public function zoomLink(Request $request): JsonResponse
    {
        /** @var IntegrationClient $client */
        $client = $request->user();
        $validated = $request->validate([
            'scheduled_at' => 'required|date',
            'zoom_link' => 'required|url|max:2048',
            'overwrite' => 'nullable|boolean',
        ]);

        $at = Carbon::parse($validated['scheduled_at'])->format(self::FORMAT);
        $schedules = CourseSchedule::whereIn('course_id', $client->courseQuery()->select('id'))
            ->where('scheduled_at', $at)
            ->when(!$request->boolean('overwrite'), fn ($q) => $q->where(fn ($w) => $w->whereNull('zoom_link')->orWhere('zoom_link', '')))
            ->with('course:id,name')
            ->get();

        foreach ($schedules as $schedule) {
            $schedule->update(['zoom_link' => $validated['zoom_link']]);
        }
        $client->audit('schedule.zoom_link', null, ['scheduled_at' => $at, 'count' => $schedules->count()]);

        return response()->json([
            'success' => true,
            'data' => [
                'count' => $schedules->count(),
                'courses' => $schedules->pluck('course.name')->unique()->values(),
            ],
        ]);
    }

    private function courseData(Course $course): array
    {
        return [
            'id' => $course->id,
            'name' => $course->name,
            'code' => $course->code,
            'start_date' => $course->getRawOriginal('start_date'),
            'end_date' => $course->getRawOriginal('end_date'),
            'participants_count' => (int) $course->participants_count,
            'schedules' => $course->courseSchedules->map(fn ($s) => [
                'id' => $s->id,
                'title' => $s->title,
                'scheduled_at' => $s->getRawOriginal('scheduled_at'),
                'zoom_link' => $s->zoom_link,
            ])->values(),
            'tests' => $course->courseTests->sortBy(fn ($t) => (string) $t->getRawOriginal('start_date'))
                ->map(fn ($t) => $this->testData($t))->values(),
        ];
    }

    private function testData(CourseTest $test): array
    {
        return [
            'id' => $test->id,
            'title' => $test->title,
            'question_bank' => $test->questionBank ? ['id' => $test->questionBank->id, 'name' => $test->questionBank->name] : null,
            'start_date' => $test->getRawOriginal('start_date'),
            'end_date' => $test->getRawOriginal('end_date'),
            'passing_score' => (int) $test->passing_score,
            'max_attempts' => (int) $test->max_attempts,
            'questions_to_show' => $test->questions_to_show,
            'question_count' => $test->question_count,
            'duration' => (int) $test->duration,
            'remedial_enabled' => (bool) $test->remedial_enabled,
            'remedial_end_date' => $test->getRawOriginal('remedial_end_date'),
        ];
    }

    private function cappedQuestions(string $bankId, ?int $requested): ?int
    {
        if ($requested === null) {
            return null;
        }
        $count = QuestionBank::where('id', $bankId)->withCount('questions')->value('questions_count');

        return $count ? min($requested, (int) $count) : $requested;
    }

    private function ensureWithinCourse(Course $course, ?string $start, ?string $end): void
    {
        $courseStart = $course->getRawOriginal('start_date');
        $courseEnd = $course->getRawOriginal('end_date');
        if ($courseStart && $start && Carbon::parse($start)->lt(Carbon::parse($courseStart))) {
            throw ValidationException::withMessages(['start_date' => 'Waktu mulai ujian sebelum tanggal mulai kelas (' . substr($courseStart, 0, 10) . ').']);
        }
        if ($courseEnd && $end && Carbon::parse($end)->gt(Carbon::parse($courseEnd))) {
            throw ValidationException::withMessages(['end_date' => 'Waktu selesai ujian melewati tanggal akhir kelas (' . substr($courseEnd, 0, 16) . '). Ubah akhir kelas di panel bila perlu.']);
        }
    }
}
