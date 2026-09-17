import { DutyTask, StaffMember, SchoolMetadata, DutyAllocation } from '../types';

export const DEFAULT_TASKS: DutyTask[] = [
  {
    id: 'task-1',
    title: 'School (Building 1)',
    location: '[CAMPUS WING]',
    description: 'Corridor surveillance, morning assembly discipline, and classroom order.',
    timing: '07:45 AM - 02:30 PM',
    requiredCount: 5,
    preferredGender: 'any',
    badgeColor: 'blue',
  },
  {
    id: 'task-2',
    title: 'School (Building 2)',
    location: '[CAMPUS WING]',
    description: 'Lab transition monitoring, recess crowd control, and gate security oversight.',
    timing: '08:00 AM - 03:00 PM',
    requiredCount: 5,
    preferredGender: 'any',
    badgeColor: 'indigo',
  },
  {
    id: 'task-3',
    title: 'Garden & Cleaning',
    location: '[CAMPUS WING]',
    description: 'Outdoor campus cleanliness, playfields, and garden maintenance supervision.',
    timing: '10:30 AM - 03:30 PM',
    requiredCount: 3,
    preferredGender: 'any',
    badgeColor: 'emerald',
  },
  {
    id: 'task-4',
    title: 'Hostel (Boys)',
    location: '[CAMPUS WING]',
    description: 'Evening study hall monitoring, dining hall discipline, and night roll call.',
    timing: '05:30 PM - 10:00 PM',
    requiredCount: 3,
    preferredGender: 'any',
    badgeColor: 'amber',
  },
  {
    id: 'task-5',
    title: 'Hostel (Girls)',
    location: '[CAMPUS WING]',
    description: 'Evening study hall monitoring, dining hall discipline, and night roll call.',
    timing: '05:30 PM - 10:00 PM',
    requiredCount: 3,
    preferredGender: 'female',
    badgeColor: 'rose',
  },
];

export const SAMPLE_STAFF: StaffMember[] = [
  // Building 1 Staff
  { id: 'st-1', name: 'Mrs. Jyoti Pawar', department: 'Faculty', gender: 'female', role: 'Teacher', isActive: true },
  { id: 'st-2', name: 'Mr. Rohan Chaugule', department: 'Faculty', gender: 'male', role: 'Teacher', isActive: true },
  { id: 'st-3', name: 'Mrs. Rajashri Kandhare', department: 'Faculty', gender: 'female', role: 'Teacher', isActive: true },
  { id: 'st-4', name: 'Mrs. Reshma Sawanth', department: 'Faculty', gender: 'female', role: 'Teacher', isActive: true },
  { id: 'st-5', name: 'Mrs. Manisha Gharge', department: 'Faculty', gender: 'female', role: 'Teacher', isActive: true },

  // Building 2 Staff
  { id: 'st-6', name: 'Mrs. Aruna Shinde', department: 'Faculty', gender: 'female', role: 'Teacher', isActive: true },
  { id: 'st-7', name: 'Mrs. Vaishali Rajguru', department: 'Faculty', gender: 'female', role: 'Teacher', isActive: true },
  { id: 'st-8', name: 'Mrs. Vaishali Koli', department: 'Faculty', gender: 'female', role: 'Teacher', isActive: true },
  { id: 'st-9', name: 'Mrs. Suvarna Jadhav', department: 'Faculty', gender: 'female', role: 'Teacher', isActive: true },
  { id: 'st-10', name: 'Mrs. Kastura Bhosale', department: 'Faculty', gender: 'female', role: 'Teacher', isActive: true },

  // Garden & Cleaning Staff
  { id: 'st-11', name: 'Mrs. Rekha Bhosale', department: 'Maintenance & Campus', gender: 'female', role: 'Staff', isActive: true },
  { id: 'st-12', name: 'Mrs. Manisha Sarawade', department: 'Maintenance & Campus', gender: 'female', role: 'Staff', isActive: true },
  { id: 'st-13', name: 'Mrs. Savita Rokade', department: 'Maintenance & Campus', gender: 'female', role: 'Staff', isActive: true },

  // Hostel (Boys) Staff
  { id: 'st-14', name: 'Mrs. Varsha Survase', department: 'Residential Warden', gender: 'female', role: 'Warden', isActive: true },
  { id: 'st-15', name: 'Mrs. Surekha Hande', department: 'Residential Warden', gender: 'female', role: 'Warden', isActive: true },
  { id: 'st-16', name: 'Mrs. Pooja Pawar', department: 'Residential Warden', gender: 'female', role: 'Warden', isActive: true },

  // Hostel (Girls) Staff
  { id: 'st-17', name: 'Mrs. Alka Pawar', department: 'Residential Warden', gender: 'female', role: 'Warden', isActive: true },
  { id: 'st-18', name: 'Mrs. Laxmi Salinkhe', department: 'Residential Warden', gender: 'female', role: 'Warden', isActive: true },
  { id: 'st-19', name: 'Mrs. Sakubai Waghmode', department: 'Residential Warden', gender: 'female', role: 'Warden', isActive: true },
];

export const DEFAULT_ALLOCATIONS: DutyAllocation[] = [
  { taskId: 'task-1', groupName: 'Squad 1', staffIds: ['st-1', 'st-2', 'st-3', 'st-4', 'st-5'] },
  { taskId: 'task-2', groupName: 'Squad 2', staffIds: ['st-6', 'st-7', 'st-8', 'st-9', 'st-10'] },
  { taskId: 'task-3', groupName: 'Squad 3', staffIds: ['st-11', 'st-12', 'st-13'] },
  { taskId: 'task-4', groupName: 'Squad 4', staffIds: ['st-14', 'st-15', 'st-16'] },
  { taskId: 'task-5', groupName: 'Squad 5', staffIds: ['st-17', 'st-18', 'st-19'] },
];

export const DEFAULT_SCHOOL_META: SchoolMetadata = {
  name: 'SINHGAD PUBLIC SCHOOL KEGAON',
  subtitle: 'Sinhgad Public School, Kegaon',
  academicYear: 'ACADEMIC SESSION 2026 – 2027',
  preparedBy: 'VICE PRINCIPAL (ADMINISTRATION)',
  approvedBy: 'PRINCIPAL',
  noticeText: 'All assigned staff members are requested to report 15 minutes prior to shift commencement. Absence or swap must be sanctioned 24 hours in advance by the Principal Office.',
};
