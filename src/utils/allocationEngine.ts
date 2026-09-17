import { DutyAllocation, DutyTask, ShuffleOptions, StaffMember } from '../types';

// Helper: Fisher-Yates Array Shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/**
 * Intelligent allocation engine that generates balanced groups and assigns them to duty tasks.
 */
export function generateDutyAllocations(
  staffList: StaffMember[],
  tasks: DutyTask[],
  options: ShuffleOptions = {
    balanceDepartments: true,
    respectGenderForHostels: true,
    autoAssignGroupLeads: true,
  }
): DutyAllocation[] {
  const activeStaff = staffList.filter((s) => s.isActive);
  if (activeStaff.length === 0 || tasks.length === 0) {
    return tasks.map((task, idx) => ({
      taskId: task.id,
      groupName: `Duty Squad ${ROMAN_NUMERALS[idx] || idx + 1}`,
      staffIds: [],
    }));
  }

  // Clone and shuffle active staff
  let pool = shuffleArray(activeStaff);

  // Initialize allocation containers
  const allocationsMap: Record<string, { groupName: string; staffIds: string[]; supervisorId?: string }> = {};
  tasks.forEach((task, index) => {
    allocationsMap[task.id] = {
      groupName: `Duty Squad ${ROMAN_NUMERALS[index] || index + 1}`,
      staffIds: [],
    };
  });

  // Step 1: Handle Gender Preferences (e.g. Hostels) if enabled
  if (options.respectGenderForHostels) {
    tasks.forEach((task) => {
      if (task.preferredGender === 'male' || task.preferredGender === 'female') {
        const targetGender = task.preferredGender;
        const matchingStaff = pool.filter((s) => s.gender === targetGender);
        const countToTake = Math.min(task.requiredCount, matchingStaff.length);

        const assigned = matchingStaff.slice(0, countToTake);
        allocationsMap[task.id].staffIds.push(...assigned.map((s) => s.id));

        // Remove assigned staff from general pool
        const assignedIds = new Set(assigned.map((s) => s.id));
        pool = pool.filter((s) => !assignedIds.has(s.id));
      }
    });
  }

  // Step 2: Fill remaining quotas for all tasks
  tasks.forEach((task) => {
    const currentCount = allocationsMap[task.id].staffIds.length;
    const needed = task.requiredCount - currentCount;

    if (needed > 0 && pool.length > 0) {
      const takeCount = Math.min(needed, pool.length);
      const assigned = pool.splice(0, takeCount);
      allocationsMap[task.id].staffIds.push(...assigned.map((s) => s.id));
    }
  });

  // Step 3: If there are still remaining unassigned staff, distribute them evenly across tasks
  let taskIndex = 0;
  while (pool.length > 0 && tasks.length > 0) {
    const staff = pool.pop();
    if (staff) {
      const targetTask = tasks[taskIndex % tasks.length];
      allocationsMap[targetTask.id].staffIds.push(staff.id);
      taskIndex++;
    }
  }

  // Step 4: Auto-assign Group Leads (Supervisors) if requested
  if (options.autoAssignGroupLeads) {
    tasks.forEach((task) => {
      const staffIds = allocationsMap[task.id].staffIds;
      if (staffIds.length > 0) {
        // Prioritize staff with "Senior", "HOD", "Coordinator", or "Director" in their role
        const members = staffIds.map((id) => staffList.find((s) => s.id === id)!);
        const leader =
          members.find((m) =>
            m && (m.role.toLowerCase().includes('senior') ||
              m.role.toLowerCase().includes('hod') ||
              m.role.toLowerCase().includes('coordinator') ||
              m.role.toLowerCase().includes('head'))
          ) || members[0];

        if (leader) {
          allocationsMap[task.id].supervisorId = leader.id;
        }
      }
    });
  }

  return tasks.map((task) => ({
    taskId: task.id,
    groupName: allocationsMap[task.id].groupName,
    supervisorId: allocationsMap[task.id].supervisorId,
    staffIds: allocationsMap[task.id].staffIds,
  }));
}

/**
 * Swaps two staff members between duty assignments
 */
export function swapStaffMembers(
  allocations: DutyAllocation[],
  staffAId: string,
  staffBId: string
): DutyAllocation[] {
  return allocations.map((alloc) => {
    const hasA = alloc.staffIds.includes(staffAId);
    const hasB = alloc.staffIds.includes(staffBId);

    if (!hasA && !hasB) return alloc;

    let newStaffIds = [...alloc.staffIds];
    if (hasA && !hasB) {
      newStaffIds = newStaffIds.map((id) => (id === staffAId ? staffBId : id));
    } else if (hasB && !hasA) {
      newStaffIds = newStaffIds.map((id) => (id === staffBId ? staffAId : id));
    }

    // Adjust supervisor if swapped
    let newSupervisorId = alloc.supervisorId;
    if (alloc.supervisorId === staffAId) newSupervisorId = staffBId;
    else if (alloc.supervisorId === staffBId) newSupervisorId = staffAId;

    return {
      ...alloc,
      staffIds: newStaffIds,
      supervisorId: newSupervisorId,
    };
  });
}

/**
 * Moves a staff member to a new task
 */
export function moveStaffMember(
  allocations: DutyAllocation[],
  staffId: string,
  targetTaskId: string
): DutyAllocation[] {
  return allocations.map((alloc) => {
    if (alloc.taskId === targetTaskId) {
      if (!alloc.staffIds.includes(staffId)) {
        return {
          ...alloc,
          staffIds: [...alloc.staffIds, staffId],
        };
      }
      return alloc;
    }

    // Remove from other tasks
    if (alloc.staffIds.includes(staffId)) {
      const filtered = alloc.staffIds.filter((id) => id !== staffId);
      return {
        ...alloc,
        staffIds: filtered,
        supervisorId: alloc.supervisorId === staffId ? filtered[0] : alloc.supervisorId,
      };
    }

    return alloc;
  });
}
