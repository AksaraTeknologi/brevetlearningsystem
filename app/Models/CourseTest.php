<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Models\CourseTestAttempt;

class CourseTest extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'questions_to_show' => 'integer',
        'duration' => 'integer',
        'passing_score' => 'integer',
        'max_attempts' => 'integer',
        'show_score' => 'boolean',
        'show_correct_answers' => 'boolean',
        'start_date' => 'datetime:Y-m-d\TH:i:s+07:00',
        'end_date' => 'datetime:Y-m-d\TH:i:s+07:00',
        'remedial_enabled' => 'boolean',
        'remedial_end_date' => 'datetime:Y-m-d\TH:i:s+07:00',
        'requires_submission' => 'boolean',
        'reference_link' => 'array',
    ];

    protected $appends = ['question_count'];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function questionBank()
    {
        return $this->belongsTo(QuestionBank::class, 'question_bank_id');
    }

    public function questions()
    {
        return $this->hasMany(Question::class, 'question_bank_id', 'question_bank_id')
            ->whereNotNull('question_bank_id')
            ->orderBy('order_no');
    }

    public function attempts()
    {
        return $this->hasMany(CourseTestAttempt::class, 'course_test_id');
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class, 'course_test_id');
    }

    public function courseSubmission()
    {
        return $this->belongsTo(CourseSubmission::class, 'course_submission_id');
    }

    public function getQuestionCountAttribute()
    {
        return $this->questions()->count();
    }

    /**
     * Mengembalikan daftar user_id yang ditolak ikut ujian karena syarat submission belum terpenuhi
     * (submission ditolak, tidak mengumpulkan, mengumpulkan tapi tidak lengkap, atau belum di-ACC),
     * dipetakan ke ringkasan alasannya.
     */
    public function getRejectedSubmissionsByUser(?iterable $participantUserIds = null): \Illuminate\Support\Collection
    {
        if (!$this->requires_submission) {
            return collect();
        }

        $userIds = $participantUserIds !== null
            ? collect($participantUserIds)->filter()->unique()->values()
            : $this->course()->first()?->participants()->pluck('user_id')->filter()->unique()->values() ?? collect();

        if ($userIds->isEmpty()) {
            return collect();
        }

        $formatRejectedSub = function ($sub): string {
            $title = $sub->courseSubmission?->title;
            $note = trim((string) ($sub->admin_notes ?? ''));

            if ($title && $note !== '') {
                return "{$title}: {$note}";
            }
            if ($title) {
                return "{$title} ditolak";
            }
            if ($note !== '') {
                return "Submission ditolak: {$note}";
            }

            return 'Submission ditolak';
        };

        $result = collect();

        // Kasus 1: Ujian mewajibkan 1 tugas submission spesifik
        if ($this->course_submission_id) {
            $targetTask = CourseSubmission::find($this->course_submission_id, ['id', 'title']);
            $submissionsByUser = Submission::where('course_submission_id', $this->course_submission_id)
                ->whereIn('user_id', $userIds)
                ->with('courseSubmission:id,title')
                ->get(['id', 'user_id', 'course_submission_id', 'status', 'admin_notes'])
                ->keyBy('user_id');

            foreach ($userIds as $userId) {
                $sub = $submissionsByUser->get($userId);

                if ($sub && $sub->status === 'approved') {
                    continue;
                }

                if (!$sub) {
                    $result->put(
                        $userId,
                        $targetTask ? "Tidak mengumpulkan ({$targetTask->title})" : 'Tidak mengumpulkan tugas'
                    );
                } elseif ($sub->status === 'rejected') {
                    $result->put($userId, $formatRejectedSub($sub));
                } else {
                    $result->put(
                        $userId,
                        $targetTask ? "Belum di-ACC ({$targetTask->title})" : 'Submission belum di-ACC'
                    );
                }
            }

            return $result;
        }

        // Kasus 2: Ujian mewajibkan SEMUA tugas submission di kelas ini
        $courseSubmissions = CourseSubmission::where('course_id', $this->course_id)
            ->get(['id', 'title']);

        if ($courseSubmissions->isNotEmpty()) {
            $totalTasks = $courseSubmissions->count();
            $taskIds = $courseSubmissions->pluck('id');

            $submissionsByUser = Submission::where('course_id', $this->course_id)
                ->whereIn('course_submission_id', $taskIds)
                ->whereIn('user_id', $userIds)
                ->with('courseSubmission:id,title')
                ->get(['id', 'user_id', 'course_submission_id', 'status', 'admin_notes'])
                ->groupBy('user_id');

            foreach ($userIds as $userId) {
                $userSubs = $submissionsByUser->get($userId, collect())->keyBy('course_submission_id');
                $approvedCount = $userSubs->where('status', 'approved')->count();

                if ($approvedCount >= $totalTasks) {
                    continue;
                }

                $submittedCount = $userSubs->count();
                $missingCount = $totalTasks - $submittedCount;
                $rejectedSubs = $userSubs->where('status', 'rejected');
                $pendingCount = $userSubs->where('status', 'pending_review')->count();

                $reasons = [];

                if ($rejectedSubs->isNotEmpty()) {
                    $reasons[] = $rejectedSubs->map($formatRejectedSub)->unique()->implode('; ');
                }

                if ($submittedCount === 0) {
                    $reasons[] = 'Tidak mengumpulkan tugas';
                } elseif ($missingCount > 0) {
                    $reasons[] = "Tugas tidak lengkap ({$submittedCount}/{$totalTasks})";
                }

                if ($pendingCount > 0) {
                    $reasons[] = "{$pendingCount} tugas belum di-ACC";
                }

                $result->put($userId, implode('; ', $reasons) ?: 'Syarat submission belum terpenuhi');
            }

            return $result;
        }

        // Kasus 3: Fallback legacy (tanpa course_submissions)
        $legacySubsByUser = Submission::whereIn('user_id', $userIds)
            ->where(function ($query) {
                $query->where('course_test_id', $this->id)
                    ->orWhere('course_id', $this->course_id);
            })
            ->get(['id', 'user_id', 'status', 'admin_notes'])
            ->groupBy('user_id');

        foreach ($userIds as $userId) {
            $userSubs = $legacySubsByUser->get($userId, collect());

            if ($userSubs->contains('status', 'approved')) {
                continue;
            }

            if ($userSubs->isEmpty()) {
                $result->put($userId, 'Tidak mengumpulkan submission');
            } elseif ($rejected = $userSubs->firstWhere('status', 'rejected')) {
                $note = trim((string) ($rejected->admin_notes ?? ''));
                $result->put($userId, $note !== '' ? "Submission ditolak: {$note}" : 'Submission ditolak');
            } else {
                $result->put($userId, 'Submission belum di-ACC');
            }
        }

        return $result;
    }
}
