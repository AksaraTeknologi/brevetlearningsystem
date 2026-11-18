<?php

namespace App\Console\Commands;

use App\Models\IntegrationClient;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * Buat / rotasi token klien integrasi. Token hanya ditampilkan sekali.
 *
 *   php artisan integration:token aksademy --name=Aksademy --teacher=pengajar@contoh.id
 *   php artisan integration:token cava --kind=agent --write --teacher=pengajar@contoh.id
 */
class IntegrationTokenCommand extends Command
{
    protected $signature = 'integration:token
        {code : Kode unik klien, mis. aksademy, kompeten, cava}
        {--name= : Nama tampilan}
        {--kind=platform : platform (kirim peserta) atau agent (Cava)}
        {--teacher= : Email pengajar; klien hanya boleh menyentuh kelas pengajar ini}
        {--write : (agent) izinkan perubahan: ujian, remedial, reset password, link Zoom}
        {--keep : jangan cabut token lama}';

    protected $description = 'Buat atau rotasi token API klien integrasi (platform asal / agent Cava)';

    public function handle(): int
    {
        $kind = $this->option('kind');
        if (!in_array($kind, [IntegrationClient::KIND_PLATFORM, IntegrationClient::KIND_AGENT], true)) {
            $this->error('--kind harus platform atau agent');
            return self::FAILURE;
        }

        $teacherId = null;
        if ($email = $this->option('teacher')) {
            $teacher = User::where('email', $email)->where('role', 'pengajar')->first();
            if (!$teacher) {
                $this->error("Pengajar {$email} tidak ditemukan");
                return self::FAILURE;
            }
            $teacherId = $teacher->id;
        }

        $client = IntegrationClient::firstOrNew(['code' => $this->argument('code')]);
        $client->fill([
            'name' => $this->option('name') ?: ($client->name ?: $this->argument('code')),
            'kind' => $kind,
            'teacher_id' => $teacherId ?? $client->teacher_id,
            'is_active' => true,
        ])->save();

        if (!$this->option('keep')) {
            $client->tokens()->delete();
        }

        $abilities = $kind === IntegrationClient::KIND_PLATFORM
            ? ['enroll']
            : array_values(array_filter(['agent:read', $this->option('write') ? 'agent:write' : null]));

        $token = $client->createToken("{$client->code}-" . now()->format('Ymd'), $abilities)->plainTextToken;

        $this->info("Klien: {$client->name} ({$client->code}) · jenis {$kind} · izin " . implode(', ', $abilities)
            . ($client->teacher_id ? ' · dibatasi kelas pengajar' : ' · SEMUA kelas'));
        $this->line('Token (simpan sekarang, tidak ditampilkan lagi):');
        $this->line($token);

        return self::SUCCESS;
    }
}
