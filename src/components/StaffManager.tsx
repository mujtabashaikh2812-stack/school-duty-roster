import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  UserPlus,
  Trash2,
  Upload,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Edit2,
  Download,
  RotateCcw,
  Phone,
  Tag
} from 'lucide-react';
import { StaffMember } from '../types';
import { SAMPLE_STAFF } from '../data/sampleData';

interface StaffManagerProps {
  staffList: StaffMember[];
  setStaffList: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  onStaffUpdated: () => void;
}

export const StaffManager: React.FC<StaffManagerProps> = ({
  staffList,
  setStaffList,
  onStaffUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form State for Single Staff Add/Edit
  const [formData, setFormData] = useState<{
    name: string;
    department: string;
    gender: 'male' | 'female' | 'other';
    role: string;
    phone: string;
  }>({
    name: '',
    department: 'General Faculty',
    gender: 'male',
    role: 'Teacher',
    phone: '',
  });

  // Bulk Paste Text State
  const [pasteText, setPasteText] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered staff list
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      filterDepartment === 'all' || s.department.toLowerCase().includes(filterDepartment.toLowerCase());

    return matchesSearch && matchesDept;
  });

  // Unique departments for filter dropdown
  const departments = Array.from(new Set(staffList.map((s) => s.department))).filter(Boolean);

  // Add or Edit staff member
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingStaff) {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? {
                ...s,
                name: formData.name.trim(),
                department: formData.department.trim() || 'Faculty',
                gender: formData.gender,
                role: formData.role.trim() || 'Teacher',
                phone: formData.phone.trim(),
              }
            : s
        )
      );
      setEditingStaff(null);
    } else {
      const newStaff: StaffMember = {
        id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: formData.name.trim(),
        department: formData.department.trim() || 'Faculty',
        gender: formData.gender,
        role: formData.role.trim() || 'Teacher',
        phone: formData.phone.trim(),
        isActive: true,
      };
      setStaffList((prev) => [newStaff, ...prev]);
    }

    setFormData({
      name: '',
      department: 'General Faculty',
      gender: 'male',
      role: 'Teacher',
      phone: '',
    });
    setIsAddModalOpen(false);
    onStaffUpdated();
  };

  const handleEditClick = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      department: staff.department,
      gender: staff.gender,
      role: staff.role,
      phone: staff.phone || '',
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the school staff directory?`)) {
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      onStaffUpdated();
    }
  };

  const toggleStaffStatus = (id: string) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
    onStaffUpdated();
  };

  // Bulk Excel/CSV File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonRows.length === 0) {
          alert('The uploaded spreadsheet appears to be empty.');
          return;
        }

        let startIndex = 0;
        let nameCol = 0;
        let deptCol = 1;
        let roleCol = 2;
        let genderCol = 3;
        let phoneCol = 4;

        const firstRow = jsonRows[0].map((c) => String(c).toLowerCase().trim());
        if (
          firstRow.some((c) =>
            c.includes('name') || c.includes('staff') || c.includes('teacher') || c.includes('faculty')
          )
        ) {
          startIndex = 1;
          firstRow.forEach((val, idx) => {
            if (val.includes('name') || val.includes('staff') || val.includes('teacher')) nameCol = idx;
            else if (val.includes('dept') || val.includes('subject')) deptCol = idx;
            else if (val.includes('role') || val.includes('designation') || val.includes('post')) roleCol = idx;
            else if (val.includes('gender') || val.includes('sex')) genderCol = idx;
            else if (val.includes('phone') || val.includes('contact') || val.includes('mobile')) phoneCol = idx;
          });
        }

        const newStaffList: StaffMember[] = [];
        for (let i = startIndex; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || !row[nameCol]) continue;
          const rawName = String(row[nameCol]).trim();
          if (!rawName) continue;

          const rawDept = row[deptCol] ? String(row[deptCol]).trim() : 'General';
          const rawRole = row[roleCol] ? String(row[roleCol]).trim() : 'Teacher';
          const rawGender = row[genderCol] ? String(row[genderCol]).toLowerCase().trim() : 'any';
          const rawPhone = row[phoneCol] ? String(row[phoneCol]).trim() : '';

          let gender: 'male' | 'female' | 'other' = 'male';
          if (
            rawGender.includes('f') ||
            rawGender.includes('female') ||
            rawGender.includes('woman') ||
            rawName.includes('Mrs.') ||
            rawName.includes('Ms.') ||
            rawName.includes('Sister')
          ) {
            gender = 'female';
          }

          newStaffList.push({
            id: `st-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 3)}`,
            name: rawName,
            department: rawDept,
            gender,
            role: rawRole,
            phone: rawPhone,
            isActive: true,
          });
        }

        if (newStaffList.length > 0) {
          setStaffList((prev) => [...newStaffList, ...prev]);
          alert(`Successfully imported ${newStaffList.length} staff members from ${file.name}!`);
          setIsBulkModalOpen(false);
          onStaffUpdated();
        } else {
          alert('Could not find any staff names in the uploaded document.');
        }
      } catch (err) {
        console.error('File parsing error:', err);
        alert('Error parsing file. Please ensure it is a valid .xlsx or .csv spreadsheet.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Bulk Raw Text Paste Handler
  const handlePasteImport = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const newStaffList: StaffMember[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(',').map((p) => p.trim());
      const name = parts[0];
      const dept = parts[1] || 'General';
      const role = parts[2] || 'Teacher';

      if (name) {
        let gender: 'male' | 'female' | 'other' = 'male';
        if (
          name.startsWith('Ms.') ||
          name.startsWith('Mrs.') ||
          name.startsWith('Sister') ||
          (parts[3] && parts[3].toLowerCase().startsWith('f'))
        ) {
          gender = 'female';
        }

        newStaffList.push({
          id: `st-paste-${Date.now()}-${idx}`,
          name,
          department: dept,
          gender,
          role,
          phone: '',
          isActive: true,
        });
      }
    });

    if (newStaffList.length > 0) {
      setStaffList((prev) => [...newStaffList, ...prev]);
      setPasteFeedback(`Successfully added ${newStaffList.length} staff members.`);
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setPasteText('');
        setPasteFeedback(null);
        onStaffUpdated();
      }, 900);
    }
  };

  const handleLoadSampleData = () => {
    if (
      staffList.length === 0 ||
      window.confirm('Load 20 standard school staff members? (This will replace existing records with sample data)')
    ) {
      setStaffList(SAMPLE_STAFF);
      onStaffUpdated();
    }
  };

  const downloadSampleTemplate = () => {
    const templateData = [
      ['Staff Full Name', 'Department / Subject', 'Role / Designation', 'Gender (Male/Female)', 'Contact Phone'],
      ['Dr. Arthur Mitchell', 'Physics', 'Senior PGT', 'Male', '+1 987-555-0101'],
      ['Mrs. Evelyn Davenport', 'Mathematics', 'HOD Mathematics', 'Female', '+1 987-555-0102'],
      ['Mr. Rajesh Sharma', 'Physical Education', 'Sports Director', 'Male', '+1 987-555-0103'],
      ['Sister Beatrice Lopez', 'Value Education', 'House Mistress', 'Female', '+1 987-555-0108'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{ wch: 25 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff_Import_Template');
    XLSX.writeFile(wb, 'School_Staff_Upload_Template.xlsx');
  };

  const activeCount = staffList.filter((s) => s.isActive).length;
  const maleCount = staffList.filter((s) => s.gender === 'male').length;
  const femaleCount = staffList.filter((s) => s.gender === 'female').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Metric Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-800">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold font-institutional tracking-wide">
                Faculty & Staff Directory
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Maintain school teaching faculty, wardens, administrative personnel, and duty statuses.
            </p>
          </div>

          {/* Action buttons (Mobile Full-width Stack) */}
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingStaff(null);
                setFormData({
                  name: '',
                  department: 'General Faculty',
                  gender: 'male',
                  role: 'Teacher',
                  phone: '',
                });
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#0f2b48] hover:bg-[#163b63] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[42px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>

            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer min-h-[42px]"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Upload Excel / Paste</span>
            </button>

            <button
              onClick={handleLoadSampleData}
              title="Reset to 20 realistic sample school teachers"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 min-h-[38px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load 20 Sample Staff</span>
            </button>
          </div>
        </div>

        {/* Directory Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-3.5 border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-200/80">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Enrolled</span>
            <div className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5">{staffList.length}</div>
          </div>
          <div className="bg-emerald-50/60 p-2.5 sm:p-3 rounded-lg border border-emerald-200/60">
            <span className="text-[10px] sm:text-xs font-medium text-emerald-700 uppercase tracking-wider">Active</span>
            <div className="text-lg sm:text-xl font-bold text-emerald-800 mt-0.5">{activeCount}</div>
          </div>
          <div className="bg-blue-50/60 p-2.5 sm:p-3 rounded-lg border border-blue-200/60">
            <span className="text-[10px] sm:text-xs font-medium text-blue-700 uppercase tracking-wider">Male</span>
            <div className="text-lg sm:text-xl font-bold text-blue-800 mt-0.5">{maleCount}</div>
          </div>
          <div className="bg-rose-50/60 p-2.5 sm:p-3 rounded-lg border border-rose-200/60">
            <span className="text-[10px] sm:text-xs font-medium text-rose-700 uppercase tracking-wider">Female</span>
            <div className="text-lg sm:text-xl font-bold text-rose-800 mt-0.5">{femaleCount}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search faculty name, subject, role..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-slate-50/50 min-h-[40px]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 min-h-[40px]"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {staffList.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Remove ALL staff members from the list?')) {
                    setStaffList([]);
                    onStaffUpdated();
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-2 rounded hover:bg-rose-50 transition-colors whitespace-nowrap cursor-pointer min-h-[40px]"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE STAFF CARDS VIEW (Under 768px screens) */}
      <div className="block md:hidden space-y-2.5">
        {filteredStaff.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-sm text-slate-700">No staff members found.</p>
          </div>
        ) : (
          filteredStaff.map((staff, idx) => (
            <div
              key={staff.id}
              className={`bg-white rounded-xl shadow-2xs border border-slate-200 p-3.5 transition-all ${
                !staff.isActive ? 'opacity-65 bg-slate-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                    <h3 className="font-bold text-sm text-slate-900 truncate">{staff.name}</h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{staff.role}</div>
                </div>

                {/* Status Toggle Badge */}
                <button
                  onClick={() => toggleStaffStatus(staff.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                    staff.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {staff.isActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>On Leave</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                  {staff.department}
                </span>

                <span
                  className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${
                    staff.gender === 'female'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {staff.gender.toUpperCase()}
                </span>

                {staff.phone && (
                  <a
                    href={`tel:${staff.phone}`}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-amber-700 ml-auto"
                  >
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{staff.phone}</span>
                  </a>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleEditClick(staff)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteStaff(staff.id, staff.name)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP / TABLET STAFF TABLE (Screens >= 768px) */}
      <div className="hidden md:block bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0f2b48] text-white text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Faculty / Staff Name</th>
                <th className="py-3 px-4">Department / Discipline</th>
                <th className="py-3 px-4">Designation / Role</th>
                <th className="py-3 px-4 text-center">Gender</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Duty Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No staff members found.</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff, idx) => (
                  <tr
                    key={staff.id}
                    className={`hover:bg-amber-50/30 transition-colors ${
                      !staff.isActive ? 'opacity-60 bg-slate-50/80' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center text-xs font-semibold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{staff.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{staff.id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {staff.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{staff.role}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                          staff.gender === 'female'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {staff.gender.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{staff.phone || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleStaffStatus(staff.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          staff.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {staff.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-500" />
                            <span>On Leave</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(staff)}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                        title="Edit Staff Member"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staff.id, staff.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete Staff Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT STAFF (MOBILE OPTIMIZED SCROLLABLE) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#0f2b48] px-4 sm:px-5 py-3.5 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm sm:text-base font-institutional">
                {editingStaff ? 'Edit Staff Member' : 'Register New Faculty'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Arthur Mitchell"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Department / Subject
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Mathematics"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Role / Designation
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Senior Teacher / HOD"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white min-h-[44px]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / Extension
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +1 555-0192"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-sm cursor-pointer min-h-[44px]"
                >
                  {editingStaff ? 'Save Changes' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK FILE UPLOAD & PASTE INGESTION (MOBILE OPTIMIZED) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#0f2b48] px-4 sm:px-5 py-3.5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base font-institutional">Import Staff Directory</h3>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Option 1: File Upload */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  Upload Excel (.xlsx, .xls) or CSV
                </h4>
                <p className="text-xs text-slate-500 mb-2.5">
                  Upload an existing spreadsheet containing staff names, departments, and roles.
                </p>

                <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-4 sm:p-5 text-center bg-slate-50 hover:bg-amber-50/20 transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="staff-file-input"
                  />
                  <label htmlFor="staff-file-input" className="cursor-pointer block">
                    <Upload className="w-7 h-7 text-amber-600 mx-auto mb-1.5" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 block">
                      Choose Excel (.xlsx) or CSV file
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Tap here to browse files on your device
                    </span>
                  </label>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sample reference:</span>
                  <button
                    onClick={downloadSampleTemplate}
                    className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Sample Excel
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-semibold">Or Quick Paste</span>
                </div>
              </div>

              {/* Option 2: Copy Paste */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  Paste Staff Names List
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  Paste staff names (one per line, e.g. <code>Name, Department, Role</code>):
                </p>

                <textarea
                  rows={4}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Dr. Arthur Mitchell, Physics, Senior PGT\nMrs. Evelyn Davenport, Mathematics, HOD\nMr. Rajesh Sharma, Sports, Director`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />

                {pasteFeedback && (
                  <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {pasteFeedback}
                  </div>
                )}

                <div className="mt-2.5 flex justify-end">
                  <button
                    onClick={handlePasteImport}
                    disabled={!pasteText.trim()}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold bg-[#0f2b48] hover:bg-[#163b63] disabled:opacity-50 text-white rounded-lg shadow-sm cursor-pointer min-h-[42px]"
                  >
                    Add Pasted Staff
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
