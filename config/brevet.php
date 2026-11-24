<?php

/*
|--------------------------------------------------------------------------
| Rotasi kelas Brevet
|--------------------------------------------------------------------------
| Dipakai fitur "Duplikat kelas" untuk menyusun jadwal & ujian kelas baru
| dari rotasi yang sedang berjalan. Semua hasil hitungan hanya nilai awal:
| admin tetap bisa mengubahnya di pratinjau sebelum disimpan.
*/

return [
    // Padanan nama materi. Judul jadwal, judul ujian, dan nama bank soal
    // dinormalisasi (huruf besar, tanpa "SESI xx" / "BANK SOAL" / tanda baca)
    // lalu dicocokkan berurutan: materi pertama yang SEMUA kata kuncinya ada
    // di judul akan dipakai. Urutan penting (mis. "POT PUT" sebelum "PPH OP").
    'materi' => [
        'PEMERIKSAAN' => ['PEMERIKSAAN'],
        'PPH POT PUT' => ['POT', 'PUT'],
        'PPH BADAN' => ['BADAN'],
        'PPH OP' => ['PPH OP'],
        'PBB & BPHTB' => ['PBB'],
        'AKUNTANSI PERPAJAKAN' => ['AKUNTANSI'],
        'KUP' => ['KUP'],
        'PPN' => ['PPN'],
    ],

    // Nilai awal ujian bila kelas sumber tidak punya ujian untuk materi itu.
    'test_defaults' => [
        'duration' => 120,
        'passing_score' => 70,
        'max_attempts' => 5,
        'questions_to_show' => 30,
        'show_score' => true,
        'show_correct_answers' => false,
    ],

    // Pola umum (bukan patokan). Weekend: ujian dibuka Senin setelah sesi
    // terakhir materi. Weekday: dibuka sehari setelah sesi terakhir materi.
    'exam_open_time' => [
        'weekend' => '06:00',
        'weekday' => '08:00',
    ],
    'exam_window_days' => 7,

    // Jam sesi bila tidak bisa dibaca dari kelas sumber.
    'session_time' => [
        'weekend' => '15:00',
        'weekday' => '18:30',
    ],

    // Hari sesi (Carbon dayOfWeek: 0 = Minggu, 6 = Sabtu).
    'session_days' => [
        'weekend' => [6, 0],
        'weekday' => [2, 3, 4],
    ],
];
