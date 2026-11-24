<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CourseSchedule extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'scheduled_at' => 'datetime:Y-m-d\TH:i:s+07:00',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }
}
