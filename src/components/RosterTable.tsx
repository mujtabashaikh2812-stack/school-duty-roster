import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Printer,
  RefreshCw,
  Building2,
  ArrowLeftRight,
  SlidersHorizontal,
  Calendar,
  Smartphone,
  LayoutGrid,
  MapPin,
  Users,
  UserPlus,
  Check,
  Search,
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
  const [effectiveDate, setEffectiveDate] = useState('1st Oct, 2026 to 31st Dec, 2026');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedStaffA, setSelectedStaffA] = useState<string>('');
  const [selectedStaffB, setSelectedStaffB] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Manual Assignment Modal State
  const [assignModalTask, setAssignModalTask] = useState<DutyTask | null>(null);
  const [assignSearch, setAssignSearch] = useState('');

  const staffMap = new Map(staffList.map((s) => [s.id, s]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  const issuedDate = 'Sep 17, 2026';

  // Confetti Celebration
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

        return {
          ...alloc,
          staffIds: newStaffIds,
        };
      })
    );

    setSwapModalOpen(false);
    setSelectedStaffA('');
    setSelectedStaffB('');
  };

  // MANUAL DIRECT MOVE LOGIC
  const handleMoveStaff = (staffId: string, targetTaskId: string | 'unassign') => {
    setAllocations((prev) =>
      prev.map((alloc) => {
        if (alloc.taskId === targetTaskId) {
          if (!alloc.staffIds.includes(staffId)) {
            return {
              ...alloc,
              staffIds: [...alloc.staffIds, staffId],
            };
          }
          return alloc;
        }
        if (alloc.staffIds.includes(staffId)) {
          return {
            ...alloc,
            staffIds: alloc.staffIds.filter((id) => id !== staffId),
          };
        }
        return alloc;
      })
    );
  };

  // MANUAL ASSIGN TOGGLE IN MODAL
  const handleToggleStaffInTask = (taskId: string, staffId: string) => {
    setAllocations((prev) => {
      const currentAlloc = prev.find((a) => a.taskId === taskId);
      const isAlreadyAssigned = currentAlloc?.staffIds.includes(staffId);

      return prev.map((alloc) => {
        if (alloc.taskId === taskId) {
          if (isAlreadyAssigned) {
            return {
              ...alloc,
              staffIds: alloc.staffIds.filter((id) => id !== staffId),
            };
          } else {
            return {
              ...alloc,
              staffIds: [...alloc.staffIds, staffId],
            };
          }
        }
        if (!isAlreadyAssigned && alloc.staffIds.includes(staffId)) {
          return {
            ...alloc,
            staffIds: alloc.staffIds.filter((id) => id !== staffId),
          };
        }
        return alloc;
      });
    });
  };

  const getStaffCurrentLocationName = (staffId: string): string | null => {
    for (const alloc of allocations) {
      if (alloc.staffIds.includes(staffId)) {
        const t = taskMap.get(alloc.taskId);
        return t ? t.title : alloc.groupName;
      }
    }
    return null;
  };

  const currentModalAllocation = assignModalTask
    ? allocations.find((a) => a.taskId === assignModalTask.id)
    : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ACTION & CONTROL TOOLBAR */}
      <div className="no-print bg-white rounded-xl shadow-xs border border-slate-200 p-3.5 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Schedule Range
                </span>
                <input
                  type="text"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none border-b border-dashed border-slate-300 hover:border-blue-600 focus:border-blue-600 truncate"
                  placeholder="e.g. 1st Oct, 2026 to 31st Dec, 2026"
                />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Document View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Cards</span>
              </button>
            </div>
          </div>

          {/* Shuffle Policy Controls */}
          <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions.respectGenderForHostels}
                onChange={(e) =>
                  setShuffleOptions({ ...shuffleOptions, respectGenderForHostels: e.target.checked })
                }
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="text-[11px] sm:text-xs">Hostel Gender Preference</span>
            </label>
          </div>
        </div>

        {/* Action Buttons & Exports */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={handleShuffleWithFeedback}
              disabled={isShuffling}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 min-h-[42px]"
              title="Automatically shuffle staff across all duty stations"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>Shuffle Staff</span>
            </button>

            <button
              onClick={() => {
                if (tasks.length > 0) setAssignModalTask(tasks[0]);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#162d59] hover:bg-[#1f3d75] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[42px]"
              title="Manually assign staff members to duty stations"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300" />
              <span>Manual Duty Assign</span>
            </button>

            <button
              onClick={() => setSwapModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 cursor-pointer min-h-[42px] col-span-2 sm:col-span-1"
              title="Manually swap two staff members"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              <span>Swap Staff</span>
            </button>
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={isExporting !== null}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
              title="Download formatted Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting !== null}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
              title="Download Official PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Document</span>
            </button>

            <button
              onClick={() => handleExportImage('jpg')}
              disabled={isExporting !== null}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[#162d59] hover:bg-[#203c73] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
              title="Download high-resolution JPG Image"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>JPG Image</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer min-h-[40px]"
              title="Direct Print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="sm:hidden text-xs">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: MOBILE SQUAD CARDS */}
      {viewMode === 'cards' && (
        <div className="no-print space-y-3.5 block md:hidden">
          {allocations.map((alloc, idx) => {
            const task = taskMap.get(alloc.taskId);
            const assignedStaff = alloc.staffIds
              .map((id) => staffMap.get(id))
              .filter((s): s is StaffMember => !!s);

            return (
              <div
                key={alloc.taskId}
                className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      SR. NO. {idx + 1}
                    </span>
                    <h3 className="font-bold text-base text-[#162d59]">{task?.title}</h3>
                    <span className="text-xs text-slate-500 font-mono">{task?.location}</span>
                  </div>

                  {task && (
                    <button
                      onClick={() => setAssignModalTask(task)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign</span>
                    </button>
                  )}
                </div>

                {/* Staff list with signature placeholder */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {assignedStaff.length === 0 ? (
                    <p className="text-xs text-rose-500 italic py-1">No staff assigned.</p>
                  ) : (
                    assignedStaff.map((staff, sIdx) => (
                      <div
                        key={staff.id}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0"
                      >
                        <span className="font-medium text-slate-900">
                          {sIdx + 1}. {staff.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono tracking-widest">
                          [ SIGNATURE ]
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: THE OFFICIAL PRINTABLE ROSTER DOCUMENT (EXACT MATCH TO PDF) */}
      <div
        id="printable-roster-card"
        className={`roster-export-container bg-white rounded-xl shadow-sm border border-slate-300 p-6 sm:p-10 max-w-4xl mx-auto ${
          viewMode === 'cards' ? 'hidden md:block' : 'block'
        }`}
      >
        {/* 1. DOCUMENT HEADER */}
        <div className="text-center pb-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase text-[#162d59]">
            {schoolMeta.name}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-[#1d4ed8] tracking-widest uppercase mt-1">
            OFFICIAL DUTY ALLOCATION ROSTER • {schoolMeta.academicYear.toUpperCase()}
          </p>
        </div>

        {/* 2. SCHEDULE & ISSUED BAR */}
        <div className="border-t border-b border-slate-300 py-2 my-2 flex items-center justify-between text-xs sm:text-sm text-slate-900">
          <div>
            <span className="font-bold">Schedule: </span>
            <span className="font-medium text-slate-800">{effectiveDate}</span>
          </div>
          <div>
            <span className="font-bold">Issued: </span>
            <span className="font-medium text-slate-800">{issuedDate}</span>
          </div>
        </div>

        {/* 3. THE OFFICIAL TABLE */}
        <div className="overflow-x-auto my-3">
          <table className="w-full text-left border-collapse border border-slate-300 text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#162d59] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-3 w-14 text-center border-r border-[#203c73]">
                  SR.<br />NO.
                </th>
                <th className="py-3 px-4 w-56 text-center border-r border-[#203c73]">
                  DUTY STATION / AREA
                </th>
                <th className="py-3 px-5 border-r border-[#203c73]">
                  STAFF MEMBER
                </th>
                <th className="py-3 px-4 w-52 text-center">
                  SIGNATURE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-slate-900">
              {allocations.map((alloc, idx) => {
                const task = taskMap.get(alloc.taskId);
                const assignedStaff = alloc.staffIds
                  .map((id) => staffMap.get(id))
                  .filter((s): s is StaffMember => !!s);

                return (
                  <tr key={alloc.taskId} className="border-b border-slate-300">
                    {/* SR. NO. */}
                    <td className="py-4 px-3 text-center font-bold text-slate-800 border-r border-slate-300 align-middle">
                      {idx + 1}
                    </td>

                    {/* DUTY STATION / AREA (CENTERED WITH [CAMPUS WING]) */}
                    <td className="py-4 px-4 text-center border-r border-slate-300 align-middle">
                      <div className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        {task?.title || 'Duty Area'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 tracking-wider mt-1 uppercase">
                        {task?.location || '[CAMPUS WING]'}
                      </div>

                      {/* On-screen Assign Staff Button (Hidden in exports) */}
                      {task && (
                        <button
                          onClick={() => setAssignModalTask(task)}
                          className="no-print mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Assign Staff</span>
                        </button>
                      )}
                    </td>

                    {/* STAFF MEMBER (NUMBERED ROWS) */}
                    <td className="p-0 border-r border-slate-300 align-top">
                      {assignedStaff.length === 0 ? (
                        <div className="py-4 px-5 text-xs text-rose-500 italic">
                          No staff assigned
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {assignedStaff.map((staff, sIdx) => (
                            <div
                              key={staff.id}
                              className="py-2.5 px-5 flex items-center justify-between text-xs sm:text-sm font-medium text-slate-800"
                            >
                              <span>
                                {sIdx + 1}. {staff.name}
                              </span>

                              {/* On-screen Move Dropdown (Hidden in exports) */}
                              <select
                                onChange={(e) => handleMoveStaff(staff.id, e.target.value)}
                                value={alloc.taskId}
                                className="no-print text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 focus:outline-none hover:border-blue-500 cursor-pointer"
                                title="Move teacher"
                              >
                                <option value={alloc.taskId} disabled>Move...</option>
                                {tasks
                                  .filter((t) => t.id !== alloc.taskId)
                                  .map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.title}
                                    </option>
                                  ))}
                                <option value="unassign">Unassign</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* SIGNATURE (DASHED LINE FOR EACH STAFF MEMBER) */}
                    <td className="p-0 align-top">
                      {assignedStaff.length === 0 ? (
                        <div className="py-4 px-4 text-center text-slate-300 text-xs">
                          ------------------------------------
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {assignedStaff.map((staff) => (
                            <div
                              key={staff.id}
                              className="py-2.5 px-4 text-center text-slate-400 font-mono tracking-wider select-none text-xs"
                            >
                              ------------------------------------
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. STANDING ORDERS BOX */}
        <div className="bg-slate-50 border-l-4 border-blue-600 p-3 sm:p-4 my-4 rounded-r-md text-xs sm:text-sm">
          <h4 className="font-bold text-blue-700 tracking-wider uppercase text-xs">
            STANDING ORDERS
          </h4>
          <p className="text-slate-600 mt-1 leading-relaxed">
            {schoolMeta.noticeText}
          </p>
        </div>

        {/* 5. DUAL SIGNATURE LINES */}
        <div className="grid grid-cols-2 gap-8 pt-8 pb-4">
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#162d59] uppercase">
              {schoolMeta.preparedBy}
            </div>
            <div className="text-xs text-slate-500">
              {schoolMeta.subtitle}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs sm:text-sm font-bold text-[#162d59] uppercase">
              {schoolMeta.approvedBy}
            </div>
            <div className="text-xs text-slate-500">
              {schoolMeta.subtitle}
            </div>
          </div>
        </div>

        {/* 6. DOCUMENT FOOTER NOTE */}
        <div className="pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400">
          {schoolMeta.subtitle} — Duty Roster ({effectiveDate})
        </div>
      </div>

      {/* MODAL: MANUAL SQUAD STAFF ASSIGNMENT */}
      {assignModalTask && currentModalAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-150">
            <div className="bg-[#162d59] px-5 py-4 text-white flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                  Manual Duty Assignment
                </span>
                <h3 className="font-bold text-base truncate">
                  {assignModalTask.title}
                </h3>
                <p className="text-xs text-slate-300">
                  Target Quota: {assignModalTask.requiredCount} Staff
                </p>
              </div>
              <button
                onClick={() => setAssignModalTask(null)}
                className="text-slate-400 hover:text-white cursor-pointer text-lg p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Search staff by name..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="text-xs font-semibold text-slate-700 bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md shrink-0">
                {currentModalAllocation.staffIds.length} Assigned
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100">
              {staffList
                .filter((s) => s.isActive)
                .filter((s) => s.name.toLowerCase().includes(assignSearch.toLowerCase()))
                .map((staff) => {
                  const isAssignedToThis = currentModalAllocation.staffIds.includes(staff.id);
                  const currentLocation = getStaffCurrentLocationName(staff.id);

                  return (
                    <div
                      key={staff.id}
                      onClick={() => handleToggleStaffInTask(assignModalTask.id, staff.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors pt-2.5 ${
                        isAssignedToThis
                          ? 'bg-blue-50/80 border border-blue-300'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            isAssignedToThis
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isAssignedToThis && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {staff.name}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isAssignedToThis ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Assigned Here
                          </span>
                        ) : currentLocation ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            At {currentLocation}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-400">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAllocations((prev) =>
                    prev.map((a) =>
                      a.taskId === assignModalTask.id ? { ...a, staffIds: [] } : a
                    )
                  );
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
              >
                Clear Station
              </button>

              <button
                type="button"
                onClick={() => setAssignModalTask(null)}
                className="px-5 py-2 text-xs font-semibold bg-[#162d59] hover:bg-[#203c73] text-white rounded-lg shadow-sm cursor-pointer min-h-[38px]"
              >
                Done & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SWAP TWO STAFF MEMBERS */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#162d59] px-4 sm:px-5 py-3.5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-300" />
                <h3 className="font-bold text-sm sm:text-base">Swap Staff Duties</h3>
              </div>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteSwap} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <p className="text-xs text-slate-600">
                Instantly swap duty stations between any two staff members.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Staff Member 1
                </label>
                <select
                  value={selectedStaffA}
                  onChange={(e) => setSelectedStaffA(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 min-h-[44px]"
                >
                  <option value="">Select first staff member...</option>
                  {staffList
                    .filter((s) => s.isActive)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Staff Member 2 (to swap with)
                </label>
                <select
                  value={selectedStaffB}
                  onChange={(e) => setSelectedStaffB(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 min-h-[44px]"
                >
                  <option value="">Select second staff member...</option>
                  {staffList
                    .filter((s) => s.isActive && s.id !== selectedStaffA)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSwapModalOpen(false)}
                  className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-semibold bg-[#162d59] hover:bg-[#203c73] text-white rounded-lg shadow-sm cursor-pointer min-h-[44px]"
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
