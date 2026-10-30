import React from 'react';
import { Page } from '../types';

const NAV: { id: Page; label: string }[] = [
  { id: 'studio', label: '포즈 생성기' },
  { id: 'gallery', label: '내 갤러리' },
  { id: 'guide', label: '사용법' },
];

// 휴대폰: 윗줄에 이름·설정, 아랫줄에 메뉴 / 넓은 화면: 한 줄
const Header: React.FC<{
  page: Page;
  onNavigate: (p: Page) => void;
  onOpenSettings: () => void;
  hasKey: boolean;
  running: number;
}> = ({ page, onNavigate, onOpenSettings, hasKey, running }) => (
  <header className="sticky top-0 z-40 bg-[#ede3f7]/90 backdrop-blur border-b border-[#e2d4f0]">
    <div className="max-w-5xl mx-auto px-4 pt-3 sm:pt-0 sm:h-16 flex flex-wrap items-center gap-x-6">
      <button
        onClick={() => onNavigate('studio')}
        className="shrink-0 px-3.5 py-1 rounded-full border-2 border-purple-300 bg-white/70 font-display text-purple-500 text-lg tracking-wide"
      >
        Jooniver<span className="text-purple-300">studio</span>
      </button>
      <nav className="order-3 sm:order-none w-full sm:w-auto flex justify-around sm:justify-start sm:gap-4 mt-1 sm:mt-0 text-[15px]">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => onNavigate(n.id)}
            className={`whitespace-nowrap px-2 py-2 sm:py-1 border-b-2 sm:border-b-0 ${
              page === n.id ? 'text-purple-600 font-bold border-purple-500' : 'text-slate-700 hover:text-purple-600 border-transparent'
            }`}
          >
            {n.label}
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
        className="ml-auto shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-purple-200 text-sm font-semibold text-purple-700 hover:bg-purple-50"
      >
        <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-500' : 'bg-amber-400'}`} aria-hidden="true" />
        설정
      </button>
    </div>
  </header>
);

export default Header;
