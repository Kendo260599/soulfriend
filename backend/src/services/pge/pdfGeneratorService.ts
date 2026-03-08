/**
 * PDF GENERATOR SERVICE
 * 
 * PGE Phase 14 — Advanced Clinical Reporting
 * Generates professional clinical PDF reports using PDFKit.
 * 
 * Layout:
 * - Cover page with report metadata
 * - Table of contents
 * - 10 clinical sections with tables, charts (text-based), and metrics
 * - Vietnamese labels throughout
 * 
 * @module services/pge/pdfGeneratorService
 * @version 1.0.0 — PGE Phase 14
 */

import PDFDocument from 'pdfkit';
import { ClinicalReport } from './clinicalReportService';

// ────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────
const COLORS = {
  primary: '#1a237e',
  secondary: '#283593',
  accent: '#4285f4',
  danger: '#d32f2f',
  warning: '#f57c00',
  success: '#2e7d32',
  safe: '#4caf50',
  caution: '#ff9800',
  risk: '#f44336',
  critical: '#b71c1c',
  black_hole: '#000000',
  text: '#212121',
  textLight: '#616161',
  border: '#bdbdbd',
  bgLight: '#f5f5f5',
};

const ZONE_LABELS: Record<string, string> = {
  safe: 'An toàn',
  caution: 'Cảnh báo',
  risk: 'Rủi ro',
  critical: 'Nghiêm trọng',
  black_hole: 'Hố đen',
};

const ZONE_COLORS: Record<string, string> = {
  safe: COLORS.safe,
  caution: COLORS.caution,
  risk: COLORS.risk,
  critical: COLORS.critical,
  black_hole: COLORS.black_hole,
};

const DIM_LABELS: Record<string, string> = {
  stress: 'Căng thẳng', anxiety: 'Lo âu', sadness: 'Buồn', anger: 'Tức giận',
  loneliness: 'Cô đơn', shame: 'Xấu hổ', guilt: 'Tội lỗi', hopelessness: 'Vô vọng',
  hope: 'Hy vọng', calmness: 'Bình tĩnh', joy: 'Vui vẻ', gratitude: 'Biết ơn',
  selfWorth: 'Giá trị bản thân', selfEfficacy: 'Năng lực bản thân', rumination: 'Suy nghĩ lặp lại', cognitiveClarity: 'Tư duy rõ ràng',
  avoidance: 'Né tránh', helpSeeking: 'Tìm kiếm giúp đỡ', socialEngagement: 'Giao tiếp xã hội', motivation: 'Động lực',
  trustInOthers: 'Tin người khác', perceivedSupport: 'Hỗ trợ cảm nhận', fearOfJudgment: 'Sợ đánh giá',
  mentalFatigue: 'Mệt mỏi tinh thần',
};

const GROUP_LABELS: Record<string, string> = {
  negativeEmotions: 'Cảm xúc tiêu cực',
  positiveEmotions: 'Cảm xúc tích cực',
  cognition: 'Nhận thức',
  behavioral: 'Hành vi',
  social: 'Xã hội',
  energy: 'Năng lượng',
};

const INTERVENTION_LABELS: Record<string, string> = {
  cognitive_reframing: 'Tái cấu trúc nhận thức',
  social_connection: 'Kết nối xã hội',
  behavioral_activation: 'Kích hoạt hành vi',
  emotional_regulation: 'Điều chỉnh cảm xúc',
};

// ────────────────────────────────────────────────
// PDF Generator
// ────────────────────────────────────────────────

class PDFGeneratorService {

  generatePDF(report: ClinicalReport): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
      info: {
        Title: `Báo Cáo Lâm Sàng - ${report.userId}`,
        Author: 'SoulFriend PGE System',
        Subject: 'Clinical Psychological Report',
        Creator: 'SoulFriend PGE v14',
      },
    });

    // Cover page
    this.renderCover(doc, report);

    // Table of contents
    doc.addPage();
    this.renderTableOfContents(doc);

    // Sections
    doc.addPage();
    this.renderOverview(doc, report.sections.overview);

    doc.addPage();
    this.renderEBHTrend(doc, report.sections.ebhTrend);

    doc.addPage();
    this.renderZoneDistribution(doc, report.sections.zoneDistribution);

    doc.addPage();
    this.renderEmotionalProfile(doc, report.sections.emotionalProfile);

    doc.addPage();
    this.renderRiskAssessment(doc, report.sections.riskAssessment);

    doc.addPage();
    this.renderTreatmentProgress(doc, report.sections.treatmentProgress);

    doc.addPage();
    this.renderResilienceProfile(doc, report.sections.resilienceProfile);

    doc.addPage();
    this.renderNarrativeInsights(doc, report.sections.narrativeInsights);

    doc.addPage();
    this.renderInterventionSummary(doc, report.sections.interventionSummary);

    doc.addPage();
    this.renderRecommendations(doc, report.sections.recommendations);

    // Footer on all pages
    this.addFooters(doc, report);

    return doc;
  }

  // ─── Cover Page ──────────────────────────────

  private renderCover(doc: PDFKit.PDFDocument, report: ClinicalReport): void {
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1a237e');

    doc.fontSize(36).fillColor('#ffffff')
      .text('BAO CAO LAM SANG', 50, 200, { align: 'center', width: doc.page.width - 100 });

    doc.fontSize(16).fillColor('#bbdefb')
      .text('Psychological Gravity Engine', 50, 260, { align: 'center', width: doc.page.width - 100 });

    doc.moveTo(150, 310).lineTo(doc.page.width - 150, 310).strokeColor('#64b5f6').lineWidth(2).stroke();

    doc.fontSize(14).fillColor('#e3f2fd')
      .text(`Ma benh nhan: ${report.userId}`, 50, 350, { align: 'center', width: doc.page.width - 100 })
      .text(`Thoi gian: ${this.fmtDate(report.periodStart)} - ${this.fmtDate(report.periodEnd)}`, 50, 380, { align: 'center', width: doc.page.width - 100 })
      .text(`Ngay tao: ${this.fmtDate(report.generatedAt)}`, 50, 410, { align: 'center', width: doc.page.width - 100 })
      .text(`Ma bao cao: ${report.reportId}`, 50, 440, { align: 'center', width: doc.page.width - 100 });

    doc.fontSize(10).fillColor('#90caf9')
      .text('SoulFriend - He thong ho tro tam ly thong minh', 50, doc.page.height - 80, { align: 'center', width: doc.page.width - 100 })
      .text('TAI LIEU MAT - CHI DUNG CHO CHUYEN GIA', 50, doc.page.height - 60, { align: 'center', width: doc.page.width - 100 });
  }

  // ─── Table of Contents ───────────────────────

  private renderTableOfContents(doc: PDFKit.PDFDocument): void {
    this.sectionHeader(doc, 'MUC LUC');
    const items = [
      '1. Tong Quan Benh Nhan',
      '2. Xu Huong EBH & ES',
      '3. Phan Bo Vung Tam Ly',
      '4. Ho So Cam Xuc',
      '5. Danh Gia Rui Ro',
      '6. Tien Trinh Dieu Tri',
      '7. Ho So Phuc Hoi',
      '8. Phan Tich Ngon Ngu',
      '9. Tong Ket Can Thiep',
      '10. Khuyen Nghi',
    ];
    let y = doc.y + 20;
    for (const item of items) {
      doc.fontSize(13).fillColor(COLORS.text).text(item, 70, y);
      y += 30;
    }
  }

  // ─── Section 1: Overview ─────────────────────

  private renderOverview(doc: PDFKit.PDFDocument, section: any): void {
    this.sectionHeader(doc, '1. TONG QUAN BENH NHAN');
    const d = section.data;

    const rows = [
      ['Ma benh nhan', d.userId],
      ['Thoi gian bao cao', `${d.reportPeriodDays} ngay`],
      ['Tong so phien', `${d.totalSessions}`],
      ['Tong so tin nhan', `${d.totalMessages}`],
      ['Phien dau tien', d.firstSessionDate ? this.fmtDate(d.firstSessionDate) : 'N/A'],
      ['Phien cuoi', d.lastSessionDate ? this.fmtDate(d.lastSessionDate) : 'N/A'],
      ['Vung hien tai', ZONE_LABELS[d.currentZone] || d.currentZone],
      ['EBH hien tai', `${(d.currentEBH * 100).toFixed(1)}%`],
      ['Trang thai hut', d.currentAttractor],
      ['Cam xuc chinh', DIM_LABELS[d.currentDominantEmotion] || d.currentDominantEmotion],
    ];

    this.renderTable(doc, rows);
  }

  // ─── Section 2: EBH Trend ────────────────────

  private renderEBHTrend(doc: PDFKit.PDFDocument, section: any): void {
    this.sectionHeader(doc, '2. XU HUONG EBH & ES');
    const d = section.data;

    const trendLabel = d.ebh.trend === 'improving' ? 'Cai thien'
      : d.ebh.trend === 'worsening' ? 'Xau di'
      : d.ebh.trend === 'stable' ? 'On dinh' : 'Chua du du lieu';

    const rows = [
      ['So diem du lieu', `${d.dataPoints}`],
      ['EBH hien tai', `${(d.ebh.current * 100).toFixed(1)}%`],
      ['EBH trung binh', `${(d.ebh.average * 100).toFixed(1)}%`],
      ['EBH thap nhat', `${(d.ebh.min * 100).toFixed(1)}%`],
      ['EBH cao nhat', `${(d.ebh.max * 100).toFixed(1)}%`],
      ['Xu huong', trendLabel],
      ['ES trung binh', `${(d.es.average * 100).toFixed(1)}%`],
    ];
    this.renderTable(doc, rows);

    // Weekly chart (text-based bar chart)
    if (d.weeklyAverages?.length > 0) {
      doc.moveDown(1);
      doc.fontSize(11).fillColor(COLORS.secondary).text('Trung binh EBH theo tuan:', { underline: true });
      doc.moveDown(0.5);

      for (const w of d.weeklyAverages) {
        const barLen = Math.round(w.avg * 40);
        const bar = '█'.repeat(barLen) + '░'.repeat(40 - barLen);
        const color = w.avg > 0.7 ? COLORS.danger : w.avg > 0.5 ? COLORS.warning : COLORS.success;
        doc.fontSize(9).fillColor(COLORS.text)
          .text(`Tuan ${w.week}: `, { continued: true })
          .fillColor(color)
          .text(`${bar} ${(w.avg * 100).toFixed(1)}%`);
      }
    }
  }

  // ─── Section 3: Zone Distribution ────────────

  private renderZoneDistribution(doc: PDFKit.PDFDocument, section: any): void {
    this.sectionHeader(doc, '3. PHAN BO VUNG TAM LY');
    const d = section.data;

    doc.fontSize(11).fillColor(COLORS.text)
      .text(`Tong so trang thai: ${d.totalStates} | Chuyen vung: ${d.transitions} lan`);
    doc.moveDown(0.5);

    // Visual zone bars
    const zones = ['safe', 'caution', 'risk', 'critical', 'black_hole'];
    for (const z of zones) {
      const pct = d.percentages[z] || 0;
      const count = d.counts[z] || 0;
      const barLen = Math.round(pct / 2.5);
      const bar = '█'.repeat(barLen) + '░'.repeat(40 - barLen);

      doc.fontSize(10).fillColor(ZONE_COLORS[z] || COLORS.text)
        .text(`${(ZONE_LABELS[z] || z).padEnd(15)} `, { continued: true })
        .text(`${bar} ${pct}% (${count})`, { continued: false });
    }

    doc.moveDown(1);
    doc.fontSize(11).fillColor(COLORS.text)
      .text(`Vung pho bien nhat: ${ZONE_LABELS[d.mostFrequentZone] || d.mostFrequentZone}`);
  }

  // ─── Section 4: Emotional Profile ────────────

  private renderEmotionalProfile(doc: PDFKit.PDFDocument, section: any): void {
    this.sectionHeader(doc, '4. HO SO CAM XUC');
    const d = section.data;

    if (d.message) {
      doc.fontSize(11).fillColor(COLORS.textLight).text(d.message);
      return;
    }

    // Group averages
    doc.fontSize(12).fillColor(COLORS.secondary).text('Trung binh nhom:', { underline: true });
    doc.moveDown(0.5);

    if (d.groupAverages) {
      for (const [group, val] of Object.entries(d.groupAverages)) {
        const v = val as number;
        const barLen = Math.round(v * 40);
        const bar = '█'.repeat(barLen) + '░'.repeat(40 - barLen);
        const color = group === 'negativeEmotions' ? (v > 0.5 ? COLORS.danger : COLORS.success)
          : (v > 0.5 ? COLORS.success : COLORS.warning);
        doc.fontSize(10).fillColor(COLORS.text)
          .text(`${(GROUP_LABELS[group] || group).padEnd(22)} `, { continued: true })
          .fillColor(color)
          .text(`${bar} ${(v * 100).toFixed(1)}%`);
      }
    }

    // Top emotions
    if (d.topDominantEmotions?.length) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor(COLORS.secondary).text('Top cam xuc chinh:', { underline: true });
      doc.moveDown(0.5);
      for (const e of d.topDominantEmotions) {
        doc.fontSize(10).fillColor(COLORS.text)
          .text(`  • ${DIM_LABELS[e.emotion] || e.emotion}: ${e.count} lan (${e.percentage}%)`);
      }
    }

    // High risk dimensions
    if (d.highRiskDimensions?.length) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor(COLORS.danger).text('Chieu rui ro cao (>60%):', { underline: true });
      doc.moveDown(0.5);
      for (const dim of d.highRiskDimensions) {
        doc.fontSize(10).fillColor(COLORS.danger)
          .text(`  ⚠ ${DIM_LABELS[dim.dimension] || dim.dimension}: ${(dim.averageValue * 100).toFixed(1)}%`);
      }
    }
  }

  // ─── Section 5: Risk Assessment ──────────────

  private renderRiskAssessment(doc: PDFKit.PDFDocument, section: any): void {
    this.sectionHeader(doc, '5. DANH GIA RUI RO');
    const d = section.data;

    const riskLabels: Record<string, string> = {
      high: 'CAO', moderate: 'TRUNG BINH', low: 'THAP', minimal: 'TOI THIEU',
    };
    const riskColors: Record<string, string> = {
      high: COLORS.danger, moderate: COLORS.warning, low: COLORS.accent, minimal: COLORS.success,
    };

    // Risk level badge
    doc.fontSize(14).fillColor(riskColors[d.riskLevel] || COLORS.text)
      .text(`Muc rui ro: ${riskLabels[d.riskLevel] || d.riskLevel}`, { underline: true });
    doc.moveDown(0.5);

    const rows = [
      ['EBH hien tai', `${(d.currentEBH * 100).toFixed(1)}%`],
      ['Vung hien tai', ZONE_LABELS[d.currentZone] || d.currentZone],
      ['EBH trung binh gan day', `${(d.recentAverageEBH * 100).toFixed(1)}%`],
      ['So lan khung hoang', `${d.crisisEpisodes}`],
      ['Khung hoang gan nhat', d.lastCrisisDate ? this.fmtDate(d.lastCrisisDate) : 'Chua co'],
    ];
    this.renderTable(doc, rows);

    // Forecast
    if (d.forecast && !d.forecast.message) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor(COLORS.secondary).text('Du bao:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor(COLORS.text)
        .text(`  Muc canh bao: ${d.forecast.alertLevel}`)
        .text(`  Chi so CSD: ${d.forecast.csdIndex != null ? d.forecast.csdIndex.toFixed(3) : 'N/A'}`);
    }
  }

  // ─── Section 6: Treatment Progress ───────────

  private renderTreatmentProgress(doc: PDFKit.PDFDocument, section: any): void {
    this.sectionHeader(doc, '6. TIEN TRINH DIEU TRI');
    const d = section.data;

    if (d.message) {
      doc.fontSize(11).fillColor(COLORS.textLight).text(d.message);
      return;
    }

    doc.fontSize(11).fillColor(COLORS.text)
      .text(`Giai doan: ${d.currentPhase}`)
      .text(`Tien do tong: ${Math.round((d.overallProgress || 0) * 100)}%`)
      .text(`Tan suat phien: ${d.sessionFrequency}`);

    if (d.dischargeReadiness != null) {
      doc.text(`San sang xuat vien: ${Math.round(d.dischargeReadiness * 100)}%`);
    }

    // Goals
    if (d.goals?.length) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor(COLORS.secondary).text('Muc tieu dieu tri:', { underline: true });
      doc.moveDown(0.5);
      for (const g of d.goals) {
        const pct = Math.round((g.progress || 0) * 100);
        const barLen = Math.round(pct / 2.5);
        const bar = '█'.repeat(barLen) + '░'.repeat(40 - barLen);
        doc.fontSize(10).fillColor(COLORS.text)
          .text(`  ${g.name}: `, { continued: true })
          .fillColor(pct > 70 ? COLORS.success : pct > 40 ? COLORS.warning : COLORS.danger)
          .text(`${bar} ${pct}%`);
      }
    }
  }

  // ─── Section 7: Resilience Profile ───────────

  private renderResilienceProfile(doc: PDFKit.PDFDocument, section: any): void {
    this.sectionHeader(doc, '7. HO SO PHUC HOI');
    const d = section.data;

    if (d.message) {
      doc.fontSize(11).fillColor(COLORS.textLight).text(d.message);
      return;
    }

    const rows = [
      ['Chi so phuc hoi', `${Math.round((d.resilienceIndex || 0) * 100)}%`],
      ['Giai doan tang truong', d.growthPhase || 'N/A'],
      ['Quy dao', d.trajectory || 'N/A'],
    ];
    this.renderTable(doc, rows);

    if (d.protectiveFactors?.length) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor(COLORS.secondary).text('Yeu to bao ve:', { underline: true });
      doc.moveDown(0.5);
      for (const f of d.protectiveFactors.slice(0, 5)) {
        const label = typeof f === 'string' ? f : (f.name || f.factor || JSON.stringify(f));
        doc.fontSize(10).fillColor(COLORS.success).text(`  ✓ ${label}`);
      }
    }

    if (d.milestones?.length) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor(COLORS.secondary).text('Cot moc dat duoc:', { underline: true });
      doc.moveDown(0.5);
      for (const m of d.milestones) {
        const label = typeof m === 'string' ? m : (m.name || m.milestone || JSON.stringify(m));
        doc.fontSize(10).fillColor(COLORS.accent).text(`  ★ ${label}`);
      }
    }
  }

  // ─── Section 8: Narrative Insights ───────────

  private renderNarrativeInsights(doc: PDFKit.PDFDocument, section: any): void {
    this.sectionHeader(doc, '8. PHAN TICH NGON NGU');
    const d = section.data;

    if (d.message) {
      doc.fontSize(11).fillColor(COLORS.textLight).text(d.message);
      return;
    }

    if (d.keyThemes?.length) {
      doc.fontSize(12).fillColor(COLORS.secondary).text('Chu de chinh:', { underline: true });
      doc.moveDown(0.5);
      for (const t of d.keyThemes) {
        const label = typeof t === 'string' ? t : (t.theme || t.name || JSON.stringify(t));
        doc.fontSize(10).fillColor(COLORS.text).text(`  • ${label}`);
      }
    }

    if (d.riskTopics?.length) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor(COLORS.danger).text('Chu de rui ro:', { underline: true });
      doc.moveDown(0.5);
      for (const r of d.riskTopics) {
        const label = typeof r === 'string' ? r : (r.topic || r.name || JSON.stringify(r));
        doc.fontSize(10).fillColor(COLORS.danger).text(`  ⚠ ${label}`);
      }
    }

    if (d.overallSentiment && d.overallSentiment !== 'N/A') {
      doc.moveDown(1);
      doc.fontSize(11).fillColor(COLORS.text).text(`Cam xuc tong the: ${d.overallSentiment}`);
    }
  }

  // ─── Section 9: Intervention Summary ─────────

  private renderInterventionSummary(doc: PDFKit.PDFDocument, section: any): void {
    this.sectionHeader(doc, '9. TONG KET CAN THIEP');
    const d = section.data;

    doc.fontSize(11).fillColor(COLORS.text)
      .text(`Tong so can thiep: ${d.totalInterventions}`);

    if (d.totalInterventions === 0) {
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(COLORS.textLight).text(d.message || 'Chua co can thiep');
      return;
    }

    doc.text(`Hieu qua EBH trung binh: ${(d.overallEBHEffect * 100).toFixed(1)}%`);
    doc.text(`Loai hieu qua nhat: ${INTERVENTION_LABELS[d.mostEffectiveType] || d.mostEffectiveType}`);

    if (d.byType?.length) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor(COLORS.secondary).text('Theo loai can thiep:', { underline: true });
      doc.moveDown(0.5);
      for (const t of d.byType) {
        doc.fontSize(10).fillColor(COLORS.text)
          .text(`  ${INTERVENTION_LABELS[t.type] || t.type}: ${t.count} lan, hieu qua ${(t.avgEffectiveness * 100).toFixed(1)}%`);
      }
    }
  }

  // ─── Section 10: Recommendations ─────────────

  private renderRecommendations(doc: PDFKit.PDFDocument, section: any): void {
    this.sectionHeader(doc, '10. KHUYEN NGHI');
    const d = section.data;

    const priorityLabels: Record<string, string> = { high: 'CAO', moderate: 'TRUNG BINH', low: 'THAP' };
    const priorityColors: Record<string, string> = { high: COLORS.danger, moderate: COLORS.warning, low: COLORS.success };

    doc.fontSize(13).fillColor(priorityColors[d.priority] || COLORS.text)
      .text(`Muc uu tien: ${priorityLabels[d.priority] || d.priority}`, { underline: true });
    doc.moveDown(1);

    if (d.recommendations?.length) {
      for (let i = 0; i < d.recommendations.length; i++) {
        doc.fontSize(11).fillColor(COLORS.text)
          .text(`${i + 1}. ${d.recommendations[i]}`);
        doc.moveDown(0.5);
      }
    }
  }

  // ─── Helpers ─────────────────────────────────

  private sectionHeader(doc: PDFKit.PDFDocument, title: string): void {
    doc.rect(50, doc.y, doc.page.width - 100, 30).fill(COLORS.primary);
    doc.fontSize(14).fillColor('#ffffff')
      .text(title, 60, doc.y - 25, { width: doc.page.width - 120 });
    doc.moveDown(1.5);
  }

  private renderTable(doc: PDFKit.PDFDocument, rows: any[][]): void {
    const startX = 60;
    const colWidth = (doc.page.width - 120) / 2;

    for (let i = 0; i < rows.length; i++) {
      const bgColor = i % 2 === 0 ? COLORS.bgLight : '#ffffff';
      const y = doc.y;
      doc.rect(startX - 5, y - 2, colWidth * 2 + 10, 18).fill(bgColor);
      doc.fontSize(10).fillColor(COLORS.text)
        .text(rows[i][0], startX, y, { width: colWidth, continued: false });
      doc.fontSize(10).fillColor(COLORS.secondary)
        .text(rows[i][1], startX + colWidth, y, { width: colWidth });
    }
    doc.moveDown(0.5);
  }

  private addFooters(doc: PDFKit.PDFDocument, report: ClinicalReport): void {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      // Skip cover page
      if (i === 0) continue;

      doc.fontSize(8).fillColor(COLORS.textLight)
        .text(
          `SoulFriend PGE | ${report.reportId} | Trang ${i + 1}/${range.count}`,
          50, doc.page.height - 30,
          { width: doc.page.width - 100, align: 'center' }
        );
    }
  }

  private fmtDate(d: Date | string): string {
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
}

export const pdfGeneratorService = new PDFGeneratorService();
