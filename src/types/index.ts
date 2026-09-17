export interface StaffMember {
  id: string;
  name: string;
  department: string;
  gender: 'male' | 'female' | 'other';
  role: string;
  phone?: string;
  isActive: boolean;
}

export interface DutyTask {
  id: string;
  title: string;
  location: string;
  description: string;
  timing: string;
  requiredCount: number;
  preferredGender: 'male' | 'female' | 'any';
  badgeColor: string;
}

export interface DutyAllocation {
  taskId: string;
  groupName: string;
  supervisorId?: string;
  staffIds: string[];
  notes?: string;
}

export interface RosterSchedule {
  id: string;
  title: string;
  dateRange: string;
  academicTerm: string;
  generatedAt: string;
  allocations: DutyAllocation[];
}

export interface SchoolMetadata {
  name: string;
  subtitle: string;
  academicYear: string;
  preparedBy: string;
  approvedBy: string;
  noticeText: string;
}

export type ExportFormat = 'excel' | 'pdf' | 'jpg' | 'png' | 'print';

export interface ShuffleOptions {
  balanceDepartments: boolean;
  respectGenderForHostels: boolean;
  autoAssignGroupLeads: boolean;
}
