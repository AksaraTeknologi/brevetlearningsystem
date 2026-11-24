<?php

namespace Tests\Unit;

use App\Services\Brevet\CourseRotationPlanner;
use PHPUnit\Framework\TestCase;

/**
 * Data uji = jadwal asli kelas di brevetlearning (screenshot 2026-11-17).
 */
class CourseRotationPlannerTest extends TestCase
{
    private CourseRotationPlanner $planner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->planner = new CourseRotationPlanner(require __DIR__ . '/../../config/brevet.php');
    }

    private function sessions(array $rows, ?string $course = null): array
    {
        return array_map(fn ($row) => [
            'title' => $row[0],
            'scheduled_at' => $row[1],
            'zoom_link' => null,
            'course_name' => $course,
        ], $rows);
    }

    private function weekend105(): array
    {
        return [
            ['PPN - SESI 01', '2026-10-24 15:00:00'],
            ['PPN - SESI 02', '2026-10-25 15:00:00'],
            ['PBB & BPHTB', '2026-10-31 15:00:00'],
            ['AKUNTANSI PERPAJAKAN', '2026-11-01 15:00:00'],
            ['PEMERIKSAAN, KEBERATAN, & BANDING SESI 1', '2026-11-07 15:00:00'],
            ['PEMERIKSAAN, KEBERATAN, & BANDING SESI 2', '2026-11-08 15:00:00'],
            ['KUP', '2026-11-14 15:00:00'],
            ['PPH OP - SESI 01', '2026-11-15 15:00:00'],
            ['PPH OP - SESI 02', '2026-11-21 15:00:00'],
            ['PPH POT PUT SESI 01', '2026-11-22 15:00:00'],
            ['PPH POT PUT SESI 02', '2026-11-28 15:00:00'],
            ['PPH BADAN SESI 01', '2026-11-29 15:00:00'],
            ['PPH BADAN SESI 02', '2026-12-05 15:00:00'],
        ];
    }

    private function weekend104(): array
    {
        return [
            ['PPH POT PUT SESI 01', '2026-10-10 15:00:00'],
            ['PPH POT PUT SESI 02', '2026-10-11 15:00:00'],
            ['PPH BADAN SESI 01', '2026-10-17 15:00:00'],
            ['PPH BADAN SESI 02', '2026-10-18 15:00:00'],
            ['PPN - SESI 01', '2026-10-24 15:00:00'],
            ['PPN - SESI 02', '2026-10-25 15:00:00'],
            ['PBB & BPHTB', '2026-10-31 15:00:00'],
            ['AKUNTANSI PERPAJAKAN', '2026-11-01 15:00:00'],
            ['PEMERIKSAAN, KEBERATAN, & BANDING SESI 1', '2026-11-07 15:00:00'],
            ['PEMERIKSAAN, KEBERATAN, & BANDING SESI 2', '2026-11-08 15:00:00'],
            ['KUP', '2026-11-14 15:00:00'],
            ['PPH OP - SESI 01', '2026-11-15 15:00:00'],
            ['PPH OP - SESI 02', '2026-11-21 15:00:00'],
        ];
    }

    private function weekday40(): array
    {
        return [
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
        ];
    }

    private function banks(): array
    {
        $names = ['PPN', 'PBB & BPHTB', 'AKUNTANSI PERPAJAKAN', 'PEMERIKSAAN', 'KUP', 'PPH OP', 'POTPUT', 'PPH BADAN'];

        return array_map(fn ($name, $i) => [
            'id' => "bank-{$i}",
            'name' => "BANK SOAL {$name}",
            'questions_count' => 100,
            'is_active' => true,
        ], $names, array_keys($names));
    }

    private function sourceTest(string $title, string $bankName, string $bankId, int $maxAttempts = 5, string $start = '2026-11-13 08:00:00'): array
    {
        return [
            'title' => $title,
            'question_bank_id' => $bankId,
            'bank_name' => $bankName,
            'description' => null,
            'duration' => 120,
            'passing_score' => 70,
            'questions_to_show' => 30,
            'max_attempts' => $maxAttempts,
            'show_score' => true,
            'show_correct_answers' => false,
            'reference_link' => null,
            'start_date' => $start,
        ];
    }

    public function test_materi_key_matches_schedule_test_and_bank_names(): void
    {
        $cases = [
            'PEMERIKSAAN, KEBERATAN, & BANDING SESI 1' => 'PEMERIKSAAN',
            'PEMERIKSAAN, KEBERATAN, DAN BANDING PAJAK' => 'PEMERIKSAAN',
            'PEMERIKSAAN PAJAK' => 'PEMERIKSAAN',
            'BANK SOAL PEMERIKSAAN' => 'PEMERIKSAAN',
            'PPH POT-PUT SESI 2' => 'PPH POT PUT',
            'PPH POTPUT' => 'PPH POT PUT',
            'BANK SOAL POTPUT' => 'PPH POT PUT',
            'PPH OP - SESI 01' => 'PPH OP',
            'BANK SOAL PPH OP' => 'PPH OP',
            'PPH BADAN SESI 02' => 'PPH BADAN',
            'BANK SOAL PBB & BPHTB' => 'PBB & BPHTB',
            'AKUNTANSI PERPAJAKAN' => 'AKUNTANSI PERPAJAKAN',
            'KUP' => 'KUP',
            'PPN SESI 1' => 'PPN',
        ];

        foreach ($cases as $title => $expected) {
            $this->assertSame($expected, $this->planner->materiKey($title), $title);
        }
    }

    public function test_weekend_new_class_follows_running_rotation_then_continues(): void
    {
        $stream = array_merge(
            $this->sessions($this->weekend105(), 'WEEKEND 105'),
            $this->sessions($this->weekend104(), 'WEEKEND 104'),
        );

        $plan = $this->planner->plan(
            $this->sessions($this->weekend105()),
            [],
            $stream,
            $this->banks(),
            '2026-11-14',
        );

        $this->assertSame('weekend', $plan['type']);
        $this->assertSame('15:00', $plan['session_time']);

        $expected = [
            ['KUP', '2026-11-14 15:00:00', 'rotasi'],
            ['PPH OP - SESI 01', '2026-11-15 15:00:00', 'rotasi'],
            ['PPH OP - SESI 02', '2026-11-21 15:00:00', 'rotasi'],
            ['PPH POT PUT SESI 01', '2026-11-22 15:00:00', 'rotasi'],
            ['PPH POT PUT SESI 02', '2026-11-28 15:00:00', 'rotasi'],
            ['PPH BADAN SESI 01', '2026-11-29 15:00:00', 'rotasi'],
            ['PPH BADAN SESI 02', '2026-12-05 15:00:00', 'rotasi'],
            ['PPN - SESI 01', '2026-12-06 15:00:00', 'lanjutan'],
            ['PPN - SESI 02', '2026-12-12 15:00:00', 'lanjutan'],
            ['PBB & BPHTB', '2026-12-13 15:00:00', 'lanjutan'],
            ['AKUNTANSI PERPAJAKAN', '2026-12-19 15:00:00', 'lanjutan'],
            ['PEMERIKSAAN, KEBERATAN, & BANDING SESI 1', '2026-12-20 15:00:00', 'lanjutan'],
            ['PEMERIKSAAN, KEBERATAN, & BANDING SESI 2', '2026-12-26 15:00:00', 'lanjutan'],
        ];

        $this->assertCount(13, $plan['schedules']);
        foreach ($expected as $i => [$title, $at, $origin]) {
            $this->assertSame($title, $plan['schedules'][$i]['title']);
            $this->assertSame($at, $plan['schedules'][$i]['scheduled_at']);
            $this->assertSame($origin, $plan['schedules'][$i]['origin']);
        }
        $this->assertStringContainsString('WEEKEND 105', $plan['schedules'][0]['origin_label']);
        $this->assertStringContainsString('WEEKEND 104', $plan['schedules'][0]['origin_label']);

        // Ujian weekend: Senin 06.00 setelah sesi terakhir materi, 7 hari.
        $tests = array_column($plan['tests'], null, 'materi');
        $this->assertCount(8, $tests);
        $this->assertSame(['2026-11-16 06:00:00', '2026-11-22 23:59:59'], [$tests['KUP']['start_date'], $tests['KUP']['end_date']]);
        $this->assertSame('2026-11-23 06:00:00', $tests['PPH OP']['start_date']);
        $this->assertSame('2026-12-14 06:00:00', $tests['PPN']['start_date']);
        $this->assertSame('2026-12-14 06:00:00', $tests['PBB & BPHTB']['start_date']);
        $this->assertSame(['2026-12-28 06:00:00', '2027-01-03 23:59:59'], [$tests['PEMERIKSAAN']['start_date'], $tests['PEMERIKSAAN']['end_date']]);
        $this->assertSame('bank-6', $tests['PPH POT PUT']['question_bank_id']);
        $this->assertSame(70, $tests['KUP']['passing_score']);
        $this->assertSame(5, $tests['KUP']['max_attempts']);
        $this->assertSame(30, $tests['KUP']['questions_to_show']);

        $this->assertSame('2026-11-14 00:00:00', $plan['start_date']);
        $this->assertSame('2027-01-03 23:59:59', $plan['end_date']);
    }

    public function test_weekday_duplicate_matches_weekday_41(): void
    {
        $sourceTests = [
            $this->sourceTest('AKUNTANSI PERPAJAKAN', 'BANK SOAL AKUNTANSI PERPAJAKAN', 'bank-2', 0, '2026-10-28 08:00:00'),
            $this->sourceTest('KUP', 'BANK SOAL KUP', 'bank-4', 0, '2026-10-29 08:00:00'),
            $this->sourceTest('PPH BADAN', 'BANK SOAL PPH BADAN', 'bank-7'),
        ];

        $plan = $this->planner->plan(
            $this->sessions($this->weekday40()),
            $sourceTests,
            $this->sessions($this->weekday40(), 'WEEKDAY 40'),
            $this->banks(),
            '2026-11-11',
        );

        $this->assertSame('weekday', $plan['type']);
        $titles = array_column($plan['schedules'], 'scheduled_at', 'title');
        $this->assertSame('2026-11-11 18:30:00', $plan['schedules'][0]['scheduled_at']);
        $this->assertSame('PPH BADAN SESI 1', $plan['schedules'][0]['title']);
        $this->assertSame('2026-11-24 18:30:00', $titles['PEMERIKSAAN, KEBERATAN, & BANDING SESI 2']);
        $this->assertSame('2026-11-25 18:30:00', $titles['AKUNTANSI PERPAJAKAN']);
        $this->assertSame('2026-11-26 18:30:00', $titles['KUP']);
        $this->assertSame('2026-12-01 18:30:00', $titles['PPH OP SESI 1']);
        $this->assertSame('2026-12-09 18:30:00', $titles['PPH POT-PUT SESI 2']);
        $this->assertCount(13, $plan['schedules']);

        // Ujian weekday: H+1 08.00 sampai H+7 23.59 (PPh Badan WEEKDAY 41 asli: 13–19 Nov).
        $tests = array_column($plan['tests'], null, 'materi');
        $this->assertSame(['2026-11-13 08:00:00', '2026-11-19 23:59:59'], [$tests['PPH BADAN']['start_date'], $tests['PPH BADAN']['end_date']]);
        $this->assertSame(['2026-12-10 08:00:00', '2026-12-16 23:59:59'], [$tests['PPH POT PUT']['start_date'], $tests['PPH POT PUT']['end_date']]);
        // Akhir kelas WEEKDAY 41 asli = 16 Des.
        $this->assertSame('2026-12-16 23:59:59', $plan['end_date']);

        // Pengaturan ujian sumber ikut, termasuk "tidak terbatas" yang diberi peringatan.
        $this->assertSame(0, $tests['KUP']['max_attempts']);
        $this->assertTrue(collect($plan['warnings'])->contains(fn ($w) => str_contains($w, 'KUP') && str_contains($w, 'tidak terbatas')));
        // Materi tanpa ujian di sumber memakai bank soal yang cocok + nilai bawaan.
        $this->assertSame('bank-0', $tests['PPN']['question_bank_id']);
        $this->assertSame(5, $tests['PPN']['max_attempts']);
    }

    public function test_without_running_class_uses_source_order_from_start_date(): void
    {
        $plan = $this->planner->plan(
            $this->sessions($this->weekday40()),
            [],
            [],
            $this->banks(),
            '2026-12-01',
            false,
        );

        $this->assertSame('AKUNTANSI PERPAJAKAN', $plan['schedules'][0]['title']);
        $this->assertSame('2026-12-01 18:30:00', $plan['schedules'][0]['scheduled_at']);
        $this->assertSame('2026-12-02 18:30:00', $plan['schedules'][1]['scheduled_at']);
        $this->assertSame('2026-12-03 18:30:00', $plan['schedules'][2]['scheduled_at']);
        $this->assertSame('2026-12-08 18:30:00', $plan['schedules'][3]['scheduled_at']);
        $this->assertSame([], $plan['tests']);
        $this->assertNotEmpty($plan['warnings']);
    }

    public function test_conflicting_rotation_uses_newest_class_and_warns(): void
    {
        $newer = $this->sessions([['PEMERIKSAAN, KEBERATAN, & BANDING SESI 2', '2026-10-22 18:30:00']], 'WEEKDAY 39');
        $older = $this->sessions([['AKUNTANSI PERPAJAKAN', '2026-10-22 18:30:00']], 'WEEKDAY 38');

        $plan = $this->planner->plan(
            $this->sessions($this->weekday40()),
            [],
            array_merge($newer, $older),
            $this->banks(),
            '2026-10-22',
            false,
        );

        $this->assertSame('PEMERIKSAAN, KEBERATAN, & BANDING SESI 2', $plan['schedules'][0]['title']);
        $this->assertTrue(collect($plan['warnings'])->contains(fn ($w) => str_contains($w, 'berbeda antar kelas')));
        $this->assertTrue(collect($plan['warnings'])->contains(fn ($w) => str_contains($w, 'tengah materi')));
    }

    public function test_missing_later_sessions_of_last_materi_are_appended(): void
    {
        // Rotasi baru terjadwal sampai PPh OP sesi 1; sesi 2 harus ditambahkan.
        $stream = $this->sessions([
            ['KUP', '2026-11-14 15:00:00'],
            ['PPH OP - SESI 01', '2026-11-15 15:00:00'],
        ], 'WEEKEND 104');

        $plan = $this->planner->plan($this->sessions($this->weekend105()), [], $stream, $this->banks(), '2026-11-14', false);

        $this->assertSame('PPH OP - SESI 02', $plan['schedules'][2]['title']);
        $this->assertSame('2026-11-21 15:00:00', $plan['schedules'][2]['scheduled_at']);
        $this->assertSame('PPH POT PUT SESI 01', $plan['schedules'][3]['title']);
        $this->assertCount(13, $plan['schedules']);
    }
}
