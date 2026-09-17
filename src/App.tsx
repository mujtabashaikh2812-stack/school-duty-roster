import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RosterTable } from './components/RosterTable';
import { StaffManager } from './components/StaffManager';
import { TaskManager } from './components/TaskManager';
import { SettingsView } from './components/SettingsView';
import { DutyAllocation, DutyTask, SchoolMetadata, ShuffleOptions, StaffMember } from './types';
import { DEFAULT_ALLOCATIONS, DEFAULT_SCHOOL_META, DEFAULT_TASKS, SAMPLE_STAFF } from './data/sampleData';
import { generateDutyAllocations } from './utils/allocationEngine';
import { Shield } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'roster' | 'staff' | 'tasks' | 'settings'>('roster');

  // Staff State with LocalStorage
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('eduroster_staff_list_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return SAMPLE_STAFF;
      }
    }
    return SAMPLE_STAFF;
  });

  // Tasks / Duty Stations State with LocalStorage
  const [tasks, setTasks] = useState<DutyTask[]>(() => {
    const saved = localStorage.getItem('eduroster_duty_tasks_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_TASKS;
      }
    }
    return DEFAULT_TASKS;
  });

  // School Metadata with LocalStorage
  const [schoolMeta, setSchoolMeta] = useState<SchoolMetadata>(() => {
    const saved = localStorage.getItem('eduroster_school_meta_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SCHOOL_META;
      }
    }
    return DEFAULT_SCHOOL_META;
  });

  // Shuffle Options with LocalStorage
  const [shuffleOptions, setShuffleOptions] = useState<ShuffleOptions>(() => {
    const saved = localStorage.getItem('eduroster_shuffle_options_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          balanceDepartments: false,
          respectGenderForHostels: true,
          autoAssignGroupLeads: false,
        };
      }
    }
    return {
      balanceDepartments: false,
      respectGenderForHostels: true,
      autoAssignGroupLeads: false,
    };
  });

  // Allocations State with LocalStorage
  const [allocations, setAllocations] = useState<DutyAllocation[]>(() => {
    const saved = localStorage.getItem('eduroster_allocations_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_ALLOCATIONS;
      }
    }
    return DEFAULT_ALLOCATIONS;
  });

  const [isShuffling, setIsShuffling] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('eduroster_staff_list_v2', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem('eduroster_duty_tasks_v2', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('eduroster_school_meta_v2', JSON.stringify(schoolMeta));
  }, [schoolMeta]);

  useEffect(() => {
    localStorage.setItem('eduroster_shuffle_options_v2', JSON.stringify(shuffleOptions));
  }, [shuffleOptions]);

  useEffect(() => {
    localStorage.setItem('eduroster_allocations_v2', JSON.stringify(allocations));
  }, [allocations]);

  // Shuffling & Reallocation Execution
  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const newAllocations = generateDutyAllocations(staffList, tasks, shuffleOptions);
      setAllocations(newAllocations);
      setIsShuffling(false);
    }, 280);
  };

  // Re-synchronize when staff or tasks are modified
  const handleDataUpdated = () => {
    const newAllocations = generateDutyAllocations(staffList, tasks, shuffleOptions);
    setAllocations(newAllocations);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Institutional Top Navbar */}
      <Navbar
        schoolMeta={schoolMeta}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onShuffle={handleShuffle}
        isShuffling={isShuffling}
        staffCount={staffList.length}
        tasksCount={tasks.length}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeTab === 'roster' && (
          <RosterTable
            allocations={allocations}
            setAllocations={setAllocations}
            tasks={tasks}
            staffList={staffList}
            schoolMeta={schoolMeta}
            onShuffle={handleShuffle}
            isShuffling={isShuffling}
            shuffleOptions={shuffleOptions}
            setShuffleOptions={setShuffleOptions}
          />
        )}

        {activeTab === 'staff' && (
          <StaffManager
            staffList={staffList}
            setStaffList={setStaffList}
            onStaffUpdated={handleDataUpdated}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskManager
            tasks={tasks}
            setTasks={setTasks}
            onTasksUpdated={handleDataUpdated}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            schoolMeta={schoolMeta}
            setSchoolMeta={setSchoolMeta}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#162d59]" />
            <span className="font-semibold text-slate-700">{schoolMeta.name}</span>
            <span>• Duty Allocation System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Official Portrait & PDF Layout</span>
            <span>•</span>
            <span>Client Side Local Data</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
