<?php

namespace App\Imports;

use App\Models\Course;
use App\Services\Brevet\ParticipantEnroller;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class UserImport implements ToModel, WithHeadingRow, SkipsEmptyRows, WithValidation
{
    use Importable;

    protected ?string $platformId;

    /**
     * Ringkasan hasil impor untuk ditampilkan ke admin.
     */
    protected array $report = [
        'created' => 0,
        'enrolled' => 0,
        'already_enrolled' => 0,
        'skipped_other_platform' => [],
        'course_not_found' => [],
    ];

    public function __construct(?string $platformId = null)
    {
        $this->platformId = $platformId;
    }

    private function resolveCourseCode(array $row): ?string
    {
        $courseCode = $row['course_code'] ?? null;

        if ($courseCode === null) {
            return null;
        }

        $courseCode = trim((string) $courseCode);

        return $courseCode !== '' ? $courseCode : null;
    }

    public function model(array $row)
    {
        $course = null;
        $courseCode = $this->resolveCourseCode($row);
        if ($courseCode) {
            $course = Course::whereRaw('LOWER(code) = ?', [Str::lower($courseCode)])->first();
            if (!$course) {
                $this->report['course_not_found'][$courseCode] = $courseCode;
            }
        }

        $result = app(ParticipantEnroller::class)->enroll($row, $this->platformId, $course);

        if ($result['account'] === ParticipantEnroller::SKIPPED_OTHER_PLATFORM) {
            $this->report['skipped_other_platform'][] = $result['user']->email;
            return null;
        }
        if ($result['account'] === 'created') {
            $this->report['created']++;
        }
        if ($result['class'] === 'enrolled') {
            $this->report['enrolled']++;
        } elseif ($result['class'] === 'already') {
            $this->report['already_enrolled']++;
        }

        return null;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'email',
                'regex:/@/',
            ],
            'phone_number' => [
                'required',
                'min:8',
                'regex:/^[0-9+\s\-()]+$/',
                'not_regex:/[a-zA-Z]/',
            ],
        ];
    }

    public function report(): array
    {
        $report = $this->report;
        $report['course_not_found'] = array_values($report['course_not_found']);

        return $report;
    }

    /**
     * Kalimat ringkas hasil impor. `warning` berisi baris yang tidak masuk kelas.
     *
     * @return array{summary: string, warning: ?string}
     */
    public function summary(): array
    {
        $report = $this->report();
        $summary = "Impor selesai: {$report['created']} akun baru, {$report['enrolled']} masuk kelas"
            . ($report['already_enrolled'] > 0 ? ", {$report['already_enrolled']} sudah ada di kelas" : '')
            . '.';

        $warnings = [];
        if ($report['skipped_other_platform'] !== []) {
            $warnings[] = count($report['skipped_other_platform'])
                . ' peserta dilewati karena terdaftar di platform lain (tidak masuk kelas): '
                . $this->shortList($report['skipped_other_platform']);
        }
        if ($report['course_not_found'] !== []) {
            $warnings[] = 'Kode kelas tidak ditemukan: ' . $this->shortList($report['course_not_found'])
                . '. Akun tetap dibuat tapi belum masuk kelas.';
        }

        return [
            'summary' => $summary,
            'warning' => $warnings !== [] ? implode(' | ', $warnings) : null,
        ];
    }

    private function shortList(array $items, int $limit = 5): string
    {
        $shown = implode(', ', array_slice($items, 0, $limit));
        $rest = count($items) - $limit;

        return $rest > 0 ? "{$shown} (dan {$rest} lainnya)" : $shown;
    }

    public function customValidationMessages(): array
    {
        return [
            'email.required' => 'Kolom email wajib diisi.',
            'email.email' => 'Kolom email wajib mengandung karakter "@" (format email tidak valid).',
            'email.regex' => 'Kolom email wajib mengandung karakter "@" (format email tidak valid).',
            'phone_number.required' => 'Kolom nomor HP wajib diisi.',
            'phone_number.regex' => 'Kolom nomor HP hanya boleh berisi angka dan tidak boleh mengandung huruf.',
            'phone_number.not_regex' => 'Kolom nomor HP hanya boleh berisi angka dan tidak boleh mengandung huruf.',
            'phone_number.min' => 'Kolom nomor HP minimal 8 digit.',
        ];
    }
}
