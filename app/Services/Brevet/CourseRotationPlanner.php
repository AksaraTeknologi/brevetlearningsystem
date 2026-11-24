<?php

namespace App\Services\Brevet;

use Carbon\CarbonImmutable;

/**
 * Menyusun usulan jadwal & ujian untuk kelas Brevet baru dari rotasi yang
 * sedang berjalan. Murni (tanpa database) supaya mudah diuji.
 *
 * Semua tanggal diperlakukan sebagai jam dinding WIB apa adanya
 * (format "Y-m-d H:i:s"), sama seperti yang tersimpan di database.
 * Hasilnya hanya usulan: admin bisa mengubah apa pun di pratinjau.
 */
class CourseRotationPlanner
{
    public const FORMAT = 'Y-m-d H:i:s';

    public function __construct(private array $config)
    {
    }

    public static function fromConfig(): self
    {
        return new self(config('brevet', []));
    }

    public function normalize(string $text): string
    {
        $value = mb_strtoupper($text);
        $value = preg_replace('/BANK\s+SOAL/u', ' ', $value);
        $value = preg_replace('/SESI\s*-?\s*\d+/u', ' ', $value);
        $value = preg_replace('/[^A-Z0-9&]+/u', ' ', $value);

        return trim(preg_replace('/\s+/', ' ', $value));
    }

    public function materiKey(?string $text): string
    {
        $normalized = $this->normalize((string) $text);

        foreach ($this->config['materi'] ?? [] as $key => $keywords) {
            $matches = true;
            foreach ((array) $keywords as $keyword) {
                if (!str_contains($normalized, mb_strtoupper($keyword))) {
                    $matches = false;
                    break;
                }
            }

            if ($matches) {
                return $key;
            }
        }

        return $normalized;
    }

    public function isKnownMateri(string $key): bool
    {
        return array_key_exists($key, $this->config['materi'] ?? []);
    }

    public function sessionNumber(string $title): ?int
    {
        if (preg_match('/SESI\s*-?\s*0*(\d+)/iu', $title, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    public function dayType(CarbonImmutable $date): string
    {
        return in_array($date->dayOfWeek, $this->sessionDays('weekend'), true) ? 'weekend' : 'weekday';
    }

    /**
     * @param  string[]  $datetimes
     */
    public function detectType(array $datetimes): string
    {
        $weekend = 0;
        $weekday = 0;
        foreach ($datetimes as $datetime) {
            $this->dayType($this->parse($datetime)) === 'weekend' ? $weekend++ : $weekday++;
        }

        return $weekend >= $weekday ? 'weekend' : 'weekday';
    }

    /**
     * @param  array  $sourceSessions  [['title', 'scheduled_at', 'zoom_link'?]]
     * @param  array  $sourceTests  [['title', 'question_bank_id', 'bank_name', 'description', 'duration', 'passing_score',
     *                              'questions_to_show', 'max_attempts', 'show_score', 'show_correct_answers', 'reference_link', 'start_date']]
     * @param  array  $stream  sesi kelas sejenis yang sedang berjalan [['title', 'scheduled_at', 'zoom_link', 'course_name']];
     *                         untuk tanggal yang sama, sesi dari kelas terbaru diletakkan lebih dulu.
     * @param  array  $banks  [['id', 'name', 'questions_count', 'is_active']]
     */
    public function plan(
        array $sourceSessions,
        array $sourceTests,
        array $stream,
        array $banks,
        string $startDate,
        bool $withTests = true,
    ): array {
        $warnings = [];
        $source = $this->sortSessions($sourceSessions);
        $start = $this->parse($startDate)->startOfDay();

        if ($source === []) {
            return [
                'type' => null,
                'session_time' => null,
                'start_date' => $start->format(self::FORMAT),
                'end_date' => $start->addDays(7)->setTime(23, 59, 59)->format(self::FORMAT),
                'schedules' => [],
                'tests' => [],
                'warnings' => ['Kelas sumber belum punya jadwal, jadi tidak ada rotasi yang bisa disalin. Tambahkan jadwal secara manual.'],
            ];
        }

        $type = $this->detectType(array_column($source, 'scheduled_at'));
        $time = $this->dominantTime(array_column($source, 'scheduled_at'))
            ?? ($this->config['session_time'][$type] ?? '15:00');

        // Urutan materi & judul sesi per materi dari kelas sumber.
        $order = [];
        $templates = [];
        foreach ($source as $session) {
            $materi = $this->materiKey($session['title']);
            if (!isset($templates[$materi])) {
                $order[] = $materi;
                $templates[$materi] = [];
            }
            $templates[$materi][] = $session['title'];
        }

        // 1. Sesi rotasi yang sudah terjadwal di kelas sejenis mulai tanggal mulai.
        $streamSessions = $this->collectStream($stream, $start, $type, $time, $templates, $warnings);

        $schedules = [];
        $taken = [];
        $currentMateri = null;
        foreach ($streamSessions as $session) {
            if ($session['materi'] !== $currentMateri) {
                if (isset($taken[$session['materi']])) {
                    break; // rotasi sudah memutar ke siklus berikutnya
                }
                $taken[$session['materi']] = 0;
                $currentMateri = $session['materi'];
            }
            $taken[$session['materi']]++;
            $schedules[] = [
                'title' => $session['title'],
                'scheduled_at' => $session['scheduled_at'],
                'zoom_link' => $session['zoom_link'],
                'materi' => $session['materi'],
                'origin' => 'rotasi',
                'origin_label' => 'Rotasi berjalan (' . implode(', ', $session['courses']) . ')',
            ];
        }

        // Materi pertama dimulai di tengah (mis. sesi 2): beri peringatan.
        if ($schedules !== []) {
            $first = $schedules[0];
            $number = $this->sessionNumber($first['title']);
            if ($number !== null && $number > 1) {
                $warnings[] = "Kelas dimulai di tengah materi {$first['materi']} (sesi {$number}). Sesi sebelumnya tidak ikut — periksa tanggal mulai.";
            }
        }

        $cursor = $schedules !== []
            ? $this->parse(end($schedules)['scheduled_at'])
            : $start->subDay();

        // 2. Sisa sesi materi terakhir yang belum terjadwal di rotasi.
        if ($currentMateri !== null) {
            $lastNumber = $this->sessionNumber(end($schedules)['title']);
            if ($lastNumber !== null) {
                foreach ($templates[$currentMateri] as $title) {
                    $number = $this->sessionNumber($title);
                    if ($number !== null && $number > $lastNumber) {
                        $cursor = $this->appendSession($schedules, $title, $currentMateri, $cursor, $type, $time);
                    }
                }
            }
        }

        // 3. Materi yang belum tercakup, lanjut mengikuti urutan rotasi kelas sumber.
        if ($taken === []) {
            $remaining = $order;
            $warnings[] = 'Belum ada kelas sejenis yang terjadwal mulai tanggal ini, jadi jadwal disusun dari urutan kelas sumber. Periksa materi pertamanya.';
        } else {
            $index = array_search($currentMateri, $order, true);
            $rotated = $index === false
                ? $order
                : array_merge(array_slice($order, $index + 1), array_slice($order, 0, $index + 1));
            $remaining = array_values(array_filter($rotated, fn ($materi) => !isset($taken[$materi])));
        }

        foreach ($remaining as $materi) {
            foreach ($templates[$materi] as $title) {
                $cursor = $this->appendSession($schedules, $title, $materi, $cursor, $type, $time);
            }
        }

        $tests = [];
        if ($withTests) {
            [$tests, $testWarnings] = $this->computeTests($schedules, $type, $sourceTests, $banks);
            $warnings = array_merge($warnings, $testWarnings);
        }

        return [
            'type' => $type,
            'session_time' => $time,
            'start_date' => $start->format(self::FORMAT),
            'end_date' => $this->endDate($schedules, $tests)->format(self::FORMAT),
            'schedules' => $schedules,
            'tests' => $tests,
            'warnings' => array_values(array_unique($warnings)),
        ];
    }

    /**
     * Usulan ujian per materi dari jadwal (dipakai juga saat admin menekan
     * "Hitung ulang" setelah mengubah jadwal di pratinjau).
     *
     * @return array{0: array, 1: string[]}
     */
    public function computeTests(array $schedules, string $type, array $sourceTests, array $banks): array
    {
        $warnings = [];
        $defaults = $this->config['test_defaults'] ?? [];
        $window = max(1, (int) ($this->config['exam_window_days'] ?? 7));
        $openTime = $this->dominantTime(array_filter(array_column($sourceTests, 'start_date')))
            ?? ($this->config['exam_open_time'][$type] ?? '08:00');

        $lastSession = [];
        foreach ($schedules as $schedule) {
            if (empty($schedule['scheduled_at'])) {
                continue;
            }
            $materi = $this->materiKey($schedule['title'] ?? '');
            $at = $this->parse($schedule['scheduled_at']);
            if (!isset($lastSession[$materi]) || $at->gt($lastSession[$materi])) {
                $lastSession[$materi] = $at;
            }
        }
        uasort($lastSession, fn (CarbonImmutable $a, CarbonImmutable $b) => $a <=> $b);

        $sourceByMateri = [];
        foreach ($sourceTests as $test) {
            $key = $this->testMateri($test['bank_name'] ?? null, $test['title'] ?? null);
            $sourceByMateri[$key] ??= $test;
        }

        $banksByMateri = [];
        $sortedBanks = $banks;
        usort($sortedBanks, fn ($a, $b) => (int) !empty($b['is_active']) <=> (int) !empty($a['is_active']));
        $bankById = [];
        foreach ($sortedBanks as $bank) {
            $bankById[$bank['id']] = $bank;
            $banksByMateri[$this->materiKey($bank['name'] ?? '')] ??= $bank;
        }

        $tests = [];
        foreach ($lastSession as $materi => $lastAt) {
            $source = $sourceByMateri[$materi] ?? null;
            $bank = $source && isset($source['question_bank_id'])
                ? ($bankById[$source['question_bank_id']] ?? ['id' => $source['question_bank_id'], 'name' => $source['bank_name'] ?? null])
                : ($banksByMateri[$materi] ?? null);

            if (!$bank) {
                $warnings[] = "Bank soal untuk materi {$materi} tidak ditemukan, jadi ujiannya tidak dibuat. Tambahkan manual bila perlu.";
                continue;
            }

            $open = $type === 'weekend'
                ? $lastAt->startOfDay()->next(CarbonImmutable::MONDAY)
                : $lastAt->startOfDay()->addDay();
            [$hour, $minute] = array_map('intval', explode(':', $openTime) + [0, 0]);
            $open = $open->setTime($hour, $minute);
            $close = $open->startOfDay()->addDays($window - 1)->setTime(23, 59, 59);

            $questions = $source['questions_to_show'] ?? ($defaults['questions_to_show'] ?? null);
            if ($questions !== null && isset($bank['questions_count']) && (int) $bank['questions_count'] > 0) {
                $questions = min((int) $questions, (int) $bank['questions_count']);
            }

            $test = [
                'materi' => $materi,
                'title' => $source['title'] ?? $materi,
                'question_bank_id' => $bank['id'],
                'question_bank_name' => $bank['name'] ?? null,
                'description' => $source['description'] ?? null,
                'duration' => (int) ($source['duration'] ?? ($defaults['duration'] ?? 0)),
                'passing_score' => (int) ($source['passing_score'] ?? ($defaults['passing_score'] ?? 0)),
                'questions_to_show' => $questions !== null ? (int) $questions : null,
                'max_attempts' => (int) ($source['max_attempts'] ?? ($defaults['max_attempts'] ?? 0)),
                'show_score' => (bool) ($source['show_score'] ?? ($defaults['show_score'] ?? true)),
                'show_correct_answers' => (bool) ($source['show_correct_answers'] ?? ($defaults['show_correct_answers'] ?? false)),
                'reference_link' => $source['reference_link'] ?? null,
                'start_date' => $open->format(self::FORMAT),
                'end_date' => $close->format(self::FORMAT),
            ];

            if ($test['passing_score'] === 0) {
                $warnings[] = "Ujian {$test['title']}: passing score 0 (ikut kelas sumber). Periksa lagi.";
            }
            if ($test['max_attempts'] === 0) {
                $warnings[] = "Ujian {$test['title']}: maksimal pengerjaan tidak terbatas (ikut kelas sumber). Periksa lagi.";
            }

            $tests[] = $test;
        }

        return [$tests, $warnings];
    }

    public function endDate(array $schedules, array $tests): CarbonImmutable
    {
        $end = null;
        foreach ($tests as $test) {
            if (!empty($test['end_date'])) {
                $at = $this->parse($test['end_date']);
                $end = $end === null || $at->gt($end) ? $at : $end;
            }
        }

        if ($end !== null) {
            return $end->setTime(23, 59, 59);
        }

        $last = null;
        foreach ($schedules as $schedule) {
            if (!empty($schedule['scheduled_at'])) {
                $at = $this->parse($schedule['scheduled_at']);
                $last = $last === null || $at->gt($last) ? $at : $last;
            }
        }

        return ($last ?? CarbonImmutable::now())
            ->startOfDay()
            ->addDays(max(1, (int) ($this->config['exam_window_days'] ?? 7)))
            ->setTime(23, 59, 59);
    }

    private function testMateri(?string $bankName, ?string $title): string
    {
        if ($bankName) {
            $key = $this->materiKey($bankName);
            if ($this->isKnownMateri($key)) {
                return $key;
            }
        }

        return $this->materiKey($title ?? $bankName ?? '');
    }

    private function collectStream(array $stream, CarbonImmutable $start, string $type, string $time, array $templates, array &$warnings): array
    {
        $sessions = [];
        $byMoment = [];

        foreach ($this->sortSessions($stream) as $session) {
            $at = $this->parse($session['scheduled_at']);
            if ($at->lt($start) || $this->dayType($at) !== $type || $at->format('H:i') !== $time) {
                continue;
            }

            $materi = $this->materiKey($session['title']);
            if (!isset($templates[$materi])) {
                $warnings[] = "Materi \"{$session['title']}\" di rotasi tidak ada di kelas sumber, jadi dilewati.";
                continue;
            }

            $moment = $at->format('Y-m-d H:i');
            $courseName = $session['course_name'] ?? null;

            if (isset($byMoment[$moment])) {
                $existing = &$sessions[$byMoment[$moment]];
                if ($existing['materi'] !== $materi) {
                    $warnings[] = 'Jadwal ' . $at->format('d/m/Y H:i') . " berbeda antar kelas ({$existing['title']} vs {$session['title']}). Dipakai {$existing['title']} dari kelas terbaru.";
                }
                if ($courseName && !in_array($courseName, $existing['courses'], true)) {
                    $existing['courses'][] = $courseName;
                }
                if (empty($existing['zoom_link']) && !empty($session['zoom_link'])) {
                    $existing['zoom_link'] = $session['zoom_link'];
                }
                unset($existing);
                continue;
            }

            $byMoment[$moment] = count($sessions);
            $sessions[] = [
                'title' => $session['title'],
                'scheduled_at' => $at->format(self::FORMAT),
                'zoom_link' => $session['zoom_link'] ?? null,
                'materi' => $materi,
                'courses' => $courseName ? [$courseName] : [],
            ];
        }

        return $sessions;
    }

    private function appendSession(array &$schedules, string $title, string $materi, CarbonImmutable $cursor, string $type, string $time): CarbonImmutable
    {
        $slot = $this->nextSlot($cursor, $type, $time);
        $schedules[] = [
            'title' => $title,
            'scheduled_at' => $slot->format(self::FORMAT),
            'zoom_link' => null,
            'materi' => $materi,
            'origin' => 'lanjutan',
            'origin_label' => 'Lanjutan rotasi (dari urutan kelas sumber)',
        ];

        return $slot;
    }

    private function nextSlot(CarbonImmutable $after, string $type, string $time): CarbonImmutable
    {
        $days = $this->sessionDays($type);
        $date = $after->startOfDay()->addDay();
        for ($i = 0; $i < 14 && !in_array($date->dayOfWeek, $days, true); $i++) {
            $date = $date->addDay();
        }
        [$hour, $minute] = array_map('intval', explode(':', $time) + [0, 0]);

        return $date->setTime($hour, $minute);
    }

    private function sessionDays(string $type): array
    {
        return $this->config['session_days'][$type] ?? ($type === 'weekend' ? [6, 0] : [2, 3, 4]);
    }

    private function sortSessions(array $sessions): array
    {
        $sessions = array_values(array_filter($sessions, fn ($s) => !empty($s['scheduled_at']) && isset($s['title'])));
        usort($sessions, fn ($a, $b) => strcmp($this->parse($a['scheduled_at'])->format(self::FORMAT), $this->parse($b['scheduled_at'])->format(self::FORMAT)));

        return $sessions;
    }

    /**
     * @param  string[]  $datetimes
     */
    private function dominantTime(array $datetimes): ?string
    {
        $counts = [];
        foreach ($datetimes as $datetime) {
            if (!$datetime) {
                continue;
            }
            $key = $this->parse($datetime)->format('H:i');
            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }

        if ($counts === []) {
            return null;
        }
        arsort($counts);

        return array_key_first($counts);
    }

    private function parse(string $datetime): CarbonImmutable
    {
        return CarbonImmutable::parse($datetime, 'UTC');
    }
}
