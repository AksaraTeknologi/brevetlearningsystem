<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Bupot;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\CourseUser;
use App\Models\Invoice;
use App\Models\Other;
use App\Models\QuestionBank;
use App\Models\Retur;
use App\Models\ReturOther;
use App\Models\Spt;
use App\Models\User;
use App\Services\Brevet\CourseRotationPlanner;
use App\Support\ReferenceLinkNormalizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index()
    {
        $courses = Course::where('teacher_id', Auth::id())
            ->withCount(['modules', 'courseSchedules', 'courseTests'])
            ->orderBy('created_at', 'desc')
            ->get();

        $user = Auth::user();
        return Inertia::render('Teacher/Course/Course', [
            'courses' => $courses,
            'user' => $user,
        ]);
    }

    public function create()
    {
        $courses = Course::where('teacher_id', Auth::id())->get();
        $user = Auth::user();

        return Inertia::render('Teacher/Course/FormCreateCourse', [
            'courses' => $courses,
            'user' => $user,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateStorePayload($request);

        DB::transaction(function () use ($validated) {
            $courseData = [
                'id' => $validated['id'],
                'teacher_id' => Auth::id(),
                'name' => $validated['name'],
                'code' => $validated['code'],
                'description' => $validated['description'] ?? null,
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'access_rights' => !empty($validated['access_rights'])
                    ? json_encode($validated['access_rights'])
                    : null,
            ];

            $course = Course::create($courseData);

            foreach (($validated['schedules'] ?? []) as $schedulePayload) {
                $course->courseSchedules()->create([
                    'title' => $schedulePayload['title'],
                    'scheduled_at' => $schedulePayload['scheduled_at'],
                    'zoom_link' => $schedulePayload['zoom_link'] ?? null,
                ]);
            }

            foreach (($validated['course_tests'] ?? []) as $index => $courseTestPayload) {
                $this->validateCourseTestDateWindow($validated, $courseTestPayload, $index);

                $course->courseTests()->create([
                    'title' => $courseTestPayload['title'],
                    'description' => $courseTestPayload['description'] ?? null,
                    'duration' => $courseTestPayload['duration'] ?? 0,
                    'passing_score' => $courseTestPayload['passing_score'] ?? 0,
                    'question_bank_id' => $courseTestPayload['question_bank_id'],
                    'questions_to_show' => $courseTestPayload['questions_to_show'] ?? null,
                    'start_date' => $courseTestPayload['start_date'] ?? null,
                    'end_date' => $courseTestPayload['end_date'] ?? null,
                    'show_score' => $courseTestPayload['show_score'] ?? true,
                    'show_correct_answers' => $courseTestPayload['show_correct_answers'] ?? true,
                    'requires_submission' => !empty($courseTestPayload['requires_submission']),
                    'submission_instructions' => $courseTestPayload['submission_instructions'] ?? null,
                ]);
            }
        });

        return redirect()->route('teacher.courses')->with('success', 'Kelas berhasil ditambahkan!');
    }

    public function show($id)
    {
        $course = Course::with([
            'courseSchedules',
            'courseSubmissions' => function ($query) {
                $query->with(['submissions.user', 'submissions.reviews']);
            },
            'courseTests' => function ($query) {
                $query->with(['questionBank', 'courseSubmission']);
            },
        ])->findOrFail($id);
        $participants = $course->participants()
            ->with(['user', 'courseResults'])
            ->get()
            ->map(function ($participant) {
                $averageScore = null;
                if ($participant->courseResults && $participant->courseResults->count() > 0) {
                    $validScores = $participant->courseResults->whereNotNull('score')->pluck('score');

                    if ($validScores->count() > 0) {
                        $averageScore = round($validScores->avg(), 2);
                    }
                }

                $participant->average_score = $averageScore;
                return $participant;
            });

        $course->modules_count = $course->modules()->count();

        $questionBanks = QuestionBank::where('teacher_id', Auth::id())
            ->withCount('questions')
            ->orderBy('name')
            ->get(['id', 'name', 'is_active']);

        return Inertia::render('Teacher/Course/DetailCourse', [
            'course' => $course,
            'participants' => $participants,
            'courseSchedules' => $course->courseSchedules,
            'courseSubmissions' => $course->courseSubmissions,
            'courseTests' => $course->courseTests,
            'questionBanks' => $questionBanks,
        ]);
    }

    public function exportParticipants($id)
    {
        $course = Course::findOrFail($id);
        if ($course->teacher_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $fileName = 'peserta_kelas_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $course->title ?? 'course') . '.xlsx';

        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\CourseParticipantsExport($course), $fileName);
    }

    public function showParticipant($courseId, $participantId)
    {
        $course = Course::findOrFail($courseId);
        $participant = $course->participants()
            ->with(['user', 'courseResults'])
            ->findOrFail($participantId);

        $courseResults = $participant->courseResults;

        $invoiceIds = $courseResults->whereNotNull('invoice_id')->pluck('invoice_id')->toArray();
        $fakturs = Invoice::whereIn('id', $invoiceIds)->get();

        $returIds = $courseResults->whereNotNull('retur_id')->pluck('retur_id')->toArray();
        $returs = Retur::with('invoice')->whereIn('id', $returIds)->get();

        $otherIds = $courseResults->whereNotNull('other_id')->pluck('other_id')->toArray();
        $others = Other::whereIn('id', $otherIds)->get();

        $returOtherIds = $courseResults->whereNotNull('retur_other_id')->pluck('retur_other_id')->toArray();
        $returOthers = ReturOther::with('other')->whereIn('id', $returOtherIds)->get();

        $bupotIds = $courseResults->whereNotNull('bupot_id')->pluck('bupot_id')->toArray();
        $bupots = Bupot::with('object')->whereIn('id', $bupotIds)->get();

        $sptIds = $courseResults->whereNotNull('spt_id')->pluck('spt_id')->toArray();
        $spts = Spt::with('form')->whereIn('id', $sptIds)->orderBy('updated_at', 'desc')->get();

        $averageScore = null;
        if ($courseResults->count() > 0) {
            $validScores = $courseResults->whereNotNull('score')->pluck('score');
            if ($validScores->count() > 0) {
                $averageScore = round($validScores->avg(), 2);
            }
        }

        return Inertia::render('Teacher/Course/DetailParticipant', [
            'course' => $course,
            'participant' => $participant,
            'fakturs' => $fakturs,
            'returs' => $returs,
            'others' => $others,
            'returOthers' => $returOthers,
            'bupots' => $bupots,
            'spts' => $spts,
            'courseResults' => $courseResults,
            'averageScore' => $averageScore,
        ]);
    }

    public function edit($id)
    {
        $course = Course::findOrFail($id);
        return Inertia::render('Teacher/Course/FormEditCourse', [
            'course' => $course,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:courses,code,' . $id,
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'access_rights' => 'nullable|array',
            'access_rights.*' => 'in:efaktur,ebupot',
        ]);

        $course = Course::findOrFail($id);

        $course->update($validated);

        return redirect()->route('teacher.showCourse', $course->id)->with('success', 'Kelas berhasil diperbarui!');
    }

    public function destroy($id)
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return redirect()->route('teacher.courses')->with('success', 'Kelas berhasil dihapus!');
    }

    /**
     * Usulan jadwal & ujian kelas baru dari rotasi yang sedang berjalan.
     * Tidak menyimpan apa pun; hasilnya ditampilkan di pratinjau duplikat.
     * Bila `schedules` dikirim (jadwal hasil edit admin), hanya ujian dan
     * tanggal akhir kelas yang dihitung ulang.
     */
    public function duplicatePreview(Request $request, $id)
    {
        $original = Course::with(['courseSchedules', 'courseTests.questionBank:id,name'])->findOrFail($id);

        if ($original->teacher_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'start_date' => 'required|date',
            'with_tests' => 'nullable|boolean',
            'schedules' => 'nullable|array',
            'schedules.*.title' => 'required_with:schedules|string|max:255',
            'schedules.*.scheduled_at' => 'required_with:schedules|date',
        ]);

        $planner = CourseRotationPlanner::fromConfig();
        $withTests = $request->boolean('with_tests', true);
        $inputs = $this->rotationInputs($original, $validated['start_date']);

        if (!empty($validated['schedules'])) {
            $schedules = collect($validated['schedules'])
                ->map(fn ($row) => [
                    'title' => $row['title'],
                    'scheduled_at' => Carbon::parse($row['scheduled_at'])->format(CourseRotationPlanner::FORMAT),
                ])
                ->sortBy('scheduled_at')
                ->values()
                ->all();
            $type = $planner->detectType(array_column($schedules, 'scheduled_at'));
            [$tests, $warnings] = $withTests
                ? $planner->computeTests($schedules, $type, $inputs['source_tests'], $inputs['banks'])
                : [[], []];

            $plan = [
                'type' => $type,
                'start_date' => Carbon::parse($validated['start_date'])->startOfDay()->format(CourseRotationPlanner::FORMAT),
                'end_date' => $planner->endDate($schedules, $tests)->format(CourseRotationPlanner::FORMAT),
                'tests' => $tests,
                'warnings' => $warnings,
            ];
        } else {
            $plan = $planner->plan(
                $inputs['source_sessions'],
                $inputs['source_tests'],
                $inputs['stream'],
                $inputs['banks'],
                $validated['start_date'],
                $withTests,
            );
        }

        return response()->json([
            'plan' => $plan,
            'banks' => $inputs['banks'],
            'suggested_name' => $this->suggestCourseName($original),
        ]);
    }

    public function duplicate(Request $request, $id)
    {
        $original = Course::with([
            'courseSchedules:id,course_id,title,scheduled_at,zoom_link',
            'courseTests',
            'modules',
        ])->findOrFail($id);

        if ($original->teacher_id !== Auth::id()) {
            return back()->with('error', 'Unauthorized');
        }

        $user = Auth::user();
        if (!empty($user->max_class)) {
            $currentCount = Course::where('teacher_id', $user->id)->count();
            if ($currentCount >= (int) $user->max_class) {
                return back()->with('error', 'Jumlah Kelas sudah mencapai batas maksimal');
            }
        }

        // Tanpa tanggal mulai = salin apa adanya (perilaku lama).
        if (!$request->filled('start_date')) {
            return $this->duplicateAsIs($original);
        }

        $validated = $this->validateDuplicatePayload($request);
        $newCode = $this->generateUniqueCourseCode($original->code);

        foreach (($validated['course_tests'] ?? []) as $index => $courseTestPayload) {
            $this->validateCourseTestDateWindow($validated, $courseTestPayload, $index);
        }

        $newCourse = DB::transaction(function () use ($original, $validated, $newCode) {
            $course = Course::create([
                'teacher_id' => $original->teacher_id,
                'name' => $validated['name'],
                'code' => $newCode,
                'description' => $original->description,
                'start_date' => Carbon::parse($validated['start_date'])->format('Y-m-d H:i:s'),
                'end_date' => Carbon::parse($validated['end_date'])->format('Y-m-d H:i:s'),
                'access_rights' => $original->access_rights,
            ]);

            foreach ($validated['schedules'] as $schedule) {
                $course->courseSchedules()->create([
                    'title' => $schedule['title'],
                    'scheduled_at' => Carbon::parse($schedule['scheduled_at'])->format('Y-m-d H:i:s'),
                    'zoom_link' => $schedule['zoom_link'] ?? null,
                ]);
            }

            foreach (($validated['course_tests'] ?? []) as $test) {
                $course->courseTests()->create([
                    'title' => $test['title'],
                    'description' => $test['description'] ?? null,
                    'question_bank_id' => $test['question_bank_id'],
                    'duration' => $test['duration'] ?? 0,
                    'passing_score' => $test['passing_score'] ?? 0,
                    'questions_to_show' => $test['questions_to_show'] ?? null,
                    'max_attempts' => $test['max_attempts'] ?? 0,
                    'start_date' => Carbon::parse($test['start_date'])->format('Y-m-d H:i:s'),
                    'end_date' => Carbon::parse($test['end_date'])->format('Y-m-d H:i:s'),
                    'show_score' => $test['show_score'] ?? true,
                    'show_correct_answers' => $test['show_correct_answers'] ?? false,
                    'reference_link' => ReferenceLinkNormalizer::normalize($test['reference_link'] ?? null),
                    'remedial_enabled' => false,
                    'remedial_end_date' => null,
                    'requires_submission' => false,
                ]);
            }

            $this->copyModules($original, $course);

            return $course;
        });

        return redirect()->route('teacher.showCourse', $newCourse->id)
            ->with('success', "Kelas {$newCourse->name} berhasil dibuat dari {$original->name}.");
    }

    private function duplicateAsIs(Course $original)
    {
        $newCode = $this->generateUniqueCourseCode($original->code);

        DB::transaction(function () use ($original, $newCode) {
            $duplicateCourse = Course::create([
                'teacher_id' => $original->teacher_id,
                'name' => $original->name . ' (Salinan)',
                'code' => $newCode,
                'description' => $original->description,
                'start_date' => $original->getRawOriginal('start_date'),
                'end_date' => $original->getRawOriginal('end_date'),
                'access_rights' => $original->access_rights,
            ]);

            foreach ($original->courseSchedules as $schedule) {
                $duplicateCourse->courseSchedules()->create([
                    'title' => $schedule->title,
                    'scheduled_at' => $schedule->getRawOriginal('scheduled_at'),
                    'zoom_link' => $schedule->zoom_link,
                ]);
            }

            foreach ($original->courseTests as $courseTest) {
                $duplicateCourse->courseTests()->create([
                    'title' => $courseTest->title,
                    'description' => $courseTest->description,
                    'duration' => $courseTest->duration,
                    'passing_score' => $courseTest->passing_score,
                    'question_bank_id' => $courseTest->question_bank_id,
                    'questions_to_show' => $courseTest->questions_to_show,
                    'max_attempts' => $courseTest->max_attempts,
                    'reference_link' => $courseTest->reference_link,
                    'start_date' => $courseTest->getRawOriginal('start_date'),
                    'end_date' => $courseTest->getRawOriginal('end_date'),
                    'show_score' => $courseTest->show_score,
                    'show_correct_answers' => $courseTest->show_correct_answers,
                ]);
            }

            $this->copyModules($original, $duplicateCourse);
        });

        return redirect()->route('teacher.courses')->with('success', 'Kelas berhasil diduplikasi.');
    }

    private function copyModules(Course $original, Course $target): void
    {
        foreach ($original->modules as $module) {
            $filePath = $module->file_path;

            if ($module->isFile() && $module->file_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($module->file_path)) {
                $oldPath = $module->file_path;
                $filename = time() . '_' . basename($oldPath);
                $newPath = 'course-modules/' . $filename;
                \Illuminate\Support\Facades\Storage::disk('public')->copy($oldPath, $newPath);
                $filePath = $newPath;
            }

            $target->modules()->create([
                'title' => $module->title,
                'description' => $module->description,
                'type' => $module->type,
                'file_path' => $filePath,
                'original_filename' => $module->original_filename,
                'link_url' => $module->link_url,
                'is_active' => $module->is_active ?? true,
                'order' => $module->order,
            ]);
        }
    }

    /**
     * Data untuk planner: jadwal & ujian kelas sumber, sesi rotasi dari kelas
     * sejenis (nama berawalan sama, mis. "WEEKEND"), dan bank soal pengajar.
     */
    private function rotationInputs(Course $original, string $startDate): array
    {
        $sourceSessions = $original->courseSchedules->map(fn ($schedule) => [
            'title' => $schedule->title,
            'scheduled_at' => $schedule->getRawOriginal('scheduled_at'),
            'zoom_link' => $schedule->zoom_link,
        ])->all();

        $sourceTests = $original->courseTests->map(fn ($test) => [
            'title' => $test->title,
            'question_bank_id' => $test->question_bank_id,
            'bank_name' => $test->questionBank?->name,
            'description' => $test->description,
            'duration' => $test->duration,
            'passing_score' => $test->passing_score,
            'questions_to_show' => $test->questions_to_show,
            'max_attempts' => $test->max_attempts,
            'show_score' => $test->show_score,
            'show_correct_answers' => $test->show_correct_answers,
            'reference_link' => $test->reference_link,
            'start_date' => $test->getRawOriginal('start_date'),
        ])->all();

        $courses = Course::where('teacher_id', $original->teacher_id)
            ->get(['id', 'name', 'start_date', 'created_at']);
        $prefix = $this->courseNamePrefix($original->name);
        $siblings = $prefix !== ''
            ? $courses->filter(fn ($course) => $this->courseNamePrefix($course->name) === $prefix)
            : collect();
        if ($siblings->isEmpty()) {
            $siblings = $courses;
        }
        // Kelas terbaru lebih dulu: bila jadwal antar kelas bertabrakan, yang terbaru dipakai.
        $rank = $siblings
            ->sortByDesc(fn ($course) => (string) ($course->getRawOriginal('start_date') ?? $course->getRawOriginal('created_at')))
            ->values()
            ->mapWithKeys(fn ($course, $index) => [$course->id => ['rank' => $index, 'name' => $course->name]]);

        $stream = CourseSchedule::whereIn('course_id', $rank->keys())
            ->where('scheduled_at', '>=', Carbon::parse($startDate)->startOfDay()->format('Y-m-d H:i:s'))
            ->get(['course_id', 'title', 'scheduled_at', 'zoom_link'])
            ->sortBy(fn ($schedule) => sprintf('%s|%05d', $schedule->getRawOriginal('scheduled_at'), $rank[$schedule->course_id]['rank']))
            ->map(fn ($schedule) => [
                'title' => $schedule->title,
                'scheduled_at' => $schedule->getRawOriginal('scheduled_at'),
                'zoom_link' => $schedule->zoom_link,
                'course_name' => $rank[$schedule->course_id]['name'],
            ])
            ->values()
            ->all();

        $banks = QuestionBank::where('teacher_id', $original->teacher_id)
            ->withCount('questions')
            ->orderBy('name')
            ->get(['id', 'name', 'is_active'])
            ->map(fn ($bank) => [
                'id' => $bank->id,
                'name' => $bank->name,
                'questions_count' => (int) $bank->questions_count,
                'is_active' => (bool) $bank->is_active,
            ])
            ->all();

        return [
            'source_sessions' => $sourceSessions,
            'source_tests' => $sourceTests,
            'stream' => $stream,
            'banks' => $banks,
        ];
    }

    private function courseNamePrefix(?string $name): string
    {
        return mb_strtoupper(trim(preg_replace('/\s*\d+\s*$/', '', (string) $name)));
    }

    private function suggestCourseName(Course $original): string
    {
        $prefix = trim(preg_replace('/\s*\d+\s*$/', '', $original->name));
        if ($prefix === '' || $prefix === trim($original->name)) {
            return $original->name . ' (Salinan)';
        }

        $max = Course::where('teacher_id', $original->teacher_id)
            ->pluck('name')
            ->filter(fn ($name) => $this->courseNamePrefix($name) === mb_strtoupper($prefix))
            ->map(fn ($name) => (int) (preg_match('/(\d+)\s*$/', $name, $m) ? $m[1] : 0))
            ->max();

        return $prefix . ' ' . ((int) $max + 1);
    }

    private function validateDuplicatePayload(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',

            'schedules' => 'required|array|min:1',
            'schedules.*.title' => 'required|string|max:255',
            'schedules.*.scheduled_at' => 'required|date',
            'schedules.*.zoom_link' => 'nullable|string|max:2048',

            'course_tests' => 'nullable|array',
            'course_tests.*.title' => 'required|string|max:255',
            'course_tests.*.description' => 'nullable|string',
            'course_tests.*.question_bank_id' => [
                'required',
                'uuid',
                Rule::exists('question_banks', 'id')
                    ->where(fn ($query) => $query->where('teacher_id', Auth::id())),
            ],
            'course_tests.*.duration' => 'nullable|integer|min:0',
            'course_tests.*.passing_score' => 'nullable|integer|min:0|max:100',
            'course_tests.*.questions_to_show' => 'nullable|integer|min:1',
            'course_tests.*.max_attempts' => 'nullable|integer|min:0',
            'course_tests.*.start_date' => 'required|date',
            'course_tests.*.end_date' => 'required|date',
            'course_tests.*.show_score' => 'nullable|boolean',
            'course_tests.*.show_correct_answers' => 'nullable|boolean',
            'course_tests.*.reference_link' => 'nullable|array',
        ], [
            'schedules.required' => 'Jadwal kelas baru masih kosong.',
            'course_tests.*.question_bank_id.required' => 'Pilih bank soal untuk setiap ujian.',
        ]);
    }

    public function removeParticipant($courseId, $participantId)
    {
        $course = Course::findOrFail($courseId);

        if ($course->teacher_id !== Auth::id()) {
            return back()->with('error', 'Unauthorized');
        }

        $participant = CourseUser::findOrFail($participantId);

        if ($participant->course_id !== $courseId) {
            return back()->with('error', 'Participant not found in this course');
        }

        $participant->courseResults()->delete();

        $participant->delete();

        return back()->with('success', 'Peserta berhasil dihapus dari kelas');
    }

    public function searchUsers(Request $request)
    {
        $search = $request->get('search');
        $courseId = $request->get('course_id');

        if (strlen($search) < 2) {
            return response()->json([]);
        }

        // Get existing participant user IDs for this course
        $existingParticipantIds = CourseUser::where('course_id', $courseId)
            ->pluck('user_id')
            ->toArray();

        // Search users with role 'pengguna' only, excluding existing participants
        $users = User::where('role', 'pengguna')
            ->where(function ($query) use ($search) {
                $query->where('name', 'LIKE', '%' . $search . '%')
                    ->orWhere('email', 'LIKE', '%' . $search . '%');
            })
            ->whereNotIn('id', $existingParticipantIds)
            ->limit(10)
            ->get(['id', 'name', 'email']);

        // Return JSON response, bukan Inertia render
        return response()->json([
            'searchResults' => $users
        ]);
    }

    public function addParticipant(Request $request, $courseId)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $course = Course::findOrFail($courseId);

        // Verify course ownership
        if ($course->teacher_id !== Auth::id()) {
            return back()->with('error', 'Unauthorized');
        }

        $user = User::findOrFail($request->user_id);

        // Verify user role
        if ($user->role !== 'pengguna') {
            return back()->with('error', 'Hanya pengguna dengan role "pengguna" yang dapat ditambahkan');
        }

        // Check if user is already a participant
        $existingParticipant = CourseUser::where('course_id', $courseId)
            ->where('user_id', $request->user_id)
            ->first();

        if ($existingParticipant) {
            return back()->with('error', 'Pengguna sudah terdaftar di kelas ini');
        }

        // Add participant
        CourseUser::create([
            'user_id' => $request->user_id,
            'course_id' => $courseId,
        ]);

        return back()->with('success', $user->name . ' berhasil ditambahkan ke kelas');
    }

    private function validateStorePayload(Request $request): array
    {
        return $request->validate([
            'id' => 'required|uuid',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:courses,code',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'access_rights' => 'nullable|array',
            'access_rights.*' => 'in:efaktur,ebupot',

            'schedules' => 'nullable|array',
            'schedules.*.title' => 'required|string|max:255',
            'schedules.*.scheduled_at' => 'required|date',
            'schedules.*.zoom_link' => 'nullable|url|max:2048',

            'course_tests' => 'nullable|array',
            'course_tests.*.title' => 'required|string|max:255',
            'course_tests.*.description' => 'nullable|string',
            'course_tests.*.duration' => 'nullable|integer|min:0',
            'course_tests.*.passing_score' => 'nullable|integer|min:0|max:100',
            'course_tests.*.question_bank_id' => [
                'required',
                'uuid',
                Rule::exists('question_banks', 'id')
                    ->where(fn($query) => $query->where('teacher_id', Auth::id())),
            ],
            'course_tests.*.questions_to_show' => [
                'nullable',
                'integer',
                'min:1',
                function ($attribute, $value, $fail) use ($request) {
                    if (is_null($value) || $value === '') {
                        return;
                    }

                    if (!preg_match('/course_tests\.(\d+)\.questions_to_show/', $attribute, $matches)) {
                        return;
                    }

                    $index = (int) $matches[1];
                    $questionBankId = data_get($request->input('course_tests'), "{$index}.question_bank_id");
                    if (!$questionBankId) {
                        return;
                    }

                    $questionCount = QuestionBank::where('id', $questionBankId)
                        ->where('teacher_id', Auth::id())
                        ->withCount('questions')
                        ->value('questions_count');

                    if (is_null($questionCount)) {
                        return;
                    }

                    if ((int) $value > (int) $questionCount) {
                        $fail("Jumlah soal ditampilkan tidak boleh melebihi total soal pada bank ({$questionCount}).");
                    }
                },
            ],
            'course_tests.*.start_date' => 'nullable|date',
            'course_tests.*.end_date' => 'nullable|date|after_or_equal:course_tests.*.start_date',
            'course_tests.*.show_score' => 'nullable|boolean',
            'course_tests.*.show_correct_answers' => 'nullable|boolean',
            'course_tests.*.requires_submission' => 'nullable|boolean',
            'course_tests.*.submission_instructions' => 'nullable|string',
        ]);
    }

    private function generateUniqueCourseCode(string $originalCode): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        $length = 8;

        for ($attempt = 0; $attempt < 100; $attempt++) {
            $candidate = '';
            for ($i = 0; $i < $length; $i++) {
                $candidate .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }

            if ($candidate !== $originalCode && !Course::where('code', $candidate)->exists()) {
                return $candidate;
            }
        }

        $fallback = substr(bin2hex(random_bytes(6)), 0, 8);
        if ($fallback === $originalCode || Course::where('code', $fallback)->exists()) {
            $fallback .= substr((string) time(), -2);
        }

        return $fallback;
    }

    private function validateCourseTestDateWindow(array $coursePayload, array $courseTestPayload, int $index): void
    {
        $courseStart = !empty($coursePayload['start_date']) ? Carbon::parse($coursePayload['start_date']) : null;
        $courseEnd = !empty($coursePayload['end_date']) ? Carbon::parse($coursePayload['end_date']) : null;
        $testStart = !empty($courseTestPayload['start_date']) ? Carbon::parse($courseTestPayload['start_date']) : null;
        $testEnd = !empty($courseTestPayload['end_date']) ? Carbon::parse($courseTestPayload['end_date']) : null;

        if ($testStart && $testEnd && $testEnd->lt($testStart)) {
            throw ValidationException::withMessages([
                "course_tests.{$index}.end_date" => 'Waktu selesai ujian tidak boleh sebelum waktu mulai ujian.',
            ]);
        }

        if ($courseStart && $testStart && $testStart->lt($courseStart)) {
            throw ValidationException::withMessages([
                "course_tests.{$index}.start_date" => 'Waktu mulai ujian tidak boleh sebelum tanggal mulai kelas.',
            ]);
        }

        if ($courseEnd && $testStart && $testStart->gt($courseEnd)) {
            throw ValidationException::withMessages([
                "course_tests.{$index}.start_date" => 'Waktu mulai ujian tidak boleh melebihi tanggal selesai kelas.',
            ]);
        }

        if ($courseStart && $testEnd && $testEnd->lt($courseStart)) {
            throw ValidationException::withMessages([
                "course_tests.{$index}.end_date" => 'Waktu selesai ujian tidak boleh sebelum tanggal mulai kelas.',
            ]);
        }

        if ($courseEnd && $testEnd && $testEnd->gt($courseEnd)) {
            throw ValidationException::withMessages([
                "course_tests.{$index}.end_date" => 'Waktu selesai ujian tidak boleh melebihi tanggal selesai kelas.',
            ]);
        }
    }
}
