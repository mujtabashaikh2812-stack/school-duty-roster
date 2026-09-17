import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { DutyTask } from '../types';
import { DEFAULT_TASKS } from '../data/sampleData';

interface TaskManagerProps {
  tasks: DutyTask[];
  setTasks: React.Dispatch<React.SetStateAction<DutyTask[]>>;
  onTasksUpdated: () => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  setTasks,
  onTasksUpdated,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DutyTask | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    location: string;
    description: string;
    timing: string;
    requiredCount: number;
    preferredGender: 'male' | 'female' | 'any';
    badgeColor: string;
  }>({
    title: '',
    location: '',
    description: '',
    timing: '08:00 AM - 02:30 PM',
    requiredCount: 3,
    preferredGender: 'any',
    badgeColor: 'blue',
  });

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: formData.title.trim(),
                location: formData.location.trim() || 'Campus Wing',
                description: formData.description.trim(),
                timing: formData.timing.trim() || 'Standard Hours',
                requiredCount: Number(formData.requiredCount) || 2,
                preferredGender: formData.preferredGender,
                badgeColor: formData.badgeColor,
              }
            : t
        )
      );
      setEditingTask(null);
    } else {
      const newTask: DutyTask = {
        id: `task-${Date.now()}`,
        title: formData.title.trim(),
        location: formData.location.trim() || 'Campus Wing',
        description: formData.description.trim(),
        timing: formData.timing.trim() || 'Standard Hours',
        requiredCount: Number(formData.requiredCount) || 2,
        preferredGender: formData.preferredGender,
        badgeColor: formData.badgeColor,
      };
      setTasks((prev) => [...prev, newTask]);
    }

    setFormData({
      title: '',
      location: '',
      description: '',
      timing: '08:00 AM - 02:30 PM',
      requiredCount: 3,
      preferredGender: 'any',
      badgeColor: 'blue',
    });
    setIsModalOpen(false);
    onTasksUpdated();
  };

  const handleEditClick = (task: DutyTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      location: task.location,
      description: task.description,
      timing: task.timing,
      requiredCount: task.requiredCount,
      preferredGender: task.preferredGender,
      badgeColor: task.badgeColor || 'blue',
    });
    setIsModalOpen(true);
  };

  const handleDeleteTask = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove duty station "${title}"?`)) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      onTasksUpdated();
    }
  };

  const handleResetDefaultTasks = () => {
    if (window.confirm('Reset duty stations to the 5 default school duties (Building 1, Building 2, Garden, Hostels)?')) {
      setTasks(DEFAULT_TASKS);
      onTasksUpdated();
    }
  };

  const totalRequiredHeadcount = tasks.reduce((sum, t) => sum + t.requiredCount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-800">
              <Building2 className="w-6 h-6 text-amber-700" />
              <h2 className="text-xl font-bold font-institutional tracking-wide">
                Duty Stations & Campus Task Areas
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Configure campus locations, residential wings, shift hours, and target staff allocations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setEditingTask(null);
                setFormData({
                  title: '',
                  location: '',
                  description: '',
                  timing: '08:00 AM - 02:30 PM',
                  requiredCount: 3,
                  preferredGender: 'any',
                  badgeColor: 'blue',
                });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0f2b48] hover:bg-[#163b63] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Duty Station</span>
            </button>

            <button
              onClick={handleResetDefaultTasks}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
              title="Reset to 5 default school duty areas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Defaults</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Duty Areas</span>
            <div className="text-xl font-bold text-slate-800 mt-0.5">{tasks.length}</div>
          </div>
          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">Target Staff Quota</span>
            <div className="text-xl font-bold text-amber-800 mt-0.5">{totalRequiredHeadcount}</div>
          </div>
          <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-200/60 col-span-2 sm:col-span-1">
            <span className="text-xs font-medium text-indigo-700 uppercase tracking-wider">Average Group Size</span>
            <div className="text-xl font-bold text-indigo-800 mt-0.5">
              {tasks.length > 0 ? (totalRequiredHeadcount / tasks.length).toFixed(1) : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 hover:border-slate-300 transition-all relative overflow-hidden"
          >
            {/* Top Accent Strip */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                task.badgeColor === 'blue'
                  ? 'bg-blue-600'
                  : task.badgeColor === 'indigo'
                  ? 'bg-indigo-600'
                  : task.badgeColor === 'emerald'
                  ? 'bg-emerald-600'
                  : task.badgeColor === 'amber'
                  ? 'bg-amber-600'
                  : task.badgeColor === 'rose'
                  ? 'bg-rose-600'
                  : 'bg-slate-600'
              }`}
            />

            <div className="flex items-start justify-between gap-2 mb-2 pt-1">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Duty Area {index + 1}
                </span>
                <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEditClick(task)}
                  className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="Edit Duty Station"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id, task.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="Delete Duty Station"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{task.location}</span>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {task.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{task.timing}</span>
              </div>

              <div className="flex items-center gap-2">
                {task.preferredGender !== 'any' && (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      task.preferredGender === 'male'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {task.preferredGender === 'male' ? 'Boys Hostel Pref' : 'Girls Hostel Pref'}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  {task.requiredCount} Staff
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ADD / EDIT DUTY TASK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-[#0f2b48] px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base font-institutional">
                {editingTask ? 'Edit Duty Station' : 'Create New Duty Station'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Duty Name / Task *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. School (Building 1) or Hostel (Boys)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Specific Location / Wing
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Block A, Floors 1 & 2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Duty Hours / Shift
                  </label>
                  <input
                    type="text"
                    value={formData.timing}
                    onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                    placeholder="07:45 AM - 02:30 PM"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Required Staff Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formData.requiredCount}
                    onChange={(e) => setFormData({ ...formData, requiredCount: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Gender Preference
                  </label>
                  <select
                    value={formData.preferredGender}
                    onChange={(e) =>
                      setFormData({ ...formData, preferredGender: e.target.value as 'male' | 'female' | 'any' })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white"
                  >
                    <option value="any">Any (Co-ed / Default)</option>
                    <option value="male">Male (Boys Hostel)</option>
                    <option value="female">Female (Girls Hostel)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Theme Color
                  </label>
                  <select
                    value={formData.badgeColor}
                    onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white"
                  >
                    <option value="blue">Collegiate Blue</option>
                    <option value="indigo">Royal Indigo</option>
                    <option value="emerald">Campus Green</option>
                    <option value="amber">Warm Gold</option>
                    <option value="rose">Burgundy / Rose</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Task Responsibilities / Scope
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Monitor corridors, ensure morning assembly discipline..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
