<?php

namespace App\Http\Controllers\Api\Integration;

use App\Http\Controllers\Controller;
use App\Imports\UserImport;
use App\Models\Course;
use App\Models\IntegrationClient;
use App\Models\Platform;
use App\Services\Brevet\ParticipantEnroller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * API untuk platform asal (aksademy, kompeten, ...): cek kelas berdasarkan
 * kode dan kirim peserta ke kelas. Ability token: `enroll`.
 */
class EnrollmentController extends Controller
{
    public function platforms(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Platform::where('is_active', true)->orderBy('name')->get(['code', 'name']),
        ]);
    }

    public function lookup(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|max:64']);
        $course = $this->findCourse($request->user(), $request->string('code')->trim()->value());

        if (!$course) {
            return response()->json(['success' => false, 'message' => 'Kode kelas tidak ditemukan.'], 404);
        }

        $platforms = Platform::pluck('code', 'id');
        $participants = $course->participants()->with('user:id,name,email,phone_number,platform_id')->get()
            ->filter(fn ($p) => $p->user)
            ->map(fn ($p) => [
                'name' => $p->user->name,
                'email' => $p->user->email,
                'phone_number' => $p->user->phone_number,
                'platform_code' => $platforms[$p->user->platform_id] ?? null,
            ])
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $course->code,
                'name' => $course->name,
                'start_date' => $course->getRawOriginal('start_date'),
                'end_date' => $course->getRawOriginal('end_date'),
                'participants_count' => $participants->count(),
                'participants' => $participants,
            ],
        ]);
    }

    public function enroll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_code' => 'required|string|max:64',
            'platform_code' => 'nullable|string|max:255',
            'participants' => 'required|array|min:1|max:500',
            'participants.*.email' => 'required|string|max:255',
        ]);

        /** @var IntegrationClient $client */
        $client = $request->user();
        $course = $this->findCourse($client, trim($validated['course_code']));
        if (!$course) {
            return response()->json(['success' => false, 'message' => 'Kode kelas tidak ditemukan.'], 404);
        }

        $platform = null;
        if (!empty($validated['platform_code'])) {
            $platform = Platform::where('code', $validated['platform_code'])->where('is_active', true)->first();
            if (!$platform) {
                return response()->json(['success' => false, 'message' => 'Platform induk tidak ditemukan atau nonaktif.'], 422);
            }
        }

        $rules = (new UserImport())->rules();
        $messages = (new UserImport())->customValidationMessages();
        $enroller = app(ParticipantEnroller::class);
        $results = [];
        $summary = ['created' => 0, 'enrolled' => 0, 'already' => 0, 'skipped_other_platform' => 0, 'invalid' => 0];

        DB::transaction(function () use ($request, $rules, $messages, $enroller, $course, $platform, &$results, &$summary) {
            foreach ($request->input('participants') as $row) {
                $row = is_array($row) ? $row : [];
                $validator = Validator::make($row, $rules, $messages);
                if ($validator->fails()) {
                    $results[] = ['email' => $row['email'] ?? null, 'status' => 'invalid', 'message' => $validator->errors()->first()];
                    $summary['invalid']++;
                    continue;
                }

                $result = $enroller->enroll($row, $platform?->id, $course);
                $status = match (true) {
                    $result['account'] === ParticipantEnroller::SKIPPED_OTHER_PLATFORM => 'skipped_other_platform',
                    $result['class'] === 'already' => 'already',
                    $result['account'] === 'created' => 'created',
                    default => 'enrolled',
                };
                $summary[$status]++;
                $results[] = [
                    'email' => $result['user']?->email ?? $row['email'],
                    'status' => $status,
                    'message' => $status === 'skipped_other_platform'
                        ? 'Email sudah terdaftar di platform lain, tidak dimasukkan ke kelas.'
                        : null,
                ];
            }
        });

        $client->audit('enroll', $course, ['platform' => $platform?->code, 'summary' => $summary]);

        return response()->json([
            'success' => true,
            'course' => ['code' => $course->code, 'name' => $course->name],
            'summary' => $summary,
            'results' => $results,
        ]);
    }

    private function findCourse(IntegrationClient $client, string $code): ?Course
    {
        return $client->courseQuery()->whereRaw('LOWER(code) = ?', [Str::lower($code)])->first();
    }
}
