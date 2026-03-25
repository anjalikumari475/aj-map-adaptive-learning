import jsPDF from "jspdf";

export function generateCertificatePDF(options: {
  userName: string;
  courseName: string;
  issuedAt: string;
}): void {
  const { userName, courseName, issuedAt } = options;
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, w, h, "F");

  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(3);
  doc.rect(10, 10, w - 20, h - 20);

  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, w - 28, h - 28);

  doc.setFontSize(36);
  doc.setTextColor(6, 182, 212);
  doc.setFont("helvetica", "bold");
  doc.text("AJ MAP", w / 2, 45, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text("ADAPTIVE LEARNING PLATFORM", w / 2, 55, { align: "center" });

  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(40, 62, w - 40, 62);

  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Certificate of Completion", w / 2, 82, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text("This is to certify that", w / 2, 98, { align: "center" });

  doc.setFontSize(30);
  doc.setTextColor(6, 182, 212);
  doc.setFont("helvetica", "bold");
  doc.text(userName, w / 2, 118, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text("has successfully completed the course", w / 2, 132, { align: "center" });

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(courseName, w / 2, 150, { align: "center" });

  const dateStr = new Date(issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(12);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text(`Issued on: ${dateStr}`, w / 2, 168, { align: "center" });

  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(40, 178, w - 40, 178);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("Powered by AJ Map — Adaptive Learning Platform", w / 2, 188, { align: "center" });

  doc.save(`AJMap_Certificate_${courseName.replace(/\s+/g, "_")}.pdf`);
}
