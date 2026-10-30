import React, { useMemo, useState } from 'react';
import { ResultItem } from '../types';
import { ExportPrefs } from '../services/storage';
import ExportControls from './ExportControls';
import { Card } from './ui';

const Gallery: React.FC<{
  results: ResultItem[];
  prefs: ExportPrefs;
  onChangePrefs: (p: ExportPrefs) => void;
  onOpen: (item: ResultItem) => void;
  onDownloadZip: (items: ResultItem[]) => void;
  onAddReference: (items: ResultItem[]) => void;
  onDelete: (items: ResultItem[]) => void;
  onGoStudio: () => void;
}> = ({ results, prefs, onChangePrefs, onOpen, onDownloadZip, onAddReference, onDelete, onGoStudio }) => {
  const [character, setCharacter] = useState('all');
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const characters = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of results) map.set(r.characterId, r.characterName);
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [results]);

  const visible = results.filter((r) => character === 'all' || r.characterId === character);
  const pickedItems = visible.filter((r) => picked.has(r.id));

  const togglePick = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  const endSelecting = () => {
    setSelecting(false);
    setPicked(new Set());
  };

  return (
    <div className="space-y-5">
      <div className="text-center pt-6">
        <h1 className="font-display text-4xl sm:text-5xl text-slate-900">내 갤러리</h1>
        <p className="mt-3 text-slate-600">만든 그림은 이 브라우저에 저장돼요. 기한 없이 보관되고, 브라우저 데이터를 지우면 함께 사라져요.</p>
      </div>

      {results.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-slate-500">아직 만든 그림이 없어요.</p>
          <button type="button" onClick={onGoStudio} className="mt-4 px-5 py-2.5 rounded-full bg-purple-600 text-white font-bold">
            포즈 만들러 가기
          </button>
        </Card>
      ) : (
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <select
              value={character}
              onChange={(e) => setCharacter(e.target.value)}
              className="rounded-xl border border-[#e6dcf1] bg-white px-3 py-2 text-sm"
              aria-label="캐릭터 거르기"
            >
              <option value="all">모든 캐릭터 ({results.length})</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({results.filter((r) => r.characterId === c.id).length})
                </option>
              ))}
            </select>
            {selecting ? (
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setPicked(new Set(pickedItems.length === visible.length ? [] : visible.map((r) => r.id)))}
                  className="text-purple-600 font-semibold"
                >
                  {pickedItems.length === visible.length ? '선택 해제' : '모두 선택'}
                </button>
                <button type="button" onClick={endSelecting} className="text-slate-400">
                  취소
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setSelecting(true)} className="text-sm font-semibold text-purple-600">
                여러 개 선택
              </button>
            )}
          </div>

          <div className="mt-4 rounded-2xl bg-[#faf7fd] border border-[#efe6f8] p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">저장 형식</p>
            <ExportControls prefs={prefs} onChange={onChangePrefs} />
          </div>

          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {visible.map((r) => {
              const on = picked.has(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => (selecting ? togglePick(r.id) : onOpen(r))}
                  className={`relative rounded-2xl border-2 overflow-hidden bg-white text-left ${
                    on ? 'border-purple-500 ring-4 ring-purple-100' : 'border-[#ece2f6] hover:border-purple-300'
                  }`}
                >
                  <img src={r.image} alt={r.poseName} className="w-full aspect-square object-contain" loading="lazy" />
                  <span className="block text-[11px] px-1.5 py-1 truncate text-slate-600">{r.poseName}</span>
                  {selecting && (
                    <span
                      className={`absolute top-1.5 left-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                        on ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white/90 border-slate-300'
                      }`}
                    >
                      {on && '✓'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {selecting && pickedItems.length > 0 && (
        <div className="sticky bottom-4 flex gap-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => onDownloadZip(pickedItems)}
            className="flex-1 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg"
          >
            {pickedItems.length}개 저장 (ZIP)
          </button>
          <button
            type="button"
            onClick={() => {
              onAddReference(pickedItems);
              endSelecting();
            }}
            className="px-4 py-3.5 rounded-2xl bg-white border-2 border-purple-200 text-purple-700 font-bold shadow-lg hover:bg-purple-50"
          >
            ＋ 참고 그림
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm(`${pickedItems.length}개를 지울까요?`)) return;
              onDelete(pickedItems);
              endSelecting();
            }}
            className="px-5 py-3.5 rounded-2xl bg-white border border-[#e6dcf1] text-slate-500 hover:text-rose-500 shadow-lg"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
};

export default Gallery;
