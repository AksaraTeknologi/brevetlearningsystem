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
     * Mengembalikan daftar user_id yang ditolak ikut ujian karena submission-nya ditolak,
     * dipetakan ke ringkasan alasan penolakannya.
     */
    public function getRejectedSubmissionsByUser(): \Illuminate\Support\Collection
    {
        if (!$this->requires_submission) {
            return collect();
        }

        if ($this->course_submission_id) {
            $rejected = Submission::where('course_submission_id', $this->course_submission_id)
                ->where('status', 'rejected')
                ->with('courseSubmission:id,title')
                ->get(['id', 'user_id', 'course_submission_id', 'admin_notes']);
        } else {
            $courseSubmissionIds = CourseSubmission::where('course_id', $this->course_id)->pluck('id');

            if ($courseSubmissionIds->isNotEmpty()) {
                $rejected = Submission::where('course_id', $this->course_id)
                    ->whereIn('course_submission_id', $courseSubmissionIds)
                    ->where('status', 'rejected')
                    ->with('courseSubmission:id,title')
                    ->get(['id', 'user_id', 'course_submission_id', 'admin_notes']);
            } else {
                $rejected = Submission::where('status', 'rejected')
                    ->where(function ($query) {
                        $query->where('course_test_id', $this->id)
                            ->orWhere('course_id', $this->course_id);
                    })
                    ->get(['id', 'user_id', 'course_submission_id', 'admin_notes']);
            }
        }

        return $rejected
            ->groupBy('user_id')
            ->map(function ($items) {
                return $items->map(function ($sub) {
                    $title = $sub->courseSubmission?->title;
                    $note = trim((string) ($sub->admin_notes ?? ''));

                    if ($title && $note !== '') {
                        return "{$title}: {$note}";
                    }
                    if ($title) {
                        return "{$title} ditolak";
                    }
                    if ($note !== '') {
                        return $note;
                    }

                    return 'Submission ditolak';
                })->unique()->implode('; ');
            });
    }
}
