<?php

namespace App\Services\Brevet;

use App\Models\Course;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Aktifkan / matikan remedial untuk ujian satu kelas sekaligus.
 * Dipakai tombol "Atur Remedial" (panel pengajar) dan API agent Cava.
 */
class CourseRemedialService
{
    /**
     * @return array{count: int, start: ?Carbon, end: ?Carbon}
     */
    public function apply(Course $course, bool $enabled, ?string $remedialEndDate, array $testIds = []): array
    {
        $query = $course->courseTests();
        if ($testIds !== []) {
            $query->whereIn('id', $testIds);
        }

        if (!$enabled) {
            return ['count' => $query->update(['remedial_enabled' => false, 'remedial_end_date' => null]), 'start' => null, 'end' => null];
        }

        if (!$remedialEndDate) {
            throw ValidationException::withMessages(['remedial_end_date' => 'Isi tanggal dan jam selesai remedial.']);
        }

        $end = Carbon::parse($remedialEndDate);
        $courseEnd = $course->getRawOriginal('end_date') ? Carbon::parse($course->getRawOriginal('end_date')) : null;
        $start = $courseEnd ? $courseEnd->copy()->addDay()->startOfDay() : now()->addDay()->startOfDay();

        if ($end->lt($start)) {
            throw ValidationException::withMessages([
                'remedial_end_date' => 'Waktu selesai remedial tidak boleh sebelum waktu mulai remedial (' . $start->format('Y-m-d H:i') . ').',
            ]);
        }

        $count = $query->update(['remedial_enabled' => true, 'remedial_end_date' => $end->format('Y-m-d H:i:s')]);

        return ['count' => $count, 'start' => $start, 'end' => $end];
    }
}
