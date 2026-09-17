import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toJpeg, toPng } from 'html-to-image';
import { DutyAllocation, DutyTask, SchoolMetadata, StaffMember } from '../types';

/**
 * Clean sanitization for filenames
 */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

/**
 * EXCEL EXPORT (.xlsx)
 * Generates an official, streamlined multi-sheet workbook.
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

  // Sheet 1: Official Duty Roster
  const rosterRows: (string | number)[][] = [
    [schoolMeta.name.toUpperCase()],
    [schoolMeta.subtitle],
    [`Academic Session: ${schoolMeta.academicYear} | Schedule: ${effectiveDate}`],
    [`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`],
    [], // Blank spacing row
    [
      'S.No',
      'Duty Station / Area',
      'Location Specifics',
      'Assigned Squad',
      'Staff Members',
      'Specific Instructions'
    ]
  ];

  allocations.forEach((alloc, index) => {
    const task = taskMap.get(alloc.taskId);
    if (!task) return;

    const assignedStaff = alloc.staffIds
      .map((id) => staffMap.get(id))
      .filter((s): s is StaffMember => !!s);

    const staffNames = assignedStaff.map((s) => s.name).join('; ');

    rosterRows.push([
      index + 1,
      task.title,
      task.location,
      alloc.groupName,
      staffNames || 'None',
      task.description
    ]);
  });

  rosterRows.push([]);
  rosterRows.push([`Standing Orders: ${schoolMeta.noticeText}`]);
  rosterRows.push([`Prepared by: ${schoolMeta.preparedBy}`, '', '', `Approved by: ${schoolMeta.approvedBy}`]);

  const wsRoster = XLSX.utils.aoa_to_sheet(rosterRows);

  // Set column widths
  wsRoster['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 28 }, // Duty Location
    { wch: 32 }, // Location specifics
    { wch: 20 }, // Assigned Squad
    { wch: 50 }, // Staff Members
    { wch: 45 }, // Instructions
  ];

  // Sheet 2: School Staff Directory
  const staffRows: (string | number)[][] = [
    ['STAFF MASTER DIRECTORY', schoolMeta.name],
    [],
    ['ID', 'Staff Name', 'Department / Subject', 'Designation / Role', 'Gender', 'Phone / Extension', 'Status']
  ];

  staffList.forEach((s) => {
    staffRows.push([
      s.id,
      s.name,
      s.department,
      s.role,
      s.gender.charAt(0).toUpperCase() + s.gender.slice(1),
      s.phone || 'N/A',
      s.isActive ? 'Active on Duty' : 'On Leave'
    ]);
  });

  const wsStaff = XLSX.utils.aoa_to_sheet(staffRows);
  wsStaff['!cols'] = [
    { wch: 10 },
    { wch: 28 },
    { wch: 26 },
    { wch: 24 },
    { wch: 12 },
    { wch: 20 },
    { wch: 16 },
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
 * Generates an executive institutional letterhead document with signatures.
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

  // Landscape A4 for rich tabular display
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Institution Top Header Styling
  doc.setFillColor(15, 43, 72); // Academic Navy #0f2b48
  doc.rect(0, 0, pageWidth, 5, 'F');

  // School Crest Accent Line
  doc.setFillColor(217, 119, 6); // Amber Gold #d97706
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // School Name Header
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 43, 72);
  doc.text(schoolMeta.name.toUpperCase(), pageWidth / 2, 16, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(71, 85, 105);
  doc.text(schoolMeta.subtitle, pageWidth / 2, 22, { align: 'center' });

  // Academic Session & Date Box (Without Ref)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `OFFICIAL DUTY ALLOCATION ROSTER | ${schoolMeta.academicYear.toUpperCase()}`,
    pageWidth / 2,
    28,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Schedule: ${effectiveDate}   •   Issued: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    pageWidth / 2,
    33,
    { align: 'center' }
  );

  // Build Table Data (Streamlined: No shift timing, no incharge, clean staff names)
  const tableData = allocations.map((alloc, idx) => {
    const task = taskMap.get(alloc.taskId);
    const assignedStaff = alloc.staffIds
      .map((id) => staffMap.get(id))
      .filter((s): s is StaffMember => !!s);

    const staffListFormatted = assignedStaff
      .map((s, i) => `${i + 1}. ${s.name}`)
      .join('\n');

    return [
      `${idx + 1}`,
      `${task?.title || 'Duty Area'}\n[${task?.location || ''}]`,
      alloc.groupName,
      staffListFormatted || 'No staff assigned',
      task?.description || '-'
    ];
  });

  // Render Table using AutoTable
  autoTable(doc, {
    startY: 37,
    head: [[
      '#',
      'Duty Station / Area',
      'Assigned Squad',
      'Staff Members',
      'Specific Instructions'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3.5,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      valign: 'top',
    },
    headStyles: {
      fillColor: [15, 43, 72],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 62, fontStyle: 'bold' },
      2: { cellWidth: 38, halign: 'center' },
      3: { cellWidth: 95 },
      4: { cellWidth: 70 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 10, right: 10, bottom: 28 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY = (doc as any).lastAutoTable?.finalY || 160;
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = Math.min(Math.max(lastY + 12, pageHeight - 24), pageHeight - 16);

  // Administrative Notice
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Standing Orders: ${schoolMeta.noticeText}`, 10, footerY - 4, { maxWidth: pageWidth - 20 });

  // Dual Signature Lines
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 43, 72);

  // Left Signature
  doc.setDrawColor(148, 163, 184);
  doc.line(20, footerY + 10, 80, footerY + 10);
  doc.text(schoolMeta.preparedBy, 50, footerY + 14, { align: 'center' });

  // Right Signature
  doc.line(pageWidth - 80, footerY + 10, pageWidth - 20, footerY + 10);
  doc.text(schoolMeta.approvedBy, pageWidth - 50, footerY + 14, { align: 'center' });

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
    quality: 0.95,
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
