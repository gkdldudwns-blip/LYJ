import React, { useMemo, useState } from 'react';
import { CATEGORIES } from '../constants';
import { Pose, PoseCategory } from '../types';
import { figureDataUrl } from '../services/figure';
import { Card } from './ui';

type Tab = 'all' | 'favorite' | PoseCategory;

const PoseSection: React.FC<{
  poses: Pose[];
  selected: Set<string>;
  onChangeSelected: (next: Set<string>) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onAddCustom: () => void;
  onDeleteCustom: (id: string) => void;
}> = ({ poses, selected, onChangeSelected, favorites, onToggleFavorite, onAddCustom, onDeleteCustom }) => {
  const [tab, setTab] = useState<Tab>('all');
  const thumbs = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of poses) if (p.figure) map.set(p.id, figureDataUrl(p.figure));
    return map;
  }, [poses]);

  const favSet = useMemo(() => new Set(favorites), [favorites]);
  const visible = poses.filter((p) =>
    tab === 'all' ? true : tab === 'favorite' ? favSet.has(p.id) : p.category === tab,
  );
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: '전체', count: poses.length },
    { id: 'favorite', label: '⭐ 즐겨찾기', count: poses.filter((p) => favSet.has(p.id)).length },
    ...CATEGORIES.map((c) => ({ id: c.id as Tab, label: c.label, count: poses.filter((p) => p.category === c.id).length })),
  ];
  const category = CATEGORIES.find((c) => c.id === tab);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChangeSelected(next);
  };

  const toggleAll = () => {
    const next = new Set(selected);
    for (const p of visible) {
      if (allVisibleSelected) next.delete(p.id);
      else next.add(p.id);
    }
    onChangeSelected(next);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">
          포즈 고르기 <span className="text-slate-400 font-normal">({poses.length}개)</span>
        </h2>
        <div className="flex items-center gap-3 text-sm">
          {selected.size > 0 && (
            <button type="button" onClick={() => onChangeSelected(new Set())} className="text-slate-400 hover:text-slate-600">
              모두 해제
            </button>
          )}
          <button type="button" onClick={toggleAll} className="font-semibold text-purple-600 hover:text-purple-800">
            {allVisibleSelected ? '이 탭 선택 해제' : tab === 'all' ? '전체 선택' : '이 탭 전체 선택'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
              tab === t.id
                ? 'bg-[#c9a9e6] border-[#c9a9e6] text-white font-semibold'
                : 'bg-white border-[#e6dcf1] text-slate-600 hover:border-purple-300'
            }`}
          >
            {t.label} <span className={tab === t.id ? 'text-white/80' : 'text-slate-400'}>{t.count}</span>
          </button>
        ))}
      </div>

      {category && (
        <p className="mt-3 text-sm text-slate-500">
          <span className="font-semibold text-purple-600">{category.role}</span> · {category.description}
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
        {tab === 'custom' && (
          <button
            type="button"
            onClick={onAddCustom}
            className="aspect-square rounded-2xl border-2 border-dashed border-[#dccbee] flex flex-col items-center justify-center text-purple-500 hover:bg-purple-50"
          >
            <span className="text-3xl leading-none">+</span>
            <span className="text-xs font-semibold mt-1">내 포즈 추가</span>
          </button>
        )}
        {visible.map((p) => {
          const on = selected.has(p.id);
          const fav = favSet.has(p.id);
          const thumb = thumbs.get(p.id) ?? p.refImage;
          return (
            <div key={p.id} className="relative">
              <button
                type="button"
                onClick={() => toggle(p.id)}
                aria-pressed={on}
                className={`w-full rounded-2xl border-2 bg-white overflow-hidden transition-all ${
                  on ? 'border-purple-500 ring-4 ring-purple-100' : 'border-[#e6dcf1] hover:border-purple-300'
                }`}
              >
                {thumb ? (
                  <img src={thumb} alt="" className="w-full aspect-square object-contain" draggable={false} />
                ) : (
                  <span className="w-full aspect-square flex items-center justify-center p-3 text-[11px] leading-snug text-slate-500 bg-[#faf7fd]">
                    {p.prompt.slice(0, 40)}
                  </span>
                )}
                <span className={`block text-xs py-1.5 truncate px-1 ${on ? 'text-purple-700 font-bold' : 'text-slate-600'}`}>
                  {p.name}
                </span>
              </button>
              {on && (
                <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center pointer-events-none">
                  ✓
                </span>
              )}
              <button
                type="button"
                onClick={() => onToggleFavorite(p.id)}
                className={`absolute top-1 right-1 w-7 h-7 rounded-full text-base leading-none ${fav ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
                aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기'}
              >
                {fav ? '★' : '☆'}
              </button>
              {p.category === 'custom' && (
                <button
                  type="button"
                  onClick={() => confirm(`'${p.name}' 포즈를 지울까요?`) && onDeleteCustom(p.id)}
                  className="absolute bottom-8 right-1 px-1.5 rounded-md bg-white/90 text-[11px] text-slate-400 hover:text-rose-500"
                >
                  삭제
                </button>
              )}
            </div>
          );
        })}
      </div>
      {tab === 'favorite' && visible.length === 0 && (
        <p className="mt-2 text-sm text-slate-400">☆를 눌러 자주 쓰는 포즈를 모아 두세요.</p>
      )}
    </Card>
  );
};

export default PoseSection;
