<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseSubmission extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'deadline' => 'datetime',
        'file_size' => 'integer',
    ];

    protected $appends = [
        'is_deadline_passed',
    ];

    public function getIsDeadlinePassedAttribute(): bool
    {
        if (!$this->deadline) {
            return false;
        }

        return now()->gt($this->deadline);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    public function courseTests()
    {
        return $this->hasMany(CourseTest::class);
    }
}

