import type { ExamAttempt, ExamEvaluation } from '../types';
import {
  formatDateTimeId,
  formatDurationText,
  getQuestionScore,
} from './scoring';

export async function exportResultToPdf(
  attempt: ExamAttempt,
  evaluation: ExamEvaluation,
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  // Header band
  doc.setFillColor(24, 104, 219); // Brand Blue #1868DB
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Laporan hasil simulasi CAT SKD CPNS', marginX, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    `${attempt.packageTitle}  |  cpns.imambas.my.id`,
    marginX,
    19.5,
  );

  // Meta information block
  let cursorY = 36;
  doc.setTextColor(41, 42, 46);
  doc.setFontSize(10);

  const metaRows: [string, string][] = [
    ['Paket ujian', attempt.packageTitle],
    ['Formasi acuan', evaluation.formation.label],
    ['Waktu pengerjaan', `${formatDurationText(attempt.elapsedSeconds)} (dari alokasi ${Math.round(attempt.allocatedSeconds / 60)} menit)`],
    ['Mulai & selesai', `${formatDateTimeId(attempt.startedAt)} — ${formatDateTimeId(attempt.finishedAt)}`],
    ['Total skor SKD', `${evaluation.totalScore} / ${evaluation.maxTotalScore}`],
    [
      'Status kelulusan',
      evaluation.passed
        ? 'Memenuhi nilai ambang batas (Passing Grade)'
        : 'Belum memenuhi nilai ambang batas',
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [['Ringkasan ujian', 'Keterangan']],
    body: metaRows,
    margin: { left: marginX, right: marginX },
    styles: {
      fontSize: 9,
      cellPadding: 2.8,
      textColor: [41, 42, 46],
      lineColor: [232, 232, 232],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [240, 241, 242],
      textColor: [41, 42, 46],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold', textColor: [80, 82, 88] },
      1: { cellWidth: contentWidth - 46 },
    },
    theme: 'grid',
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Subtest Breakdown Table
  const subRows = (['TWK', 'TIU', 'TKP'] as const)
    .filter((cat) => evaluation.subtests[cat].totalQuestions > 0)
    .map((cat) => {
      const s = evaluation.subtests[cat];
      const pgLabel = s.passingGrade !== null ? String(s.passingGrade) : '-';
      const statusLabel =
        s.passed === null
          ? 'Latihan fokus'
          : s.passed
            ? 'Memenuhi'
            : 'Belum memenuhi';
      return [
        `${cat} (${s.label})`,
        `${s.answeredCount}/${s.totalQuestions}`,
        `${s.score} / ${s.maxScore}`,
        pgLabel,
        statusLabel,
      ];
    });

  autoTable(doc, {
    startY: cursorY,
    head: [['Subtes SKD', 'Dijawab', 'Skor', 'Ambang batas', 'Status']],
    body: subRows,
    margin: { left: marginX, right: marginX },
    styles: {
      fontSize: 9,
      cellPadding: 2.8,
      textColor: [41, 42, 46],
      lineColor: [232, 232, 232],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [24, 104, 219],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    theme: 'grid',
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // Reason note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 82, 88);
  const reasonLines = doc.splitTextToSize(`Catatan evaluasi: ${evaluation.reason}`, contentWidth);
  doc.text(reasonLines, marginX, cursorY);
  cursorY += reasonLines.length * 4.2 + 5;

  // Detailed Question-by-Question Review
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(41, 42, 46);
  doc.text('Pembahasan setiap soal, jawaban, kunci, dan sumber rujukan', marginX, cursorY);
  cursorY += 4;

  const detailRows = attempt.questions.map((q) => {
    const userChoice = attempt.answers[q.id];
    const earned = getQuestionScore(q, userChoice);
    const userOpt = q.options.find((o) => o.key === userChoice);
    const correctOpt = q.options.find((o) => o.key === q.correctOption);

    const userAnswerText = userOpt
      ? `${userOpt.key}. ${userOpt.text} (Skor: ${earned})`
      : 'Tidak dijawab (Skor: 0)';

    let correctAnswerText = correctOpt
      ? `${correctOpt.key}. ${correctOpt.text} (Skor 5)`
      : q.correctOption;

    if (q.category === 'TKP') {
      const weights = [...q.options]
        .sort((a, b) => b.score - a.score)
        .map((o) => `${o.key}=${o.score}`)
        .join(', ');
      correctAnswerText += `\nBobot TKP: ${weights}`;
    }

    const questionSummary =
      `[${q.category}] ${q.subtopic}\n${q.question}` +
      (q.figureUrl ? '\n(Soal ini memiliki gambar figural pada halaman web)' : '') +
      '\n\nPilihan:\n' +
      q.options.map((o) => `${o.key}. ${o.text}`).join('\n');

    const discussionAndSource =
      `${q.explanation}\n\n` +
      `Sumber soal: ${q.sourceTitle}\n${q.sourceUrl}\n` +
      `Materi terkait: ${q.studyLabel}\n${q.studyUrl}`;

    return [
      String(q.number),
      questionSummary,
      `Jawaban Anda:\n${userAnswerText}\n\nJawaban benar:\n${correctAnswerText}`,
      discussionAndSource,
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    head: [['No.', 'Soal & pilihan', 'Jawaban Anda vs Benar', 'Pembahasan & link sumber']],
    body: detailRows,
    margin: { left: marginX, right: marginX, top: 14, bottom: 14 },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [41, 42, 46],
      lineColor: [232, 232, 232],
      lineWidth: 0.2,
      valign: 'top',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [41, 42, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 66 },
      2: { cellWidth: 44 },
      3: { cellWidth: contentWidth - 120 },
    },
    theme: 'grid',
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 110, 118);
      doc.text(
        `Simulasi CPNS (cpns.imambas.my.id)  —  Halaman ${data.pageNumber} dari ${pageCount}`,
        marginX,
        pageHeight - 7,
      );
    },
  });

  const safeDate = attempt.finishedAt.slice(0, 10);
  const filename = `Hasil-Tryout-CPNS-${attempt.packageId}-${safeDate}.pdf`;
  doc.save(filename);
}
