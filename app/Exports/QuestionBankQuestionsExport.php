<?php

namespace App\Exports;

use App\Models\QuestionBank;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Ekspor seluruh soal pada bank soal dalam format yang identik dengan
 * template import soal (template_import_soal.xlsx / QuestionImport).
 */
class QuestionBankQuestionsExport implements FromArray, WithHeadings, WithTitle, WithColumnWidths, WithStyles
{
    protected QuestionBank $questionBank;
    protected Collection $questions;
    protected int $optionColumnCount;

    public function __construct(QuestionBank $questionBank)
    {
        $this->questionBank = $questionBank;
        $this->questions = $this->questionBank->questions()
            ->with('options')
            ->get();

        $maxOptions = (int) ($this->questions
            ->map(fn ($question) => $question->options->count())
            ->max() ?? 0);

        // Minimal 5 kolom opsi (option_a .. option_e) sesuai template,
        // dan melebar hingga option_z bila ada soal dengan lebih dari 5 opsi.
        $this->optionColumnCount = min(26, max(5, $maxOptions));
    }

    public function title(): string
    {
        return 'Sheet1';
    }

    public function headings(): array
    {
        $headings = ['question'];

        for ($i = 0; $i < $this->optionColumnCount; $i++) {
            $headings[] = 'option_' . chr(ord('a') + $i);
        }

        $headings[] = 'correct_option';
        $headings[] = 'explanation';

        return $headings;
    }

    public function array(): array
    {
        $rows = [];

        foreach ($this->questions as $question) {
            $options = $question->options->values();
            $row = [$question->question_text];
            $correctOption = null;

            for ($i = 0; $i < $this->optionColumnCount; $i++) {
                $option = $options->get($i);
                $row[] = $option?->option_text;

                if ($option && $option->is_correct && $correctOption === null) {
                    $correctOption = chr(ord('a') + $i);
                }
            }

            $row[] = $correctOption;
            $row[] = $question->explanation;

            $rows[] = $row;
        }

        return $rows;
    }

    public function columnWidths(): array
    {
        $widths = [
            'A' => 45,
        ];

        for ($i = 0; $i < $this->optionColumnCount; $i++) {
            $col = Coordinate::stringFromColumnIndex(2 + $i);
            $widths[$col] = 24;
        }

        $correctCol = Coordinate::stringFromColumnIndex(2 + $this->optionColumnCount);
        $explanationCol = Coordinate::stringFromColumnIndex(3 + $this->optionColumnCount);

        $widths[$correctCol] = 16;
        $widths[$explanationCol] = 40;

        return $widths;
    }

    public function styles(Worksheet $sheet): array
    {
        $lastColIndex = 3 + $this->optionColumnCount;
        $lastCol = Coordinate::stringFromColumnIndex($lastColIndex);
        $correctCol = Coordinate::stringFromColumnIndex(2 + $this->optionColumnCount);
        $lastRow = 1 + $this->questions->count();

        $sheet->getRowDimension(1)->setRowHeight(21);

        if ($lastRow >= 2) {
            $sheet->getStyle("A2:{$lastCol}{$lastRow}")->applyFromArray([
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_TOP,
                    'wrapText' => true,
                ],
            ]);
            $sheet->getStyle("{$correctCol}2:{$correctCol}{$lastRow}")->applyFromArray([
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                ],
            ]);
        }

        return [
            "A1:{$lastCol}1" => [
                'font' => [
                    'bold' => true,
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ],
        ];
    }
}
