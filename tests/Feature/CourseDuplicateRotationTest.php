<?php

namespace Tests\Feature;

use App\Imports\UserImport;
use App\Models\Course;
use App\Models\CourseTest;
use App\Models\CourseUser;
use App\Models\Event;
use App\Models\Platform;
use App\Models\QuestionBank;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CourseDuplicateRotationTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;
    private array $banks = [];

    protected function setUp(): void
    {
        parent::setUp();

        Event::firstOrCreate(['id' => 1], ['code' => 'PUB001', 'name' => 'Public']);

        $this->teacher = User::create([
            'id' => (string) Str::uuid(),
            'event_id' => 1,
            'name' => 'BIINSPIRA',
            'email' => 'pengajar_' . Str::random(5) . '@test.com',
            'phone_number' => '081200000000',
            'role' => 'pengajar',
            'password' => bcrypt('secret'),
        ]);

        foreach (['PPN', 'PBB & BPHTB', 'AKUNTANSI PERPAJAKAN', 'PEMERIKSAAN', 'KUP', 'PPH OP', 'POTPUT', 'PPH BADAN'] as $name) {
            $this->banks[$name] = QuestionBank::create([
                'teacher_id' => $this->teacher->id,
                'name' => "BANK SOAL {$name}",
                'is_active' => true,
            ]);
        }
    }

    private function makeCourse(string $name, string $start, string $end, array $sessions, array $tests = []): Course
    {
        $course = Course::create([
            'teacher_id' => $this->teacher->id,
            'name' => $name,
            'code' => Str::random(8),
            'start_date' => $start,
            'end_date' => $end,
        ]);

        foreach ($sessions as [$title, $at]) {
            $course->courseSchedules()->create(['title' => $title, 'scheduled_at' => $at, 'zoom_link' => null]);
        }

        foreach ($tests as [$title, $bank, $maxAttempts, $startAt, $endAt]) {
            $course->courseTests()->create([
                'title' => $title,
                'question_bank_id' => $this->banks[$bank]->id,
                'duration' => 120,
                'passing_score' => 70,
                'questions_to_show' => 30,
                'max_attempts' => $maxAttempts,
                'start_date' => $startAt,
                'end_date' => $endAt,
            ]);
        }

        return $course;
    }

    private function weekday40(): Course
    {
        return $this->makeCourse('WEEKDAY 40', '2026-10-27 00:00:00', '2026-11-30 23:59:59', [
            ['AKUNTANSI PERPAJAKAN', '2026-10-27 18:30:00'],
            ['KUP', '2026-10-28 18:30:00'],
            ['PPH OP SESI 1', '2026-10-29 18:30:00'],
            ['PPH OP SESI 2', '2026-11-03 18:30:00'],
            ['PBB & BPHTB', '2026-11-04 18:30:00'],
            ['PPH POT-PUT SESI 1', '2026-11-05 18:30:00'],
            ['PPH POT-PUT SESI 2', '2026-11-10 18:30:00'],
            ['PPH BADAN SESI 1', '2026-11-11 18:30:00'],
            ['PPH BADAN SESI 2', '2026-11-12 18:30:00'],
            ['PPN SESI 1', '2026-11-17 18:30:00'],
            ['PPN SESI 2', '2026-11-18 18:30:00'],
            ['PEMERIKSAAN, KEBERATAN, & BANDING SESI 1', '2026-11-19 18:30:00'],
            ['PEMERIKSAAN, KEBERATAN, & BANDING SESI 2', '2026-11-24 18:30:00'],
        ], [
            ['AKUNTANSI PERPAJAKAN', 'AKUNTANSI PERPAJAKAN', 0, '2026-10-28 08:00:00', '2026-11-03 23:59:00'],
            ['PPH BADAN', 'PPH BADAN', 5, '2026-11-13 08:00:00', '2026-11-19 23:59:00'],
        ]);
    }

    public function test_preview_builds_rotation_from_running_class(): void
    {
        $source = $this->weekday40();
        // Kelas lain (bukan WEEKDAY) tidak boleh ikut rotasi.
        $this->makeCourse('INTENSIVE CLASS PPN', '2026-11-11 00:00:00', '2026-11-30 23:59:59', [
            ['PPN', '2026-11-11 18:30:00'],
        ]);

        $response = $this->actingAs($this->teacher)
            ->postJson(route('teacher.duplicateCoursePreview', $source->id), ['start_date' => '2026-11-11']);

        $response->assertOk()
            ->assertJsonPath('suggested_name', 'WEEKDAY 41')
            ->assertJsonPath('plan.type', 'weekday')
            ->assertJsonPath('plan.schedules.0.title', 'PPH BADAN SESI 1')
            ->assertJsonPath('plan.schedules.0.scheduled_at', '2026-11-11 18:30:00')
            ->assertJsonPath('plan.end_date', '2026-12-16 23:59:59')
            ->assertJsonCount(13, 'plan.schedules')
            ->assertJsonCount(8, 'plan.tests');

        $this->assertStringContainsString('WEEKDAY 40', $response->json('plan.schedules.0.origin_label'));
        $this->assertDatabaseCount('courses', 2); // pratinjau tidak menyimpan apa pun
    }

    public function test_preview_recomputes_tests_from_edited_schedule(): void
    {
        $source = $this->weekday40();

        $response = $this->actingAs($this->teacher)
            ->postJson(route('teacher.duplicateCoursePreview', $source->id), [
                'start_date' => '2026-11-11',
                'schedules' => [
                    ['title' => 'PPH BADAN SESI 1', 'scheduled_at' => '2026-11-11 18:30:00'],
                    // sesi 2 diundur seminggu oleh admin
                    ['title' => 'PPH BADAN SESI 2', 'scheduled_at' => '2026-11-19 18:30:00'],
                ],
            ]);

        $response->assertOk()
            ->assertJsonCount(1, 'plan.tests')
            ->assertJsonPath('plan.tests.0.start_date', '2026-11-20 08:00:00')
            ->assertJsonPath('plan.tests.0.end_date', '2026-11-26 23:59:59');
    }

    public function test_duplicate_saves_schedule_tests_and_settings(): void
    {
        $source = $this->weekday40();
        $plan = $this->actingAs($this->teacher)
            ->postJson(route('teacher.duplicateCoursePreview', $source->id), ['start_date' => '2026-11-11'])
            ->json('plan');

        $response = $this->actingAs($this->teacher)->post(route('teacher.duplicateCourse', $source->id), [
            'name' => 'WEEKDAY 41',
            'start_date' => $plan['start_date'],
            'end_date' => $plan['end_date'],
            'schedules' => $plan['schedules'],
            'course_tests' => $plan['tests'],
        ]);

        $new = Course::where('name', 'WEEKDAY 41')->firstOrFail();
        $response->assertRedirect(route('teacher.showCourse', $new->id));

        $this->assertSame('2026-11-11 00:00:00', $new->getRawOriginal('start_date'));
        $this->assertSame('2026-12-16 23:59:59', $new->getRawOriginal('end_date'));
        $this->assertSame(13, $new->courseSchedules()->count());
        $this->assertSame('2026-11-11 18:30:00', $new->courseSchedules()->first()->getRawOriginal('scheduled_at'));

        $badan = $new->courseTests()->where('title', 'PPH BADAN')->firstOrFail();
        $this->assertSame('2026-11-13 08:00:00', $badan->getRawOriginal('start_date'));
        $this->assertSame(5, $badan->max_attempts);
        $this->assertFalse($badan->remedial_enabled);

        // max_attempts sumber ikut tersalin (dulu hilang saat duplikat).
        $akuntansi = $new->courseTests()->where('title', 'AKUNTANSI PERPAJAKAN')->firstOrFail();
        $this->assertSame(0, $akuntansi->max_attempts);
        $this->assertSame(8, $new->courseTests()->count());
    }

    public function test_duplicate_without_tests_option(): void
    {
        $source = $this->weekday40();
        $plan = $this->actingAs($this->teacher)
            ->postJson(route('teacher.duplicateCoursePreview', $source->id), ['start_date' => '2026-11-11', 'with_tests' => false])
            ->json('plan');

        $this->assertSame([], $plan['tests']);

        $this->actingAs($this->teacher)->post(route('teacher.duplicateCourse', $source->id), [
            'name' => 'WEEKDAY 41',
            'start_date' => $plan['start_date'],
            'end_date' => $plan['end_date'],
            'schedules' => $plan['schedules'],
            'course_tests' => [],
        ])->assertRedirect();

        $this->assertSame(0, Course::where('name', 'WEEKDAY 41')->firstOrFail()->courseTests()->count());
    }

    public function test_legacy_duplicate_still_copies_as_is_with_max_attempts(): void
    {
        $source = $this->weekday40();

        $this->actingAs($this->teacher)->post(route('teacher.duplicateCourse', $source->id))
            ->assertRedirect(route('teacher.courses'));

        $copy = Course::where('name', 'WEEKDAY 40 (Salinan)')->firstOrFail();
        $this->assertSame(13, $copy->courseSchedules()->count());
        $this->assertSame(5, $copy->courseTests()->where('title', 'PPH BADAN')->firstOrFail()->max_attempts);
    }

    public function test_other_teacher_cannot_preview(): void
    {
        $source = $this->weekday40();
        $other = User::create([
            'id' => (string) Str::uuid(),
            'event_id' => 1,
            'name' => 'Pengajar Lain',
            'email' => 'lain_' . Str::random(5) . '@test.com',
            'phone_number' => '081200000001',
            'role' => 'pengajar',
            'password' => bcrypt('secret'),
        ]);

        $this->actingAs($other)
            ->postJson(route('teacher.duplicateCoursePreview', $source->id), ['start_date' => '2026-11-11'])
            ->assertForbidden();
    }

    public function test_bulk_remedial_enables_and_disables_all_tests(): void
    {
        $course = $this->weekday40();

        $this->actingAs($this->teacher)
            ->post(route('teacher.courseTests.bulkRemedial', $course->id), [
                'enabled' => true,
                'remedial_end_date' => '2026-12-07 23:59:59',
            ])
            ->assertSessionHas('success');

        $this->assertSame(2, CourseTest::where('course_id', $course->id)->where('remedial_enabled', true)->count());
        $this->assertSame('2026-12-07 23:59:59', CourseTest::where('course_id', $course->id)->first()->getRawOriginal('remedial_end_date'));

        $this->actingAs($this->teacher)
            ->post(route('teacher.courseTests.bulkRemedial', $course->id), ['enabled' => false])
            ->assertSessionHas('success');

        $this->assertSame(0, CourseTest::where('course_id', $course->id)->where('remedial_enabled', true)->count());
    }

    public function test_bulk_remedial_rejects_end_before_remedial_start(): void
    {
        $course = $this->weekday40(); // akhir kelas 30 Nov → remedial mulai 1 Des

        $this->actingAs($this->teacher)
            ->post(route('teacher.courseTests.bulkRemedial', $course->id), [
                'enabled' => true,
                'remedial_end_date' => '2026-11-30 12:00:00',
            ])
            ->assertSessionHasErrors('remedial_end_date');

        $this->assertSame(0, CourseTest::where('course_id', $course->id)->where('remedial_enabled', true)->count());
    }

    public function test_user_import_reports_skipped_and_unknown_class(): void
    {
        $course = $this->weekday40();
        $smartcounting = Platform::create(['name' => 'smartcounting', 'code' => 'sc-' . Str::random(4), 'is_active' => true]);
        $biinspira = Platform::create(['name' => 'biinspira', 'code' => 'bi-' . Str::random(4), 'is_active' => true]);

        User::create([
            'id' => (string) Str::uuid(),
            'event_id' => 1,
            'platform_id' => $biinspira->id,
            'name' => 'Peserta Lain',
            'email' => 'lain@test.com',
            'phone_number' => '081299999999',
            'role' => 'pengguna',
            'password' => bcrypt('secret'),
        ]);

        $import = new UserImport($smartcounting->id);
        $import->model(['name' => 'Baru', 'email' => 'baru@test.com', 'phone_number' => '081211110000', 'course_code' => $course->code]);
        $import->model(['name' => 'Baru', 'email' => 'baru@test.com', 'phone_number' => '081211110000', 'course_code' => $course->code]);
        $import->model(['name' => 'Peserta Lain', 'email' => 'lain@test.com', 'phone_number' => '081299999999', 'course_code' => $course->code]);
        $import->model(['name' => 'Salah Kode', 'email' => 'salah@test.com', 'phone_number' => '081233330000', 'course_code' => 'TIDAKADA']);

        $report = $import->report();
        $this->assertSame(2, $report['created']);
        $this->assertSame(1, $report['enrolled']);
        $this->assertSame(1, $report['already_enrolled']);
        $this->assertSame(['lain@test.com'], $report['skipped_other_platform']);
        $this->assertSame(['TIDAKADA'], $report['course_not_found']);
        $this->assertSame(1, CourseUser::where('course_id', $course->id)->count());

        $summary = $import->summary();
        $this->assertStringContainsString('2 akun baru', $summary['summary']);
        $this->assertStringContainsString('lain@test.com', $summary['warning']);
        $this->assertStringContainsString('TIDAKADA', $summary['warning']);
    }
}
