<?php

use App\Http\Controllers\Api\Platform\PlatformCourseController;
use App\Http\Controllers\Api\Platform\PlatformExamResultController;
use App\Http\Controllers\Api\Platform\PlatformProfileController;
use App\Http\Controllers\Api\Platform\PlatformStudentController;
use App\Http\Controllers\Api\Integration\AgentController;
use App\Http\Controllers\Api\Integration\EnrollmentController;
use App\Http\Middleware\EnsureActivePlatform;
use App\Http\Middleware\EnsureIntegrationClient;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/platform')->middleware(['auth:sanctum', EnsureActivePlatform::class])->group(function () {
    Route::get('/profile', [PlatformProfileController::class, 'show'])->name('api.platform.profile');
    Route::get('/students', [PlatformStudentController::class, 'index'])->name('api.platform.students');
    Route::get('/students/{id}', [PlatformStudentController::class, 'show'])->name('api.platform.students.show');
    Route::get('/courses', [PlatformCourseController::class, 'index'])->name('api.platform.courses');
    Route::get('/courses/{id}', [PlatformCourseController::class, 'show'])->name('api.platform.courses.show');
    Route::get('/courses/{id}/students', [PlatformCourseController::class, 'students'])->name('api.platform.courses.students');
    Route::get('/courses/{id}/tests', [PlatformCourseController::class, 'tests'])->name('api.platform.courses.tests');
    Route::get('/courses/{id}/grades', [PlatformCourseController::class, 'grades'])->name('api.platform.courses.grades');
    Route::get('/exam-results', [PlatformExamResultController::class, 'index'])->name('api.platform.exam_results');
});

// Integrasi: platform asal (kirim peserta) dan agent Cava. Token: php artisan integration:token
Route::prefix('v1/integration')->middleware('auth:sanctum')->group(function () {
    Route::middleware([EnsureIntegrationClient::class . ':enroll', 'throttle:integration'])->group(function () {
        Route::get('/platforms', [EnrollmentController::class, 'platforms']);
        Route::get('/courses/lookup', [EnrollmentController::class, 'lookup']);
        Route::post('/enroll', [EnrollmentController::class, 'enroll']);
    });

    Route::prefix('agent')->group(function () {
        Route::middleware([EnsureIntegrationClient::class . ':agent:read', 'throttle:integration'])->group(function () {
            Route::get('/courses', [AgentController::class, 'courses']);
            Route::get('/question-banks', [AgentController::class, 'questionBanks']);
            Route::get('/participants', [AgentController::class, 'participants']);
            Route::post('/courses/{course}/grades', [AgentController::class, 'grades']);
        });
        Route::middleware([EnsureIntegrationClient::class . ':agent:write', 'throttle:integration'])->group(function () {
            Route::post('/courses/{course}/tests', [AgentController::class, 'storeTest']);
            Route::patch('/tests/{test}', [AgentController::class, 'updateTest']);
            Route::post('/courses/{course}/remedial', [AgentController::class, 'remedial']);
            Route::post('/participants/{user}/reset-password', [AgentController::class, 'resetPassword']);
            Route::post('/schedules/zoom-link', [AgentController::class, 'zoomLink']);
        });
    });
});

// Server to server from Biinsphere, each call carries a signed single-use token
// (Authorization: Bearer). Remember or forget which Biinsphere account a user
// connected (Biinsphere AGENTS §14).
Route::post('/biinsphere/link', [\App\Http\Controllers\Auth\BiinsphereAuthController::class, 'confirmLink'])->name('biinsphere.link');
Route::post('/biinsphere/unlink', [\App\Http\Controllers\Auth\BiinsphereAuthController::class, 'unlink'])->name('biinsphere.unlink');
