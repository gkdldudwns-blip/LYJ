import React from 'react';
import { Page } from '../types';

const NAV: { id: Page; label: string; short: string }[] = [
  { id: 'studio', label: '포즈 생성기', short: '생성기' },
  { id: 'gallery', label: '내 갤러리', short: '갤러리' },
  { id: 'guide', label: '사용법', short: '사용법' },
];

const Header: React.FC<{
  page: Page;
  onNavigate: (p: Page) => void;
  onOpenSettings: () => void;
  hasKey: boolean;
  running: number;
}> = ({ page, onNavigate, onOpenSettings, hasKey, running }) => (
  <header className="sticky top-0 z-40 bg-[#ede3f7]/90 backdrop-blur border-b border-[#e2d4f0]">
    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-2 sm:gap-6">
      <button
        onClick={() => onNavigate('studio')}
        className="shrink-0 px-2.5 sm:px-3.5 py-1 rounded-full border-2 border-purple-300 bg-white/70 font-display text-purple-500 text-base sm:text-lg sm:tracking-wide"
      >
        Pose<span className="text-purple-300">.</span>studio
      </button>
      <nav className="flex sm:gap-4 overflow-x-auto text-sm sm:text-[15px]">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => onNavigate(n.id)}
            className={`whitespace-nowrap px-1.5 sm:px-2 py-1 rounded-lg ${
              page === n.id ? 'text-purple-600 font-bold' : 'text-slate-700 hover:text-purple-600'
            }`}
          >
            <span className="sm:hidden">{n.short}</span>
            <span className="hidden sm:inline">{n.label}</span>
            {n.id === 'studio' && running > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-purple-600 text-white text-[11px] align-middle">
                {running}
              </span>
            )}
          </button>
        ))}
      </nav>
      <button
        onClick={onOpenSettings}
        className="ml-auto shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white border border-purple-200 text-sm font-semibold text-purple-700 hover:bg-purple-50"
        aria-label="설정"
      >
        <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-500' : 'bg-amber-400'}`} aria-hidden="true" />
        <span className="hidden sm:inline">설정</span>
        <span className="sm:hidden" aria-hidden="true">⚙</span>
      </button>
    </div>
  </header>
);

export default Header;
