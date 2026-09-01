import { jsPDF } from 'jspdf';

const ORANGE = '#ff6538';
const DARK = '#26332f';
const MUTED = '#718a82';
const PALE = '#f2f7f5';
const GREEN = '#00a878';

type LoanPdfOptions = {
  loan: any;
  payments: any[];
};

const money = (value: number | undefined | null) =>
  `$${Number(value || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const date = (value: string | undefined | null, withTime = false) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-DO', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }
    : { day: '2-digit', month: 'long', year: 'numeric' });
};

const status = (value: string) => ({
  Paid: 'Completado', Overdue: 'En mora', Cancelled: 'Anulado', Active: 'Activo', Partial: 'Parcial', Pending: 'Pendiente'
}[value] || value || 'Activo');

export function createLoanPdf({ loan, payments }: LoanPdfOptions): File {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const setColor = (hex: string) => pdf.setTextColor(hex);
  const line = (color = '#dce8e3') => { pdf.setDrawColor(color); pdf.line(margin, y, pageWidth - margin, y); };
  const ensure = (height: number) => {
    if (y + height <= pageHeight - 16) return;
    pdf.addPage();
    y = 18;
  };
  const section = (title: string) => {
    ensure(16);
    y += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    setColor(DARK);
    pdf.text(title.toUpperCase(), margin, y);
    y += 7;
  };
  const labelValue = (label: string, value: string, x: number, width: number) => {
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); setColor(MUTED); pdf.text(label.toUpperCase(), x, y);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); setColor(DARK);
    pdf.text(pdf.splitTextToSize(value, width), x, y + 5);
  };

  // Brand header
  pdf.setFillColor(ORANGE); pdf.roundedRect(0, 0, pageWidth, 39, 0, 0, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.setTextColor('#ffffff');
  pdf.text('PrestaControl', margin, 17);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor('#fff1eb');
  pdf.text('Detalle de préstamo', margin, 25);
  pdf.setFontSize(8); pdf.text(`Generado el ${date(new Date().toISOString(), true)}`, pageWidth - margin, 25, { align: 'right' });
  y = 51;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); setColor(DARK);
  pdf.text(`Préstamo #${String(loan.id).padStart(4, '0')}`, margin, y);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); setColor(MUTED);
  pdf.text(status(loan.status), pageWidth - margin, y, { align: 'right' });
  y += 10;
  pdf.setFillColor(PALE); pdf.roundedRect(margin, y, contentWidth, 25, 4, 4, 'F');
  y += 8;
  labelValue('Cliente', loan.clientName || '—', margin + 6, 70);
  labelValue('Inicio', date(loan.startDate), margin + 78, 48);
  y += 23;

  section('Resumen financiero');
  const cards = [
    ['Capital inicial', money(loan.amount)],
    ['Total a pagar', money(loan.totalToPay)],
    ['Total pagado', money((loan.totalToPay || 0) - (loan.balanceDue || 0))],
    ['Saldo pendiente', money(loan.balanceDue)]
  ];
  const cardWidth = (contentWidth - 9) / 2;
  cards.forEach(([label, value], index) => {
    const x = margin + (index % 2) * (cardWidth + 9);
    if (index % 2 === 0) { ensure(22); }
    const top = y + Math.floor(index / 2) * 22;
    pdf.setFillColor(index === 3 ? '#fff0eb' : PALE); pdf.roundedRect(x, top, cardWidth, 17, 3, 3, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); setColor(MUTED); pdf.text(label.toUpperCase(), x + 5, top + 6);
    pdf.setFontSize(12); setColor(index === 3 ? ORANGE : DARK); pdf.text(value, x + 5, top + 13);
  });
  y += 48;

  section('Condiciones');
  const terms = [
    ['Frecuencia', loan.frequency || '—'],
    ['Interés', `${Number(loan.interestRate || 0).toLocaleString('es-DO')}%`]
  ];
  terms.forEach(([label, value], index) => {
    const x = margin + (index % 2) * (contentWidth / 2);
    if (index % 2 === 0) ensure(18);
    labelValue(label, value, x, contentWidth / 2 - 8);
    if (index % 2 === 1) y += 15;
  });
  if (terms.length % 2 !== 0) y += 15;

  if (loan.installments?.length) {
    section('Plan de cuotas');
    const columns = [margin, margin + 52, margin + 103, pageWidth - margin];
    ensure(12); pdf.setFillColor(DARK); pdf.rect(margin, y, contentWidth, 8, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor('#ffffff');
    ['Cuota', 'Monto', 'Pagado', 'Estado'].forEach((text, i) => {
      pdf.text(text, i === 3 ? columns[i] - 2 : columns[i] + 2, y + 5, i === 3 ? { align: 'right' } : undefined);
    });
    y += 8;
    loan.installments.forEach((inst: any, index: number) => {
      ensure(8);
      if (index % 2 === 0) { pdf.setFillColor(PALE); pdf.rect(margin, y, contentWidth, 8, 'F'); }
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); setColor(DARK);
      pdf.text(String(inst.installmentNumber), columns[0] + 2, y + 5);
      pdf.text(money(inst.amount), columns[1] + 2, y + 5);
      pdf.text(money(inst.paidAmount), columns[2] + 2, y + 5);
      pdf.setFont('helvetica', 'bold'); pdf.setTextColor(inst.status === 'Paid' ? GREEN : inst.status === 'Overdue' ? ORANGE : MUTED);
      pdf.text(status(inst.status), columns[3] - 2, y + 5, { align: 'right' });
      y += 8;
    });
  }

  if (payments.length) {
    section('Historial de pagos');
    payments.forEach((payment: any, index: number) => {
      const text = [
        date(payment.paymentDate, true),
        `Capital: ${money(payment.capitalAmount)}`,
        `Interés: ${money(payment.interestAmount)}`,
        `Total: ${money(payment.amount)}`,
        payment.paymentMethod || 'Efectivo'
      ].join('  •  ');
      const notes = payment.notes ? `Observación: ${payment.notes}` : '';
      const wrapped = pdf.splitTextToSize(`${text}${notes ? `\n${notes}` : ''}`, contentWidth - 8);
      ensure(8 + wrapped.length * 4);
      if (index % 2 === 0) { pdf.setFillColor(PALE); pdf.roundedRect(margin, y, contentWidth, 7 + wrapped.length * 4, 2, 2, 'F'); }
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); setColor(DARK); pdf.text(wrapped, margin + 4, y + 5);
      y += 8 + (wrapped.length - 1) * 4;
    });
  }

  y = pageHeight - 13;
  line('#e4eee9');
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); setColor(MUTED);
  pdf.text('Documento generado por PrestaControl', margin, y + 5);
  pdf.text('Información confidencial', pageWidth - margin, y + 5, { align: 'right' });

  const filename = `prestacontrol-prestamo-${String(loan.id).padStart(4, '0')}.pdf`;
  return new File([pdf.output('blob')], filename, { type: 'application/pdf' });
}
