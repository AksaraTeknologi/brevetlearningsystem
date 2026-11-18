<?php

namespace App\Services\Brevet;

use App\Models\Course;
use App\Models\CourseUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * Satu aturan untuk memasukkan peserta ke brevetlearning, dipakai impor
 * Excel (UserImport) dan API kirim peserta dari platform asal.
 *  - Akun baru: password awal = nomor HP (format 08…), role pengguna.
 *  - Akun ada tanpa platform → diklaim platform (induk) yang dikirim.
 *  - Akun ada dengan platform lain → dilewati, tidak masuk kelas.
 */
class ParticipantEnroller
{
    public const SKIPPED_OTHER_PLATFORM = 'skipped_other_platform';

    public static function formatPhone($phoneNumber): string
    {
        if ($phoneNumber === null) {
            return '';
        }

        $phone = preg_replace('/[\s\-\(\)\.]+/', '', trim((string) $phoneNumber));

        if (str_starts_with($phone, '+62')) {
            $phone = '0' . substr($phone, 3);
        } elseif (str_starts_with($phone, '62')) {
            $phone = '0' . substr($phone, 2);
        }

        return $phone;
    }

    /**
     * @param  array{name?: string, email: string, phone_number?: string, npwp?: mixed, address?: string}  $row
     * @return array{account: string, class: ?string, user: ?User}
     *         account: created | existing | skipped_other_platform; class: enrolled | already | null
     */
    public function enroll(array $row, ?string $platformId, ?Course $course): array
    {
        $email = trim((string) $row['email']);
        $user = User::where('email', $email)->first();

        if ($user) {
            if ($platformId && $user->platform_id && $user->platform_id !== $platformId) {
                return ['account' => self::SKIPPED_OTHER_PLATFORM, 'class' => null, 'user' => $user];
            }
            if ($platformId && is_null($user->platform_id)) {
                $user->update(['platform_id' => $platformId]);
            }
            $account = 'existing';
        } else {
            $phone = self::formatPhone($row['phone_number'] ?? '');
            $user = User::create([
                'name' => $row['name'] ?? $email,
                'email' => $email,
                'phone_number' => $phone,
                'npwp' => isset($row['npwp']) && $row['npwp'] !== '' ? strval($row['npwp']) : null,
                'address' => $row['address'] ?? null,
                'password' => Hash::make($phone),
                'role' => 'pengguna',
                'platform_id' => $platformId,
                'event_id' => 1,
            ]);
            $account = 'created';
        }

        $class = null;
        if ($course) {
            $enrollment = CourseUser::firstOrCreate(['course_id' => $course->id, 'user_id' => $user->id]);
            $class = $enrollment->wasRecentlyCreated ? 'enrolled' : 'already';
        }

        return ['account' => $account, 'class' => $class, 'user' => $user];
    }
}
