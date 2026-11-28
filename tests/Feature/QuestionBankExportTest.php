<?php

namespace Tests\Feature;

use App\Exports\QuestionBankQuestionsExport;
use App\Models\Event;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\QuestionOption;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class QuestionBankExportTest extends TestCase
{
    use DatabaseTransactions;

    private User $teacher;
    private User $otherTeacher;
    private User $student;
    private QuestionBank $bank;

    protected function setUp(): void
    {
        parent::setUp();

        Event::firstOrCreate(['id' => 1], ['code' => 'PUB001', 'name' => 'Public']);

        $this->teacher = User::factory()->create([
            'role' => 'pengajar',
        ]);

        $this->otherTeacher = User::factory()->create([
            'role' => 'pengajar',
        ]);

        $this->student = User::factory()->create([
            'role' => 'pengguna',
        ]);

        $this->bank = QuestionBank::create([
            'teacher_id' => $this->teacher->id,
            'name' => 'Try Out UKP A Paket 1',
            'is_active' => true,
        ]);
    }

    public function test_export_matches_template_headings_and_question_data(): void
    {
        $q1 = Question::create([
            'question_bank_id' => $this->bank->id,
            'question_text' => 'PKP seorang wajib pajak Rp150.000.000. PPh terutang adalah?',
            'explanation' => 'Pembahasan Pasal 17',
            'question_type' => 'multiple_choice',
            'order_no' => 1,
        ]);
        foreach (['Rp15.000.000', 'Rp17.000.000', 'Rp18.000.000', 'Rp20.000.000'] as $idx => $text) {
            QuestionOption::create([
                'question_id' => $q1->id,
                'option_text' => $text,
                'is_correct' => $idx === 1,
            ]);
        }

        $q2 = Question::create([
            'question_bank_id' => $this->bank->id,
            'question_text' => 'PTKP wajib pajak K/1 adalah Rp63.000.000.',
            'explanation' => null,
            'question_type' => 'true_false',
            'order_no' => 2,
        ]);
        QuestionOption::create(['question_id' => $q2->id, 'option_text' => 'Benar', 'is_correct' => true]);
        QuestionOption::create(['question_id' => $q2->id, 'option_text' => 'Salah', 'is_correct' => false]);

        $export = new QuestionBankQuestionsExport($this->bank);

        $this->assertSame(
            ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'correct_option', 'explanation'],
            $export->headings()
        );

        $rows = $export->array();
        $this->assertCount(2, $rows);
        $this->assertSame([
            'PKP seorang wajib pajak Rp150.000.000. PPh terutang adalah?',
            'Rp15.000.000',
            'Rp17.000.000',
            'Rp18.000.000',
            'Rp20.000.000',
            null,
            'b',
            'Pembahasan Pasal 17',
        ], $rows[0]);
        $this->assertSame([
            'PTKP wajib pajak K/1 adalah Rp63.000.000.',
            'Benar',
            'Salah',
            null,
            null,
            null,
            'a',
            null,
        ], $rows[1]);
    }

    public function test_export_expands_option_columns_when_question_has_more_than_five_options(): void
    {
        $q = Question::create([
            'question_bank_id' => $this->bank->id,
            'question_text' => 'Soal enam opsi?',
            'question_type' => 'multiple_choice',
            'order_no' => 1,
        ]);
        foreach (range('A', 'F') as $idx => $letter) {
            QuestionOption::create([
                'question_id' => $q->id,
                'option_text' => "Opsi {$letter}",
                'is_correct' => $idx === 5,
            ]);
        }

        $export = new QuestionBankQuestionsExport($this->bank);

        $this->assertSame(
            ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'option_f', 'correct_option', 'explanation'],
            $export->headings()
        );
        $this->assertSame('f', $export->array()[0][7]);
    }

    public function test_teacher_can_download_question_bank_excel(): void
    {
        $q = Question::create([
            'question_bank_id' => $this->bank->id,
            'question_text' => 'Contoh soal ekspor',
            'explanation' => 'Penjelasan contoh',
            'question_type' => 'multiple_choice',
            'order_no' => 1,
        ]);
        QuestionOption::create(['question_id' => $q->id, 'option_text' => 'Opsi 1', 'is_correct' => false]);
        QuestionOption::create(['question_id' => $q->id, 'option_text' => 'Opsi 2', 'is_correct' => true]);

        $response = $this->actingAs($this->teacher)
            ->get(route('teacher.questionBankQuestions.export', $this->bank->id));

        $response->assertOk();
        $response->assertDownload('soal_try_out_ukp_a_paket_1.xlsx');

        $file = $response->baseResponse->getFile();
        $spreadsheet = IOFactory::load($file->getPathname());
        $sheetRows = $spreadsheet->getActiveSheet()->toArray();

        $this->assertSame(
            ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'correct_option', 'explanation'],
            $sheetRows[0]
        );
        $this->assertSame(
            ['Contoh soal ekspor', 'Opsi 1', 'Opsi 2', null, null, null, 'b', 'Penjelasan contoh'],
            $sheetRows[1]
        );
    }

    public function test_other_teacher_and_student_cannot_export_question_bank(): void
    {
        $this->actingAs($this->otherTeacher)
            ->get(route('teacher.questionBankQuestions.export', $this->bank->id))
            ->assertForbidden();

        $this->actingAs($this->student)
            ->get(route('teacher.questionBankQuestions.export', $this->bank->id))
            ->assertForbidden();
    }
}
