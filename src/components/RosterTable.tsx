import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Printer,
  RefreshCw,
  Building2,
  Clock,
  ShieldCheck,
  ArrowLeftRight,
  SlidersHorizontal,
  Calendar,
  CheckCircle2,
  Sparkles,
  Award
} from 'lucide-react';
import { DutyAllocation, DutyTask, SchoolMetadata, ShuffleOptions, StaffMember } from '../types';
import { exportRosterToExcel, exportRosterToPdf, exportRosterToImage } from '../utils/exportUtils';
import confetti from 'canvas-confetti';

interface RosterTableProps {
  allocations: DutyAllocation[];
  setAllocations: React.Dispatch<React.SetStateAction<DutyAllocation[]>>;
  tasks: DutyTask[];
  staffList: StaffMember[];
  schoolMeta: SchoolMetadata;
  onShuffle: () => void;
  isShuffling: boolean;
  shuffleOptions: ShuffleOptions;
  setShuffleOptions: React.Dispatch<React.SetStateAction<ShuffleOptions>>;
}

export const RosterTable: React.FC<RosterTableProps> = ({
  allocations,
  setAllocations,
  tasks,
  staffList,
  schoolMeta,
  onShuffle,
  isShuffling,
  shuffleOptions,
  setShuffleOptions,
}) => {
  const [effectiveDate, setEffectiveDate] = useState('Sept 22, 2026 – Sept 28, 2026');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedStaffA, setSelectedStaffA] = useState<string>('');
  const [selectedStaffB, setSelectedStaffB] = useState<string>('');

  const staffMap = new Map(staffList.map((s) => [s.id, s]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Trigger Confetti Celebration on Shuffle
  const handleShuffleWithFeedback = () => {
    onShuffle();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0f2b48', '#d97706', '#059669', '#3b82f6'],
      });
    } catch {
      // Confetti fallback
    }
  };

  // EXPORT HANDLERS
  const handleExportExcel = () => {
    setIsExporting('excel');
    try {
      exportRosterToExcel(allocations, tasks, staffList, schoolMeta, effectiveDate);
    } catch (err) {
      console.error('Excel Export failed:', err);
      alert('Failed to generate Excel file.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = () => {
    setIsExporting('pdf');
    try {
      exportRosterToPdf(allocations, tasks, staffList, schoolMeta, effectiveDate);
    } catch (err) {
      console.error('PDF Export failed:', err);
      alert('Failed to generate PDF document.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportImage = async (format: 'jpg' | 'png') => {
    setIsExporting(format);
    try {
      await exportRosterToImage('printable-roster-card', format, schoolMeta.name);
    } catch (err) {
      console.error('Image Export failed:', err);
      alert(`Failed to generate ${format.toUpperCase()} image.`);
    } finally {
      setIsExporting(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // MANUAL SWAP LOGIC
  const handleExecuteSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffA || !selectedStaffB || selectedStaffA === selectedStaffB) {
      alert('Please select two different staff members to swap.');
      return;
    }

    setAllocations((prev) =>
      prev.map((alloc) => {
        const hasA = alloc.staffIds.includes(selectedStaffA);
        const hasB = alloc.staffIds.includes(selectedStaffB);
        if (!hasA && !hasB) return alloc;

        let newStaffIds = [...alloc.staffIds];
        if (hasA && !hasB) {
          newStaffIds = newStaffIds.map((id) => (id === selectedStaffA ? selectedStaffB : id));
        } else if (hasB && !hasA) {
          newStaffIds = newStaffIds.map((id) => (id === selectedStaffB ? selectedStaffA : id));
        }

        let newSupervisorId = alloc.supervisorId;
        if (alloc.supervisorId === selectedStaffA) newSupervisorId = selectedStaffB;
        else if (alloc.supervisorId === selectedStaffB) newSupervisorId = selectedStaffA;

        return {
          ...alloc,
          staffIds: newStaffIds,
          supervisorId: newSupervisorId,
        };
      })
    );

    setSwapModalOpen(false);
    setSelectedStaffA('');
    setSelectedStaffB('');
  };

  // Quick Lead Switcher
  const handleSetLead = (taskId: string, staffId: string) => {
    setAllocations((prev) =>
      prev.map((alloc) => (alloc.taskId === taskId ? { ...alloc, supervisorId: staffId } : alloc))
    );
  };

  // Check total assigned vs total available
  const totalAssignedStaff = allocations.reduce((acc, a) => acc + a.staffIds.length, 0);
  const activeStaffCount = staffList.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* ACTION & CONTROL TOOLBAR */}
      <div className="no-print bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Controls: Effective Date & Shuffle Rules */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Effective Schedule Period
                </span>
                <input
                  type="text"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none border-b border-dashed border-slate-300 hover:border-amber-600 focus:border-amber-600"
                  placeholder="e.g. Sept 22 - Sept 28, 2026"
                />
              </div>
            </div>

            {/* Shuffle Rule Toggles */}
            <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions.respectGenderForHostels}
                  onChange={(e) =>
                    setShuffleOptions({ ...shuffleOptions, respectGenderForHostels: e.target.checked })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Hostel Gender Policy</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions.autoAssignGroupLeads}
                  onChange={(e) =>
                    setShuffleOptions({ ...shuffleOptions, autoAssignGroupLeads: e.target.checked })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Auto-Elect Squad Leads</span>
              </label>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShuffleWithFeedback}
              disabled={isShuffling}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
              title="Evenly shuffle staff across all duty stations"
            >
              <RefreshCw className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>Shuffle & Rotate</span>
            </button>

            <button
              onClick={() => setSwapModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-700 hover:bg-slate-100 text-sm font-medium rounded-lg border border-slate-200 cursor-pointer"
              title="Manually swap two staff members"
            >
              <ArrowLeftRight className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Swap Two Staff</span>
            </button>

            {/* EXPORT BUTTONS */}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <button
              onClick={handleExportExcel}
              disabled={isExporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download formatted Excel Spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download Official Print PDF (.pdf)"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => handleExportImage('jpg')}
              disabled={isExporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0f2b48] hover:bg-[#163b63] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download high-resolution image for WhatsApp / Notice Board"
            >
              <ImageIcon className="w-4 h-4" />
              <span>JPG Image</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Direct Print Layout"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PRIMARY OFFICIAL ROSTER DOCUMENT CARD */}
      <div
        id="printable-roster-card"
        className="roster-export-container bg-white rounded-xl shadow-md border border-slate-300/80 overflow-hidden"
      >
        {/* INSTITUTIONAL LETTERHEAD */}
        <div className="bg-[#0f2b48] text-white p-6 sm:p-8 text-center relative border-b-4 border-amber-600">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 mb-2.5">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h1 className="font-institutional text-xl sm:text-2xl font-bold tracking-wider uppercase text-white">
              {schoolMeta.name}
            </h1>
            <p className="text-xs sm:text-sm text-amber-200/90 font-sans tracking-wide mt-1">
              {schoolMeta.subtitle}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-300 font-sans">
              <div>
                <span className="text-slate-400">SESSION: </span>
                <span className="font-semibold text-white">{schoolMeta.academicYear}</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <div>
                <span className="text-slate-400">SCHEDULE: </span>
                <span className="font-semibold text-amber-300">{effectiveDate}</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <div>
                <span className="text-slate-400">DOCUMENT REF: </span>
                <span className="font-mono text-slate-300">DISC-ROST-{new Date().getFullYear()}-Q3</span>
              </div>
            </div>
          </div>
        </div>

        {/* OFFICIAL ROSTER TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0c233c] text-white text-xs uppercase tracking-wider font-semibold border-b border-slate-700">
                <th className="py-3.5 px-3 w-10 text-center">#</th>
                <th className="py-3.5 px-4 w-48">Duty Station / Area</th>
                <th className="py-3.5 px-4 w-36">Shift / Timings</th>
                <th className="py-3.5 px-4 w-32">Assigned Squad</th>
                <th className="py-3.5 px-4 w-48">Squad Incharge / Lead</th>
                <th className="py-3.5 px-5">Designated Personnel & Departments</th>
                <th className="py-3.5 px-4 w-52">Specific Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No duty stations active. Add duties in the "Duty Stations" tab or click Shuffle.
                  </td>
                </tr>
              ) : (
                allocations.map((alloc, idx) => {
                  const task = taskMap.get(alloc.taskId);
                  const assignedStaff = alloc.staffIds
                    .map((id) => staffMap.get(id))
                    .filter((s): s is StaffMember => !!s);

                  const supervisor = alloc.supervisorId
                    ? staffMap.get(alloc.supervisorId)
                    : assignedStaff[0];

                  return (
                    <tr
                      key={alloc.taskId}
                      className={`hover:bg-amber-50/20 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                      }`}
                    >
                      {/* S.No */}
                      <td className="py-4 px-3 text-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Duty Station */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-900 text-sm">
                          {task?.title || 'Duty Area'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{task?.location}</div>
                        {task?.preferredGender !== 'any' && (
                          <span
                            className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              task?.preferredGender === 'male'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {task?.preferredGender === 'male' ? 'Boys Hostel Duty' : 'Girls Hostel Duty'}
                          </span>
                        )}
                      </td>

                      {/* Shift / Timings */}
                      <td className="py-4 px-4 align-top">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{task?.timing || 'Standard Hours'}</span>
                        </div>
                      </td>

                      {/* Assigned Squad */}
                      <td className="py-4 px-4 align-top">
                        <span className="inline-block px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300/80">
                          {alloc.groupName}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {assignedStaff.length} / {task?.requiredCount || 0} Staff
                        </div>
                      </td>

                      {/* Squad Incharge / Lead */}
                      <td className="py-4 px-4 align-top">
                        {supervisor ? (
                          <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                              <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{supervisor.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {supervisor.role} ({supervisor.department})
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Designated Personnel Tags */}
                      <td className="py-4 px-5 align-top">
                        {assignedStaff.length === 0 ? (
                          <span className="text-xs text-rose-500 font-medium">
                            No staff members assigned
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedStaff.map((staff) => {
                              const isLead = staff.id === supervisor?.id;
                              return (
                                <div
                                  key={staff.id}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors border ${
                                    isLead
                                      ? 'bg-amber-100/90 text-amber-950 border-amber-300 font-semibold'
                                      : 'bg-white text-slate-800 border-slate-300 shadow-2xs hover:border-slate-400'
                                  }`}
                                >
                                  <span>{staff.name}</span>
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    • {staff.department}
                                  </span>
                                  {!isLead && (
                                    <button
                                      onClick={() => handleSetLead(alloc.taskId, staff.id)}
                                      className="no-print text-[10px] text-amber-700 hover:text-amber-900 underline ml-0.5 cursor-pointer"
                                      title="Make Squad Lead"
                                    >
                                      Lead
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Instructions */}
                      <td className="py-4 px-4 align-top text-xs text-slate-600 leading-relaxed">
                        {task?.description || 'Follow standard campus discipline protocols.'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* OFFICIAL SIGNATURE AND NOTICE FOOTER */}
        <div className="p-6 bg-slate-50 border-t border-slate-200">
          {/* Important Notice */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 mb-6">
            <strong className="font-semibold uppercase tracking-wider">
              Standing Orders & Discipline Guidelines:
            </strong>{' '}
            {schoolMeta.noticeText}
          </div>

          {/* Dual Institutional Signature Lines */}
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="text-center">
              <div className="w-52 mx-auto border-b border-slate-400 pb-1 mb-1.5 text-xs text-slate-400 italic">
                (Signature & Seal)
              </div>
              <div className="text-xs font-bold text-slate-900">{schoolMeta.preparedBy}</div>
              <div className="text-[11px] text-slate-500">Duty Coordinator / Convener</div>
            </div>

            <div className="text-center">
              <div className="w-52 mx-auto border-b border-slate-400 pb-1 mb-1.5 text-xs text-slate-400 italic">
                (Signature & Seal)
              </div>
              <div className="text-xs font-bold text-slate-900">{schoolMeta.approvedBy}</div>
              <div className="text-[11px] text-slate-500">Head of Institution</div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: SWAP TWO STAFF MEMBERS */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#0f2b48] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-base font-institutional">Swap Staff Duties</h3>
              </div>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteSwap} className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Instantly swap duty stations between any two staff members without disturbing the rest of the schedule.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Member 1
                </label>
                <select
                  value={selectedStaffA}
                  onChange={(e) => setSelectedStaffA(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">Select first staff member...</option>
                  {staffList
                    .filter((s) => s.isActive)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Member 2 (to swap with)
                </label>
                <select
                  value={selectedStaffB}
                  onChange={(e) => setSelectedStaffB(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">Select second staff member...</option>
                  {staffList
                    .filter((s) => s.isActive && s.id !== selectedStaffA)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSwapModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-[#0f2b48] hover:bg-[#163b63] text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Swap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
