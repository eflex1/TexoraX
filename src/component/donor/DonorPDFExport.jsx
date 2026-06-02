import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileDown, Loader2, CheckCircle2, Globe, Users, TrendingUp, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

function formatNGN(val) {
  if (!val) return '₦0';
  if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `₦${(val / 1_000).toFixed(0)}k`;
  return `₦${val.toLocaleString()}`;
}

export default function DonorPDFExport({ programmes = [], disbursements = [], alumni = [] }) {
  const [show, setShow] = useState(false);
  const [generating, setGenerating] = useState(false);

  const totalCommitted = programmes.reduce((s, p) => s + (p.total_budget || 0), 0);
  const totalDisbursed = disbursements.filter(d => d.status === 'completed').reduce((s, d) => s + (d.amount || 0), 0);
  const totalJobs = alumni.reduce((s, a) => s + (a.jobs_created || 0), 0);
  const totalFundingRaised = alumni.reduce((s, a) => s + (a.funding_raised || 0), 0);
  const activeAlumni = alumni.filter(a => a.current_status === 'active').length;

  const allSdgs = programmes.flatMap(p => p.sdg_alignments || []);
  const sdgCounts = allSdgs.reduce((acc, sdg) => { acc[sdg] = (acc[sdg] || 0) + 1; return acc; }, {});
  const topSdgs = Object.entries(sdgCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const generatePDF = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 300));

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const margin = 18;
    const contentW = W - margin * 2;
    let y = 0;

    // ── Header band ──────────────────────────────────────────
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, W, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('NexoraX', margin, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Donor Impact Report', margin, 24);
    doc.setFontSize(8);
    doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, margin, 31);
    // Right side logo area
    doc.setFontSize(8);
    doc.text('CONFIDENTIAL', W - margin - 22, 20);
    y = 48;

    // ── Executive Summary ─────────────────────────────────────
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, y);
    y += 2;
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.7);
    doc.line(margin, y, margin + 40, y);
    y += 6;

    // 4-up stat boxes
    const statBoxW = (contentW - 9) / 4;
    const stats = [
      { label: 'Programmes', value: String(programmes.length) },
      { label: 'Committed', value: formatNGN(totalCommitted) },
      { label: 'Disbursed', value: formatNGN(totalDisbursed) },
      { label: 'Alumni', value: String(alumni.length) },
    ];
    stats.forEach((s, i) => {
      const x = margin + i * (statBoxW + 3);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, statBoxW, 22, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, statBoxW, 22, 2, 2, 'S');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(s.value, x + statBoxW / 2, y + 12, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(s.label, x + statBoxW / 2, y + 18, { align: 'center' });
    });
    y += 30;

    // ── Alumni Impact ─────────────────────────────────────────
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Alumni Impact Metrics', margin, y);
    y += 2;
    doc.setDrawColor(99, 102, 241);
    doc.line(margin, y, margin + 50, y);
    y += 7;

    const impactStats = [
      { label: 'Jobs Created', value: String(totalJobs) },
      { label: 'Follow-on Funding Raised', value: formatNGN(totalFundingRaised) },
      { label: 'Active Companies', value: String(activeAlumni) },
    ];
    const impactW = (contentW - 6) / 3;
    impactStats.forEach((s, i) => {
      const x = margin + i * (impactW + 3);
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(x, y, impactW, 18, 2, 2, 'F');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 163, 74);
      doc.text(s.value, x + impactW / 2, y + 9, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(s.label, x + impactW / 2, y + 15, { align: 'center' });
    });
    y += 26;

    // Alumni table
    if (alumni.length > 0) {
      const topAlumni = alumni.slice(0, 8);
      const cols = ['Company', 'Programme', 'Cohort', 'Jobs', 'Funding Raised'];
      const colWidths = [45, 45, 22, 16, 32];

      // Header
      doc.setFillColor(15, 23, 42);
      let cx = margin;
      cols.forEach((col, i) => {
        doc.rect(cx, y, colWidths[i], 8, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(col, cx + 2, y + 5.5);
        cx += colWidths[i];
      });
      y += 8;

      topAlumni.forEach((al, ri) => {
        if (ri % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, contentW, 7, 'F');
        }
        cx = margin;
        const row = [
          al.organization_name || al.name || '—',
          al.programme_name || '—',
          al.cohort || '—',
          String(al.jobs_created || 0),
          formatNGN(al.funding_raised || 0),
        ];
        row.forEach((val, i) => {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          const truncated = val.length > 22 ? val.slice(0, 21) + '…' : val;
          doc.text(truncated, cx + 2, y + 4.8);
          cx += colWidths[i];
        });
        // row border
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, y + 7, margin + contentW, y + 7);
        y += 7;
      });
      y += 8;
    }

    // ── Programmes ────────────────────────────────────────────
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Funded Programmes', margin, y);
    y += 2;
    doc.setDrawColor(99, 102, 241);
    doc.line(margin, y, margin + 48, y);
    y += 7;

    programmes.forEach((p, pi) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentW, 18, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(p.name || 'Untitled', margin + 4, y + 6);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${p.category || '—'} · ${p.status || '—'}`, margin + 4, y + 12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text(formatNGN(p.total_budget), margin + contentW - 4, y + 9, { align: 'right' });
      y += 22;
    });

    // ── SDG Alignment ─────────────────────────────────────────
    if (topSdgs.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      y += 4;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('SDG Portfolio Alignment', margin, y);
      y += 2;
      doc.setDrawColor(99, 102, 241);
      doc.line(margin, y, margin + 58, y);
      y += 7;

      const sdgW = (contentW - 5 * 3) / 3;
      topSdgs.forEach(([sdg, count], i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = margin + col * (sdgW + 3);
        const yPos = y + row * 20;
        doc.setFillColor(238, 242, 255);
        doc.roundedRect(x, yPos, sdgW, 16, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(99, 102, 241);
        doc.text(sdg, x + sdgW / 2, yPos + 7, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`${count} programme${count > 1 ? 's' : ''}`, x + sdgW / 2, yPos + 13, { align: 'center' });
      });
      y += Math.ceil(topSdgs.length / 3) * 20 + 8;
    }

    // ── Disbursement Summary ──────────────────────────────────
    if (disbursements.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Disbursement Records', margin, y);
      y += 2;
      doc.setDrawColor(99, 102, 241);
      doc.line(margin, y, margin + 55, y);
      y += 7;

      const dcols = ['Recipient', 'Programme', 'Amount', 'Status', 'Date'];
      const dwidths = [45, 45, 28, 22, 28];
      doc.setFillColor(15, 23, 42);
      let dcx = margin;
      dcols.forEach((col, i) => {
        doc.rect(dcx, y, dwidths[i], 8, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(col, dcx + 2, y + 5.5);
        dcx += dwidths[i];
      });
      y += 8;

      disbursements.slice(0, 10).forEach((d, ri) => {
        if (y > 270) { doc.addPage(); y = 20; }
        if (ri % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y, contentW, 7, 'F'); }
        dcx = margin;
        const drow = [
          d.recipient_name || '—',
          d.programme_id || '—',
          formatNGN(d.amount),
          d.status || '—',
          d.scheduled_date || '—',
        ];
        drow.forEach((val, i) => {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          doc.text((val.length > 18 ? val.slice(0, 17) + '…' : val), dcx + 2, y + 4.8);
          dcx += dwidths[i];
        });
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, y + 7, margin + contentW, y + 7);
        y += 7;
      });
    }

    // ── Footer on every page ──────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 285, W, 12, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('NexoraX Platform — Confidential Donor Report', margin, 291);
      doc.text(`Page ${i} of ${pageCount}`, W - margin, 291, { align: 'right' });
    }

    doc.save(`NexoraX_Donor_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    setGenerating(false);
    setShow(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShow(true)} className="gap-2">
        <FileDown className="h-4 w-4" /> Export Donor Report
      </Button>

      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Donor Impact Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Generate a professional PDF summarising grant disbursements, alumni outcomes, and SDG alignment for your donors.
            </p>

            {/* Preview summary */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Wallet, label: 'Programmes', value: programmes.length },
                { icon: TrendingUp, label: 'Disbursed', value: formatNGN(disbursements.filter(d => d.status === 'completed').reduce((s, d) => s + (d.amount || 0), 0)) },
                { icon: Users, label: 'Alumni', value: alumni.length },
                { icon: Globe, label: 'SDG Goals', value: new Set(programmes.flatMap(p => p.sdg_alignments || [])).size },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-primary space-y-1">
              <p className="font-semibold">Report includes:</p>
              <p>• Executive summary with portfolio metrics</p>
              <p>• Alumni impact table (jobs, funding raised)</p>
              <p>• Funded programmes breakdown</p>
              <p>• SDG portfolio alignment grid</p>
              <p>• Disbursement records</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShow(false)}>Cancel</Button>
            <Button onClick={generatePDF} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {generating ? 'Generating…' : 'Download PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
