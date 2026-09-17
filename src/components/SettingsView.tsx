import React, { useState } from 'react';
import { School, Save, Check, RotateCcw, Shield } from 'lucide-react';
import { SchoolMetadata } from '../types';
import { DEFAULT_SCHOOL_META } from '../data/sampleData';

interface SettingsViewProps {
  schoolMeta: SchoolMetadata;
  setSchoolMeta: React.Dispatch<React.SetStateAction<SchoolMetadata>>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  schoolMeta,
  setSchoolMeta,
}) => {
  const [formData, setFormData] = useState<SchoolMetadata>({ ...schoolMeta });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolMeta(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('Reset school details to default configuration?')) {
      setFormData(DEFAULT_SCHOOL_META);
      setSchoolMeta(DEFAULT_SCHOOL_META);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0f2b48] text-amber-400 flex items-center justify-center shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-institutional text-slate-900 leading-tight">
                Institution & Letterhead Settings
              </h2>
              <p className="text-xs text-slate-500">
                Configure your school's branding, academic session, and official signatures.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer min-h-[36px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-4 sm:pt-6 space-y-4 sm:space-y-5">
          {/* School Name & Department Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Official School / Institution Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. ST. XAVIER COLLEGIATE ACADEMY"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 min-h-[44px]"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              This will appear in bold institutional lettering on all exported rosters, PDFs, and spreadsheets.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Department / Authority Subtitle
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Office of Discipline & Campus Administration"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Academic Session / Year
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="Academic Session 2026 – 2027"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
              />
            </div>
          </div>

          {/* Signature Block Customization */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-700" />
              Official Verification & Signature Authorities
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Prepared By (Duty Coordinator / Incharge)
                </label>
                <input
                  type="text"
                  value={formData.preparedBy}
                  onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                  placeholder="e.g. Vice Principal (Administration)"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Approved By (Principal / Headmaster)
                </label>
                <input
                  type="text"
                  value={formData.approvedBy}
                  onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                  placeholder="e.g. Principal & Headmaster"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Standing Instructions */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notice / Standing Orders (Appears on bottom of exports)
            </label>
            <textarea
              rows={3}
              value={formData.noticeText}
              onChange={(e) => setFormData({ ...formData, noticeText: e.target.value })}
              placeholder="All assigned staff members are requested to report 15 minutes prior to shift commencement..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-md border border-emerald-200">
                <Check className="w-4 h-4" />
                Settings saved successfully!
              </span>
            ) : (
              <span className="text-xs text-slate-400 text-center sm:text-left">
                Changes are saved to your browser automatically.
              </span>
            )}

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f2b48] hover:bg-[#163b63] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>Save Institution Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
