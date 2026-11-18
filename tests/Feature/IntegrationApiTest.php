<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseUser;
use App\Models\Event;
use App\Models\IntegrationAuditLog;
use App\Models\IntegrationClient;
use App\Models\Platform;
use App\Models\QuestionBank;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class IntegrationApiTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;
    private User $otherTeacher;
    private Course $course;
    private Course $foreignCourse;
    private Platform $smartcounting;
    private QuestionBank $bankPpn;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-11-17 09:00:00');
        Event::firstOrCreate(['id' => 1], ['code' => 'PUB001', 'name' => 'Public']);

        $this->teacher = $this->makeUser('pengajar', 'biinspira@test.com');
        $this->otherTeacher = $this->makeUser('pengajar', 'lain@test.com');
        $this->smartcounting = Platform::create(['name' => 'smartcounting', 'code' => 'smartcounting-x', 'is_active' => true]);
        $this->bankPpn = QuestionBank::create(['teacher_id' => $this->teacher->id, 'name' => 'BANK SOAL PPN', 'is_active' => true]);

        $this->course = Course::create([
            'teacher_id' => $this->teacher->id, 'name' => 'WEEKDAY 41', 'code' => 'XHQwcrf4',
            'start_date' => '2026-11-11 00:00:00', 'end_date' => '2026-12-16 23:59:59',
        ]);
        $this->course->courseSchedules()->create(['title' => 'PPN SESI 1', 'scheduled_at' => '2026-11-17 18:30:00']);
        $this->course->courseSchedules()->create(['title' => 'PPN SESI 2', 'scheduled_at' => '2026-11-18 18:30:00']);

        $this->foreignCourse = Course::create([
            'teacher_id' => $this->otherTeacher->id, 'name' => 'KELAS KAMPUS', 'code' => 'KAMPUS01',
            'start_date' => '2026-11-01 00:00:00', 'end_date' => '2026-12-31 23:59:59',
        ]);
    }

    private function makeUser(string $role, string $email, ?string $platformId = null, string $phone = '081200000000'): User
    {
        return User::create([
            'id' => (string) Str::uuid(), 'event_id' => 1, 'platform_id' => $platformId,
            'name' => ucfirst(strtok($email, '@')), 'email' => $email, 'phone_number' => $phone,
            'role' => $role, 'password' => bcrypt('secret'),
        ]);
    }

    private function token(string $kind, array $abilities, bool $scoped = true): string
    {
        $client = IntegrationClient::create([
            'name' => $kind, 'code' => $kind . '-' . Str::random(4), 'kind' => $kind,
            'teacher_id' => $scoped ? $this->teacher->id : null, 'is_active' => true,
        ]);

        return $client->createToken('t', $abilities)->plainTextToken;
    }

    private function api(string $token)
    {
        // Di server tiap request = aplikasi baru; di tes guard menyimpan user antar-request.
        $this->app['auth']->forgetGuards();

        return $this->withHeader('Authorization', "Bearer {$token}");
    }

    public function test_lookup_and_platforms_for_platform_client(): void
    {
        $student = $this->makeUser('pengguna', 'ada@test.com', $this->smartcounting->id, '081211112222');
        CourseUser::create(['course_id' => $this->course->id, 'user_id' => $student->id]);
        $token = $this->token('platform', ['enroll']);

        $this->api($token)->getJson('/api/v1/integration/platforms')
            ->assertOk()->assertJsonPath('data.0.code', 'smartcounting-x');

        $this->api($token)->getJson('/api/v1/integration/courses/lookup?code=xhqwcrf4')
            ->assertOk()
            ->assertJsonPath('data.name', 'WEEKDAY 41')
            ->assertJsonPath('data.participants_count', 1)
            ->assertJsonPath('data.participants.0.email', 'ada@test.com')
            ->assertJsonPath('data.participants.0.platform_code', 'smartcounting-x');

        // Kelas pengajar lain tidak terlihat.
        $this->api($token)->getJson('/api/v1/integration/courses/lookup?code=KAMPUS01')->assertNotFound();
    }

    public function test_enroll_reports_status_per_participant_and_audits(): void
    {
        $biinspira = Platform::create(['name' => 'biinspira', 'code' => 'biinspira-x', 'is_active' => true]);
        $this->makeUser('pengguna', 'lain.platform@test.com', $biinspira->id);
        $existing = $this->makeUser('pengguna', 'sudah@test.com', null, '081255556666');
        CourseUser::create(['course_id' => $this->course->id, 'user_id' => $existing->id]);
        $token = $this->token('platform', ['enroll']);

        $response = $this->api($token)->postJson('/api/v1/integration/enroll', [
            'course_code' => 'XHQwcrf4',
            'platform_code' => 'smartcounting-x',
            'participants' => [
                ['name' => 'Baru', 'email' => 'baru@test.com', 'phone_number' => '+62 812-3333-4444'],
                ['name' => 'Sudah', 'email' => 'sudah@test.com', 'phone_number' => '081255556666'],
                ['name' => 'Lain', 'email' => 'lain.platform@test.com', 'phone_number' => '081200000000'],
                ['name' => 'Rusak', 'email' => 'bukan-email', 'phone_number' => '0812'],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('summary.created', 1)
            ->assertJsonPath('summary.already', 1)
            ->assertJsonPath('summary.skipped_other_platform', 1)
            ->assertJsonPath('summary.invalid', 1)
            ->assertJsonPath('results.0.status', 'created')
            ->assertJsonPath('results.2.status', 'skipped_other_platform');

        $baru = User::where('email', 'baru@test.com')->firstOrFail();
        $this->assertSame('081233334444', $baru->phone_number);
        $this->assertTrue(Hash::check('081233334444', $baru->password));
        $this->assertSame($this->smartcounting->id, $baru->platform_id);
        $this->assertSame($this->smartcounting->id, $existing->fresh()->platform_id); // diklaim induk
        $this->assertSame(2, CourseUser::where('course_id', $this->course->id)->count());
        $this->assertSame(1, IntegrationAuditLog::where('action', 'enroll')->count());
    }

    public function test_enroll_rejects_unknown_platform_and_foreign_course(): void
    {
        $token = $this->token('platform', ['enroll']);
        $row = [['name' => 'X', 'email' => 'x@test.com', 'phone_number' => '081211110000']];

        $this->api($token)->postJson('/api/v1/integration/enroll', ['course_code' => 'XHQwcrf4', 'platform_code' => 'tidak-ada', 'participants' => $row])
            ->assertStatus(422);
        $this->api($token)->postJson('/api/v1/integration/enroll', ['course_code' => 'KAMPUS01', 'participants' => $row])
            ->assertNotFound();
    }

    public function test_abilities_are_enforced(): void
    {
        $platform = $this->token('platform', ['enroll']);
        $reader = $this->token('agent', ['agent:read']);
        $platformApiToken = $this->smartcounting->createToken('p', ['platform:read'])->plainTextToken;

        $this->api($platform)->getJson('/api/v1/integration/agent/courses')->assertForbidden();
        $this->api($reader)->getJson('/api/v1/integration/platforms')->assertForbidden();
        $this->api($reader)->postJson("/api/v1/integration/agent/courses/{$this->course->id}/remedial", ['enabled' => false])->assertForbidden();
        $this->api($platformApiToken)->getJson('/api/v1/integration/platforms')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withHeaders(['Authorization' => ''])->getJson('/api/v1/integration/platforms')->assertUnauthorized();

        IntegrationClient::query()->update(['is_active' => false]);
        $this->api($reader)->getJson('/api/v1/integration/agent/courses')->assertForbidden();
    }

    public function test_agent_reads_courses_banks_and_participants_in_scope(): void
    {
        $student = $this->makeUser('pengguna', 'rosita@test.com', $this->smartcounting->id, '087876420707');
        CourseUser::create(['course_id' => $this->course->id, 'user_id' => $student->id]);
        $outsider = $this->makeUser('pengguna', 'rosita.kampus@test.com');
        CourseUser::create(['course_id' => $this->foreignCourse->id, 'user_id' => $outsider->id]);
        $token = $this->token('agent', ['agent:read']);

        $this->api($token)->getJson('/api/v1/integration/agent/courses')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'WEEKDAY 41')
            ->assertJsonPath('data.0.schedules.0.scheduled_at', '2026-11-17 18:30:00')
            ->assertJsonPath('data.0.participants_count', 1);

        $this->api($token)->getJson('/api/v1/integration/agent/question-banks')
            ->assertOk()->assertJsonPath('data.0.name', 'BANK SOAL PPN');

        $this->api($token)->getJson('/api/v1/integration/agent/participants?q=rosita')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'rosita@test.com')
            ->assertJsonPath('data.0.platform', 'smartcounting')
            ->assertJsonPath('data.0.courses.0.code', 'XHQwcrf4');

        $this->api($token)->getJson('/api/v1/integration/agent/participants?q=0878 7642')
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_agent_creates_and_updates_test_with_audit(): void
    {
        $token = $this->token('agent', ['agent:read', 'agent:write']);

        $created = $this->api($token)->postJson("/api/v1/integration/agent/courses/{$this->course->id}/tests", [
            'title' => 'PPN',
            'question_bank_id' => $this->bankPpn->id,
            'start_date' => '2026-11-19 08:00:00',
            'end_date' => '2026-11-25 23:59:59',
        ])->assertCreated()
            ->assertJsonPath('data.passing_score', 70)
            ->assertJsonPath('data.max_attempts', 5)
            ->assertJsonPath('data.start_date', '2026-11-19 08:00:00');

        $testId = $created->json('data.id');
        $this->api($token)->patchJson("/api/v1/integration/agent/tests/{$testId}", ['end_date' => '2026-11-29 23:59:59'])
            ->assertOk()->assertJsonPath('data.end_date', '2026-11-29 23:59:59');

        // Melewati akhir kelas ditolak.
        $this->api($token)->patchJson("/api/v1/integration/agent/tests/{$testId}", ['end_date' => '2026-12-31 23:59:59'])
            ->assertStatus(422);

        // Bank soal pengajar lain ditolak.
        $foreignBank = QuestionBank::create(['teacher_id' => $this->otherTeacher->id, 'name' => 'BANK SOAL PPN', 'is_active' => true]);
        $this->api($token)->postJson("/api/v1/integration/agent/courses/{$this->course->id}/tests", [
            'title' => 'PPN', 'question_bank_id' => $foreignBank->id,
            'start_date' => '2026-11-19 08:00:00', 'end_date' => '2026-11-25 23:59:59',
        ])->assertStatus(422);

        $this->assertSame(['test.create', 'test.update'], IntegrationAuditLog::orderBy('id')->pluck('action')->all());
        $this->assertSame('2026-11-29 23:59:59', IntegrationAuditLog::where('action', 'test.update')->first()->payload['after']['end_date']);
    }

    public function test_agent_remedial_reset_password_and_zoom_link(): void
    {
        $token = $this->token('agent', ['agent:read', 'agent:write']);
        $this->course->courseTests()->create([
            'title' => 'PPN', 'question_bank_id' => $this->bankPpn->id,
            'start_date' => '2026-11-19 08:00:00', 'end_date' => '2026-11-25 23:59:59',
        ]);

        $this->api($token)->postJson("/api/v1/integration/agent/courses/{$this->course->id}/remedial", [
            'enabled' => true, 'remedial_end_date' => '2026-12-23 23:59:59',
        ])->assertOk()->assertJsonPath('data.count', 1)->assertJsonPath('data.remedial_start', '2026-12-17 00:00:00');

        $student = $this->makeUser('pengguna', 'lupa@test.com', null, '0812-7777-8888');
        CourseUser::create(['course_id' => $this->course->id, 'user_id' => $student->id]);
        $this->api($token)->postJson("/api/v1/integration/agent/participants/{$student->id}/reset-password")->assertOk();
        $this->assertTrue(Hash::check('081277778888', $student->fresh()->password));

        $outsider = $this->makeUser('pengguna', 'kampus@test.com');
        CourseUser::create(['course_id' => $this->foreignCourse->id, 'user_id' => $outsider->id]);
        $this->api($token)->postJson("/api/v1/integration/agent/participants/{$outsider->id}/reset-password")->assertNotFound();

        // Sesi bersama: link Zoom diisi di semua kelas pada waktu yang sama.
        $twin = Course::create(['teacher_id' => $this->teacher->id, 'name' => 'WEEKDAY 40', 'code' => 'vvFbXXk1',
            'start_date' => '2026-10-27 00:00:00', 'end_date' => '2026-11-30 23:59:59']);
        $twin->courseSchedules()->create(['title' => 'PPN SESI 1', 'scheduled_at' => '2026-11-17 18:30:00']);

        $this->api($token)->postJson('/api/v1/integration/agent/schedules/zoom-link', [
            'scheduled_at' => '2026-11-17 18:30:00', 'zoom_link' => 'https://us06web.zoom.us/j/123',
        ])->assertOk()->assertJsonPath('data.count', 2);

        $this->assertSame(2, \App\Models\CourseSchedule::where('zoom_link', 'https://us06web.zoom.us/j/123')->count());
        $this->assertSame(3, IntegrationAuditLog::count());
    }

    public function test_token_command_creates_scoped_client(): void
    {
        $exit = Artisan::call('integration:token', [
            'code' => 'cava', '--kind' => 'agent', '--write' => true, '--teacher' => 'biinspira@test.com',
        ]);

        $this->assertSame(0, $exit);
        $client = IntegrationClient::where('code', 'cava')->firstOrFail();
        $this->assertSame($this->teacher->id, $client->teacher_id);
        $this->assertSame(['agent:read', 'agent:write'], $client->tokens()->first()->abilities);
        $this->assertStringContainsString('|', Artisan::output());
    }

    public function test_grades_only_for_requested_participants(): void
    {
        $token = $this->token('agent', ['agent:read']);
        $test = $this->course->courseTests()->create([
            'title' => 'PPN', 'question_bank_id' => $this->bankPpn->id, 'passing_score' => 70,
            'start_date' => '2026-11-19 08:00:00', 'end_date' => '2026-11-25 23:59:59',
        ]);
        $lulus = $this->makeUser('pengguna', 'lulus@test.com', null, '081200000011');
        $gagal = $this->makeUser('pengguna', 'gagal@test.com', null, '081200000012');
        $lain = $this->makeUser('pengguna', 'platformlain@test.com', null, '081200000013');
        foreach ([$lulus, $gagal, $lain] as $u) {
            CourseUser::create(['course_id' => $this->course->id, 'user_id' => $u->id]);
        }
        $attempt = fn ($u, $score, $passed, $type = 'exam') => \App\Models\CourseTestAttempt::create([
            'user_id' => $u->id, 'course_test_id' => $test->id, 'test_type' => $type, 'score' => $score,
            'passed' => $passed, 'submitted_at' => now(),
        ]);
        $attempt($lulus, 50, false);
        $attempt($lulus, 80, true, 'remedial');
        $attempt($gagal, 60, false);
        $attempt($lain, 40, false);

        $res = $this->api($token)->postJson("/api/v1/integration/agent/courses/{$this->course->id}/grades", [
            'emails' => ['LULUS@test.com'],
            'phones' => ['+62 812-0000-0012'],
        ])->assertOk();

        $students = collect($res->json('data.students'))->keyBy('email');
        $this->assertSame(['lulus@test.com', 'gagal@test.com'], $students->keys()->sort()->values()->reverse()->values()->all());
        $this->assertSame('passed', $students['lulus@test.com']['scores'][0]['status']);
        $this->assertSame(80, $students['lulus@test.com']['scores'][0]['best_score']);
        $this->assertSame('failed', $students['gagal@test.com']['scores'][0]['status']);
        $this->assertArrayNotHasKey('platformlain@test.com', $students->all());
    }

    public function test_courses_filter_by_codes_and_remedial_for_selected_tests(): void
    {
        $token = $this->token('agent', ['agent:read', 'agent:write']);
        $this->api($token)->getJson('/api/v1/integration/agent/courses?scope=all&codes=xhqwcrf4,TIDAKADA')
            ->assertOk()->assertJsonCount(1, 'data');

        $a = $this->course->courseTests()->create(['title' => 'PPN', 'question_bank_id' => $this->bankPpn->id,
            'start_date' => '2026-11-19 08:00:00', 'end_date' => '2026-11-25 23:59:59']);
        $this->course->courseTests()->create(['title' => 'KUP', 'question_bank_id' => $this->bankPpn->id,
            'start_date' => '2026-11-19 08:00:00', 'end_date' => '2026-11-25 23:59:59']);

        $this->api($token)->postJson("/api/v1/integration/agent/courses/{$this->course->id}/remedial", [
            'enabled' => true, 'remedial_end_date' => '2026-12-23 23:59:59', 'test_ids' => [$a->id],
        ])->assertOk()->assertJsonPath('data.count', 1);

        $this->assertSame(['PPN'], $this->course->courseTests()->where('remedial_enabled', true)->pluck('title')->all());
    }
}
