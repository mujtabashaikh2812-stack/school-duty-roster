import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Printer,
  RefreshCw,
  Building2,
  ShieldCheck,
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
  ChevronDown,
  X
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Manual Assignment Modal State
  const [assignModalTask, setAssignModalTask] = useState<DutyTask | null>(null);
  const [assignSearch, setAssignSearch] = useState('');

  // Quick Move Popover State
  const [movingStaffId, setMovingStaffId] = useState<string | null>(null);

  const staffMap = new Map(staffList.map((s) => [s.id, s]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

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
        // Remove from current task
        if (alloc.staffIds.includes(staffId)) {
          return {
            ...alloc,
            staffIds: alloc.staffIds.filter((id) => id !== staffId),
          };
        }
        return alloc;
      })
    );
    setMovingStaffId(null);
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
        // If adding to taskId, ensure removed from other tasks
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

  // Find where a staff member is currently assigned
  const getStaffCurrentLocationName = (staffId: string): string | null => {
    for (const alloc of allocations) {
      if (alloc.staffIds.includes(staffId)) {
        const t = taskMap.get(alloc.taskId);
        return t ? t.title : alloc.groupName;
      }
    }
    return null;
  };

  // Current active squad for the modal
  const currentModalAllocation = assignModalTask
    ? allocations.find((a) => a.taskId === assignModalTask.id)
    : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ACTION & CONTROL TOOLBAR */}
      <div className="no-print bg-white rounded-xl shadow-xs border border-slate-200 p-3.5 sm:p-5 space-y-3 sm:space-y-4">
        {/* Row 1: Schedule Range & Mode Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Schedule Range
                </span>
                <input
                  type="text"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none border-b border-dashed border-slate-300 hover:border-amber-600 focus:border-amber-600 truncate"
                  placeholder="e.g. Sept 22 - Sept 28, 2026"
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
                <span>Table View</span>
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
                <span>Squad Cards</span>
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
                className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
              />
              <span className="text-[11px] sm:text-xs">Hostel Gender Policy</span>
            </label>
          </div>
        </div>

        {/* Row 2: Action Buttons & Exports */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          {/* Main Shuffle, Assign & Swap Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={handleShuffleWithFeedback}
              disabled={isShuffling}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 min-h-[42px]"
              title="Automatically shuffle staff across all duty stations"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>Shuffle & Rotate</span>
            </button>

            <button
              onClick={() => {
                if (tasks.length > 0) setAssignModalTask(tasks[0]);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0f2b48] hover:bg-[#163b63] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[42px]"
              title="Manually assign or unassign staff members to duty stations"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>Manual Duty Assign</span>
            </button>

            <button
              onClick={() => setSwapModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 cursor-pointer min-h-[42px] col-span-2 sm:col-span-1"
              title="Manually swap two staff members"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              <span>Swap Two Staff</span>
            </button>
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={isExporting !== null}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
              title="Download formatted Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting !== null}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
              title="Download Official PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Document</span>
            </button>

            <button
              onClick={() => handleExportImage('jpg')}
              disabled={isExporting !== null}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0f2b48] hover:bg-[#163b63] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
              title="Download high-resolution image for WhatsApp / Notice Board"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>JPG Image</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer min-h-[40px]"
              title="Print direct"
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
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Viewing as Mobile Squad Cards</span>
            <button
              onClick={() => setViewMode('table')}
              className="text-amber-700 font-semibold underline cursor-pointer"
            >
              Switch to Table View
            </button>
          </div>

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
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    task?.badgeColor === 'blue'
                      ? 'bg-blue-600'
                      : task?.badgeColor === 'indigo'
                      ? 'bg-indigo-600'
                      : task?.badgeColor === 'emerald'
                      ? 'bg-emerald-600'
                      : task?.badgeColor === 'amber'
                      ? 'bg-amber-600'
                      : task?.badgeColor === 'rose'
                      ? 'bg-rose-600'
                      : 'bg-slate-600'
                  }`}
                />

                <div className="flex items-start justify-between gap-2 pt-1 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Station {idx + 1}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300/80">
                        {alloc.groupName}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mt-0.5">{task?.title}</h3>
                  </div>

                  {task && (
                    <button
                      onClick={() => setAssignModalTask(task)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{task?.location}</span>
                </div>

                {/* Assigned Personnel Names */}
                <div className="mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
                    <span>Assigned Staff ({assignedStaff.length})</span>
                    <span className="text-slate-400">Quota: {task?.requiredCount || 0}</span>
                  </div>

                  {assignedStaff.length === 0 ? (
                    <p className="text-xs text-rose-500 italic py-1">No staff assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {assignedStaff.map((staff, sIdx) => (
                        <div
                          key={staff.id}
                          className="flex items-center justify-between text-xs text-slate-900 font-medium bg-white p-2 rounded-md border border-slate-200"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-400 text-[11px] w-4 shrink-0">{sIdx + 1}.</span>
                            <span className="truncate">{staff.name}</span>
                          </div>

                          <select
                            onChange={(e) => handleMoveStaff(staff.id, e.target.value)}
                            value={alloc.taskId}
                            className="text-[11px] bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none"
                          >
                            <option value={alloc.taskId} disabled>Move to...</option>
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
                </div>

                {/* Directives */}
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  <strong className="text-slate-700">Directive:</strong> {task?.description}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: PRIMARY OFFICIAL ROSTER DOCUMENT CARD */}
      <div
        id="printable-roster-card"
        className={`roster-export-container bg-white rounded-xl shadow-md border border-slate-300/80 overflow-hidden ${
          viewMode === 'cards' ? 'hidden md:block' : 'block'
        }`}
      >
        {/* INSTITUTIONAL LETTERHEAD */}
        <div className="bg-[#0f2b48] text-white p-4 sm:p-8 text-center relative border-b-4 border-amber-600">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 mb-2 sm:mb-2.5">
              <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>

            <h1 className="font-institutional text-base sm:text-2xl font-bold tracking-wider uppercase text-white leading-tight">
              {schoolMeta.name}
            </h1>
            <p className="text-[11px] sm:text-sm text-amber-200/90 font-sans tracking-wide mt-1">
              {schoolMeta.subtitle}
            </p>

            {/* Session & Schedule Header */}
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1.5 text-[10px] sm:text-xs text-slate-300 font-sans">
              <div>
                <span className="text-slate-400">SESSION: </span>
                <span className="font-semibold text-white">{schoolMeta.academicYear}</span>
              </div>
              <span className="text-slate-600">•</span>
              <div>
                <span className="text-slate-400">SCHEDULE: </span>
                <span className="font-semibold text-amber-300">{effectiveDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* OFFICIAL ROSTER TABLE */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[640px] md:min-w-full">
            <thead>
              <tr className="bg-[#0c233c] text-white text-xs uppercase tracking-wider font-semibold border-b border-slate-700">
                <th className="py-3.5 px-3 w-12 text-center">#</th>
                <th className="py-3.5 px-4 w-52 sm:w-60">Duty Station / Area</th>
                <th className="py-3.5 px-4 w-36 text-center">Assigned Squad</th>
                <th className="py-3.5 px-5">Staff Members</th>
                <th className="py-3.5 px-4 w-56 sm:w-64">Specific Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No duty stations active. Add duties in the "Duty Stations" tab or click Shuffle.
                  </td>
                </tr>
              ) : (
                allocations.map((alloc, idx) => {
                  const task = taskMap.get(alloc.taskId);
                  const assignedStaff = alloc.staffIds
                    .map((id) => staffMap.get(id))
                    .filter((s): s is StaffMember => !!s);

                  return (
                    <tr
                      key={alloc.taskId}
                      className={`hover:bg-amber-50/20 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                      }`}
                    >
                      {/* S.No */}
                      <td className="py-4 px-3 text-center text-xs font-bold text-slate-400 align-top">
                        {idx + 1}
                      </td>

                      {/* Duty Station */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {task?.title || 'Duty Area'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{task?.location}</div>
                        {task?.preferredGender !== 'any' && (
                          <span
                            className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              task?.preferredGender === 'male'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {task?.preferredGender === 'male' ? 'Boys Hostel' : 'Girls Hostel'}
                          </span>
                        )}
                      </td>

                      {/* Assigned Squad + Manual Assign Button */}
                      <td className="py-4 px-4 align-top text-center">
                        <span className="inline-block px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300/80">
                          {alloc.groupName}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {assignedStaff.length} / {task?.requiredCount || 0} Staff
                        </div>

                        {/* Interactive Manual Assign Action */}
                        {task && (
                          <button
                            onClick={() => setAssignModalTask(task)}
                            className="no-print mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-colors cursor-pointer"
                            title="Manually pick staff members for this duty"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Assign Staff</span>
                          </button>
                        )}
                      </td>

                      {/* Staff Members (Clean Names with Quick Move Control) */}
                      <td className="py-4 px-5 align-top">
                        {assignedStaff.length === 0 ? (
                          <div className="py-2">
                            <span className="text-xs text-rose-500 font-medium italic">
                              No staff members assigned
                            </span>
                            {task && (
                              <button
                                onClick={() => setAssignModalTask(task)}
                                className="no-print block mt-1 text-xs text-amber-700 hover:underline font-semibold cursor-pointer"
                              >
                                + Click here to assign staff
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                            {assignedStaff.map((staff, sIdx) => (
                              <div
                                key={staff.id}
                                className="group flex items-center justify-between gap-1.5 text-xs font-medium text-slate-900 bg-slate-50/80 hover:bg-amber-50/50 p-1.5 rounded border border-slate-200/80 transition-colors"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-slate-400 text-[11px] w-4 shrink-0">{sIdx + 1}.</span>
                                  <span className="truncate">{staff.name}</span>
                                </div>

                                {/* Direct Quick Move Dropdown (Screen only, hidden on print/export) */}
                                <select
                                  onChange={(e) => handleMoveStaff(staff.id, e.target.value)}
                                  value={alloc.taskId}
                                  className="no-print text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-600 focus:outline-none hover:border-amber-500 cursor-pointer"
                                  title="Quickly move this teacher to another duty station"
                                >
                                  <option value={alloc.taskId} disabled>Move...</option>
                                  {tasks
                                    .filter((t) => t.id !== alloc.taskId)
                                    .map((t) => (
                                      <option key={t.id} value={t.id}>
                                        Move to {t.title}
                                      </option>
                                    ))}
                                  <option value="unassign">Unassign</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Specific Instructions */}
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
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200">
          {/* Important Notice */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 mb-5 sm:mb-6">
            <strong className="font-semibold uppercase tracking-wider">
              Standing Orders & Discipline Guidelines:
            </strong>{' '}
            {schoolMeta.noticeText}
          </div>

          {/* Dual Institutional Signature Lines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pt-2 sm:pt-4">
            <div className="text-center">
              <div className="w-44 sm:w-52 mx-auto border-b border-slate-400 pb-1 mb-1.5 text-xs text-slate-400 italic">
                (Signature & Seal)
              </div>
              <div className="text-xs font-bold text-slate-900">{schoolMeta.preparedBy}</div>
              <div className="text-[11px] text-slate-500">Duty Coordinator / Convener</div>
            </div>

            <div className="text-center">
              <div className="w-44 sm:w-52 mx-auto border-b border-slate-400 pb-1 mb-1.5 text-xs text-slate-400 italic">
                (Signature & Seal)
              </div>
              <div className="text-xs font-bold text-slate-900">{schoolMeta.approvedBy}</div>
              <div className="text-[11px] text-slate-500">Head of Institution</div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: MANUAL SQUAD STAFF ASSIGNMENT */}
      {assignModalTask && currentModalAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-[#0f2b48] px-5 py-4 text-white flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Manual Duty Assignment
                </span>
                <h3 className="font-bold text-base font-institutional truncate">
                  {assignModalTask.title}
                </h3>
                <p className="text-xs text-slate-300">
                  {currentModalAllocation.groupName} • Quota Target: {assignModalTask.requiredCount} Staff
                </p>
              </div>
              <button
                onClick={() => setAssignModalTask(null)}
                className="text-slate-400 hover:text-white cursor-pointer text-lg p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Modal Sub-header / Search */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Search staff by name or subject..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="text-xs font-semibold text-slate-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-md shrink-0">
                {currentModalAllocation.staffIds.length} Assigned
              </div>
            </div>

            {/* Staff List with Checkboxes */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100">
              {staffList
                .filter((s) => s.isActive)
                .filter(
                  (s) =>
                    s.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
                    s.department.toLowerCase().includes(assignSearch.toLowerCase())
                )
                .map((staff) => {
                  const isAssignedToThis = currentModalAllocation.staffIds.includes(staff.id);
                  const currentLocation = getStaffCurrentLocationName(staff.id);

                  return (
                    <div
                      key={staff.id}
                      onClick={() => handleToggleStaffInTask(assignModalTask.id, staff.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors pt-2.5 ${
                        isAssignedToThis
                          ? 'bg-amber-50/80 border border-amber-300'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            isAssignedToThis
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isAssignedToThis && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {staff.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {staff.department} • {staff.role}
                          </div>
                        </div>
                      </div>

                      {/* Current Status Tag */}
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

            {/* Modal Footer */}
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
                className="px-5 py-2 text-xs font-semibold bg-[#0f2b48] hover:bg-[#163b63] text-white rounded-lg shadow-sm cursor-pointer min-h-[38px]"
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
            <div className="bg-[#0f2b48] px-4 sm:px-5 py-3.5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base font-institutional">Swap Staff Duties</h3>
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
                Instantly swap duty stations between any two staff members without disturbing the rest of the schedule.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Staff Member 1
                </label>
                <select
                  value={selectedStaffA}
                  onChange={(e) => setSelectedStaffA(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Staff Member 2 (to swap with)
                </label>
                <select
                  value={selectedStaffB}
                  onChange={(e) => setSelectedStaffB(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
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
                  className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-semibold bg-[#0f2b48] hover:bg-[#163b63] text-white rounded-lg shadow-sm cursor-pointer min-h-[44px]"
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
