import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toJpeg, toPng } from 'html-to-image';
import { DutyAllocation, DutyTask, SchoolMetadata, StaffMember } from '../types';

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

/**
 * EXCEL EXPORT (.xlsx)
 * Matches the official institutional format.
 */
export function exportRosterToExcel(
  allocations: DutyAllocation[],
  tasks: DutyTask[],
  staffList: StaffMember[],
  schoolMeta: SchoolMetadata,
  effectiveDate: string
) {
  const staffMap = new Map(staffList.map((s) => [s.id, s]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  const issuedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Sheet 1: Official Duty Roster
  const rosterRows: (string | number)[][] = [
    [schoolMeta.name.toUpperCase()],
    [`OFFICIAL DUTY ALLOCATION ROSTER • ${schoolMeta.academicYear.toUpperCase()}`],
    [`Schedule: ${effectiveDate}`, '', `Issued: ${issuedDate}`],
    [],
    [
      'SR. NO.',
      'DUTY STATION / AREA',
      'STAFF MEMBER',
      'SIGNATURE'
    ]
  ];

  allocations.forEach((alloc, index) => {
    const task = taskMap.get(alloc.taskId);
    if (!task) return;

    const assignedStaff = alloc.staffIds
      .map((id) => staffMap.get(id))
      .filter((s): s is StaffMember => !!s);

    if (assignedStaff.length === 0) {
      rosterRows.push([
        index + 1,
        `${task.title}\n${task.location}`,
        'No staff assigned',
        '____________________'
      ]);
    } else {
      assignedStaff.forEach((staff, sIdx) => {
        rosterRows.push([
          sIdx === 0 ? index + 1 : '',
          sIdx === 0 ? `${task.title} ${task.location}` : '',
          `${sIdx + 1}. ${staff.name}`,
          '........................................'
        ]);
      });
    }
  });

  rosterRows.push([]);
  rosterRows.push([`STANDING ORDERS: ${schoolMeta.noticeText}`]);
  rosterRows.push([]);
  rosterRows.push([schoolMeta.preparedBy, '', '', schoolMeta.approvedBy]);
  rosterRows.push([schoolMeta.subtitle, '', '', schoolMeta.subtitle]);

  const wsRoster = XLSX.utils.aoa_to_sheet(rosterRows);

  wsRoster['!cols'] = [
    { wch: 10 }, // SR. NO.
    { wch: 32 }, // DUTY STATION
    { wch: 40 }, // STAFF MEMBER
    { wch: 28 }, // SIGNATURE
  ];

  // Sheet 2: Staff Directory
  const staffRows: (string | number)[][] = [
    ['STAFF MASTER DIRECTORY', schoolMeta.name],
    [],
    ['ID', 'Staff Name', 'Department / Subject', 'Designation / Role', 'Status']
  ];

  staffList.forEach((s) => {
    staffRows.push([
      s.id,
      s.name,
      s.department,
      s.role,
      s.isActive ? 'Active on Duty' : 'On Leave'
    ]);
  });

  const wsStaff = XLSX.utils.aoa_to_sheet(staffRows);
  wsStaff['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 26 },
    { wch: 24 },
    { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsRoster, 'Duty Roster');
  XLSX.utils.book_append_sheet(wb, wsStaff, 'Staff Directory');

  const cleanSchool = sanitizeFileName(schoolMeta.name || 'school');
  const dateTag = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${cleanSchool}_Duty_Roster_${dateTag}.xlsx`);
}

/**
 * PDF EXPORT (.pdf)
 * Exactly reproduces the official portrait document design with signature lines.
 */
export function exportRosterToPdf(
  allocations: DutyAllocation[],
  tasks: DutyTask[],
  staffList: StaffMember[],
  schoolMeta: SchoolMetadata,
  effectiveDate: string
) {
  const staffMap = new Map(staffList.map((s) => [s.id, s]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Standard Portrait A4 (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const issuedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // 1. School Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(21, 46, 89); // Deep Institutional Navy #152e59
  doc.text(schoolMeta.name.toUpperCase(), pageWidth / 2, 18, { align: 'center' });

  // 2. Subtitle: OFFICIAL DUTY ALLOCATION ROSTER • ACADEMIC SESSION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(29, 78, 216); // Royal Blue #1d4ed8
  doc.text(
    `OFFICIAL DUTY ALLOCATION ROSTER • ${schoolMeta.academicYear.toUpperCase()}`,
    pageWidth / 2,
    24,
    { align: 'center' }
  );

  // 3. Schedule & Issued Date Bar
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.3);
  doc.line(14, 28, pageWidth - 14, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('Schedule: ', 14, 33);
  doc.setFont('helvetica', 'normal');
  doc.text(effectiveDate, 31, 33);

  doc.setFont('helvetica', 'bold');
  const issuedText = `Issued: ${issuedDate}`;
  doc.text(issuedText, pageWidth - 14, 33, { align: 'right' });

  doc.line(14, 35.5, pageWidth - 14, 35.5);

  // 4. Build Table Rows
  const tableData: (string | number)[][] = [];

  allocations.forEach((alloc, idx) => {
    const task = taskMap.get(alloc.taskId);
    const assignedStaff = alloc.staffIds
      .map((id) => staffMap.get(id))
      .filter((s): s is StaffMember => !!s);

    const staffLines = assignedStaff.length > 0
      ? assignedStaff.map((s, i) => `${i + 1}. ${s.name}`).join('\n\n')
      : 'No staff assigned';

    const signatureLines = assignedStaff.length > 0
      ? assignedStaff.map(() => '-----------------------------------------').join('\n\n')
      : '-----------------------------------------';

    tableData.push([
      `${idx + 1}`,
      `${task?.title || 'Duty Station'}\n${task?.location || '[CAMPUS WING]'}`,
      staffLines,
      signatureLines
    ]);
  });

  // Render Table
  autoTable(doc, {
    startY: 38,
    head: [[
      'SR.\nNO.',
      'DUTY STATION / AREA',
      'STAFF MEMBER',
      'SIGNATURE'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 3.5,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.25,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [22, 45, 89], // #162d59
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 70, halign: 'left' },
      3: { cellWidth: 48, halign: 'center', textColor: [148, 163, 184] },
    },
    margin: { left: 14, right: 14, bottom: 25 },
  });

  // 5. Standing Orders Box
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY = (doc as any).lastAutoTable?.finalY || 210;
  const ordersBoxY = lastY + 5;

  doc.setFillColor(248, 250, 252); // Slate 50
  doc.rect(14, ordersBoxY, pageWidth - 28, 16, 'F');

  // Blue left accent line
  doc.setFillColor(29, 78, 216); // Royal blue #1d4ed8
  doc.rect(14, ordersBoxY, 1.5, 16, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(29, 78, 216);
  doc.text('STANDING ORDERS', 18, ordersBoxY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    schoolMeta.noticeText,
    18,
    ordersBoxY + 9.5,
    { maxWidth: pageWidth - 36 }
  );

  // 6. Dual Signature Lines
  const sigY = ordersBoxY + 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42); // Dark slate

  // Left Signature
  doc.text(schoolMeta.preparedBy, 14, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(schoolMeta.subtitle, 14, sigY + 4);

  // Right Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(schoolMeta.approvedBy, pageWidth - 14, sigY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(schoolMeta.subtitle, pageWidth - 14, sigY + 4, { align: 'right' });

  // 7. Footer Note
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${schoolMeta.subtitle} — Duty Roster (${effectiveDate})`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  const cleanSchool = sanitizeFileName(schoolMeta.name || 'school');
  const dateTag = new Date().toISOString().slice(0, 10);
  doc.save(`${cleanSchool}_Duty_Roster_${dateTag}.pdf`);
}

/**
 * HIGH-RES IMAGE EXPORT (.jpg or .png)
 */
export async function exportRosterToImage(
  elementId: string,
  format: 'jpg' | 'png',
  schoolName: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id #${elementId} not found`);
  }

  const originalBackground = element.style.backgroundColor;
  element.style.backgroundColor = '#ffffff';

  const exportOptions = {
    pixelRatio: 2.5,
    quality: 0.98,
    backgroundColor: '#ffffff',
    cacheBust: true,
  };

  try {
    let dataUrl: string;
    const cleanSchool = sanitizeFileName(schoolName || 'school');
    const dateTag = new Date().toISOString().slice(0, 10);

    if (format === 'jpg') {
      dataUrl = await toJpeg(element, exportOptions);
    } else {
      dataUrl = await toPng(element, exportOptions);
    }

    const link = document.createElement('a');
    link.download = `${cleanSchool}_Duty_Roster_${dateTag}.${format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    element.style.backgroundColor = originalBackground;
  }
}
