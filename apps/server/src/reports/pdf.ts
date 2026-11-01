import { existsSync } from 'node:fs';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { ClassReport } from './classReport.js';

const here = path.dirname(fileURLToPath(import.meta.url));
// Geliştirmede kaynak ağacı, paketlenmiş (Vercel) fonksiyonda paketin yanındaki assets klasörü.
const fontDir = [path.resolve(here, '../../assets/fonts'), path.resolve(here, 'assets/fonts'), path.resolve(process.cwd(), 'assets/fonts')]
  .find((d) => existsSync(path.join(d, 'DejaVuSans.ttf'))) ?? path.resolve(here, '../../assets/fonts');
const FONT = path.join(fontDir, 'DejaVuSans.ttf');
const BOLD = path.join(fontDir, 'DejaVuSans-Bold.ttf');

/** Sınıf raporu PDF'i (Türkçe karakterler için DejaVu Sans gömülür). */
export function reportToPdf(r: ClassReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `YarınLab sınıf raporu – ${r.classroom.name}`, Author: 'YarınLab' } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.registerFont('r', FONT).registerFont('b', BOLD);
    const h = (t: string) => { doc.moveDown(0.6).font('b').fontSize(13).fillColor('#12263a').text(t).moveDown(0.2).font('r').fontSize(9.5).fillColor('#222'); };
    const line = (t: string) => doc.text(t, { width: 515 });
    const table = (head: string[], rows: (string | number)[][], widths: number[]) => {
      const draw = (cells: (string | number)[], bold: boolean) => {
        if (doc.y > 760) doc.addPage();
        const y = doc.y; let x = 40;
        doc.font(bold ? 'b' : 'r').fontSize(8.5);
        let maxH = 0;
        cells.forEach((c, i) => { const hgt = doc.heightOfString(String(c), { width: widths[i] - 4 }); maxH = Math.max(maxH, hgt); doc.text(String(c), x, y, { width: widths[i] - 4 }); x += widths[i]; });
        doc.y = y + maxH + 3; doc.x = 40;
      };
      draw(head, true);
      rows.forEach((r2) => draw(r2, false));
      doc.font('r').fontSize(9.5);
    };
    doc.font('b').fontSize(18).fillColor('#2e9e6b').text('YarınLab — Sınıf Raporu');
    doc.font('r').fontSize(10).fillColor('#222').text(`Sınıf: ${r.classroom.name} · Öğrenci: ${r.studentsCount} · Oluşturma: ${new Date(r.generatedAt).toLocaleString('tr-TR')}`);
    h('Modül ilerlemesi (Simülasyon)');
    table(['Modül', 'Başlayan %', 'Bitiren %', 'Ort. görev', 'Ön test %', 'Son test %', 'n'], r.modules.map((m) => [m.name, m.startedPct, m.completedPct, m.avgDone, m.pre ?? '–', m.post ?? '–', m.prePostN]), [130, 65, 60, 65, 65, 65, 40]);
    h('Öğrenme kazanımları (oyun puanı + değerlendirme)');
    const outs = r.outcomes.filter((o) => o.evidence);
    if (!outs.length) line('Henüz kanıt yok.');
    else table(['Kazanım', 'Düzey %', 'Kanıt'], outs.map((o) => [`${o.id} ${o.text}`, o.pct ?? '–', o.evidence]), [390, 60, 50]);
    h('Özet');
    line(`Katılan öğrenci ${r.kpis.students} · oynamaya başlayan ${r.kpis.activeStudents} · tamamlanan görev ${r.kpis.completedTasks} · ön+son test çifti ${r.kpis.prePostPairs} · ort. gerekçe ${r.kpis.avgReasoning ?? '–'}`);
    h('Rubrik dağılımı (öğrenci sayısı)');
    table(['Ölçüt', 'Başlangıç', 'Gelişen', 'Yetkin'], r.rubric.map((x) => [x.name, x.counts.baslangic, x.counts.gelisen, x.counts.yetkin]), [215, 100, 100, 100]);
    h('Kavram yanılgısı raporu');
    if (!r.misconceptions.length) line('Yanılgı işaretli seçim yok.');
    else table(['Yanılgı', 'Görev', 'Öğrenci', 'Gerekçesiz', 'Sonra düzeltti'], r.misconceptions.slice(0, 15).map((m) => [m.text, m.title, m.students, m.withoutReasoning, m.laterCorrected]), [190, 160, 50, 55, 55]);
    h('Ödevler');
    if (!r.assignments.length) line('Ödev yok.');
    else table(['Ödev', 'Son tarih', 'Tamamlayan', '%', 'Gecikmiş'], r.assignments.map((a) => [a.title, a.dueAt ? new Date(a.dueAt).toLocaleDateString('tr-TR') : '–', `${a.completed}/${a.target}`, a.pct, a.overdue ? 'evet' : 'hayır']), [220, 80, 80, 50, 70]);
    h('Gerçek dünya görevleri (Ölçülmüş)');
    const rw = r.realWorld.filter((x) => x.nBaseline || x.nFollowup);
    if (!rw.length) line('Henüz ölçüm girilmedi.');
    else table(['Etkinlik', 'Birim', 'Başlangıç', 'Sonuç', 'Fark', 'g/öğr./gün', 'n'], rw.map((x) => [x.title, x.unit, x.baseline ?? '–', x.followup ?? '–', x.change ?? '–', x.perStudent ? `${x.perStudent.baselineGps ?? '–'}→${x.perStudent.followupGps ?? '–'}` : '', `${x.nBaseline}/${x.nFollowup}`]), [170, 40, 60, 55, 45, 95, 50]);
    h('Öğrenci ilerlemesi');
    table(['Takma ad', 'Grup', 'Görev', 'Modül', 'Ort. puan', 'Gerekçe', 'Denge', 'Yanılgı'], r.students.map((s) => [s.nickname, s.group ?? '–', s.completedTasks, s.modulesPlayed, s.avgTotal ?? '–', s.avgReasoning ?? '–', s.avgBalance ?? '–', s.misconceptionChoices]), [110, 70, 45, 45, 60, 60, 55, 55]);
    h('Notlar');
    r.notes.forEach((n) => line(`• ${n}`));
    doc.end();
  });
}
