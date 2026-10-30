import React from 'react';
import { EXPORT_SIZES } from '../constants';
import { ExportPrefs } from '../services/storage';
import { Toggle } from './ui';

const ExportControls: React.FC<{ prefs: ExportPrefs; onChange: (p: ExportPrefs) => void }> = ({ prefs, onChange }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    <select
      value={prefs.size}
      onChange={(e) => onChange({ ...prefs, size: Number(e.target.value) })}
      className="rounded-xl border border-[#e6dcf1] bg-white px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
      aria-label="저장 크기"
    >
      {EXPORT_SIZES.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
    <Toggle checked={prefs.transparent} onChange={(transparent) => onChange({ ...prefs, transparent })} label="흰 배경 투명하게" />
  </div>
);

export default ExportControls;
