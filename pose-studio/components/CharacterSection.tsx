import React, { useEffect, useRef, useState } from 'react';
import { CHARACTER_KINDS, MAX_CHARACTER_IMAGES } from '../constants';
import { Character } from '../types';
import { normalizeImage, readFileAsDataUrl } from '../services/imageUtils';
import ConceptPanel from './ConceptPanel';
import { Card, Segmented, Spinner } from './ui';

async function filesToImages(files: Iterable<File>): Promise<string[]> {
  const images: string[] = [];
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    images.push(await normalizeImage(await readFileAsDataUrl(f)));
  }
  return images;
}

const UploadIcon = () => (
  <span className="w-14 h-14 rounded-2xl bg-[#efe4f9] flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-purple-600" aria-hidden="true">
      <path d="M12 4 5 11h4.5v8h5v-8H19z" />
    </svg>
  </span>
);

const CharacterSection: React.FC<{
  characters: Character[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (images: string[]) => void;
  onUpdate: (c: Character) => void;
  onDelete: (id: string) => void;
  analyzingId: string | null;
  onAnalyze: (c: Character) => void;
  onSuggestConcepts: (c: Character) => Promise<string[]>;
  onPlan: (c: Character) => void;
}> = ({ characters, selectedId, onSelect, onCreate, onUpdate, onDelete, analyzingId, onAnalyze, onSuggestConcepts, onPlan }) => {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const newInput = useRef<HTMLInputElement>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const selected = characters.find((c) => c.id === selectedId) ?? null;

  const handle = async (files: Iterable<File>, target: 'new' | 'add') => {
    setError('');
    setBusy(true);
    try {
      const images = await filesToImages(files);
      if (!images.length) {
        setError('이미지 파일만 올릴 수 있어요.');
        return;
      }
      if (target === 'add' && selected) {
        onUpdate({ ...selected, images: [...selected.images, ...images].slice(0, MAX_CHARACTER_IMAGES) });
      } else {
        onCreate(images.slice(0, MAX_CHARACTER_IMAGES));
      }
    } catch {
      setError('이미지를 읽지 못했어요. 다른 파일로 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  // 클립보드 이미지 붙여넣기 (Ctrl/Cmd+V)
  const handleRef = useRef(handle);
  handleRef.current = handle;
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea')) return;
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
      if (files.length) handleRef.current(files, 'new');
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const dropProps = (target: 'new' | 'add') => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handle(Array.from(e.dataTransfer.files), target);
    },
  });

  const fileInput = (ref: React.RefObject<HTMLInputElement | null>, target: 'new' | 'add') => (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={(e) => {
        if (e.target.files) handle(Array.from(e.target.files), target);
        e.target.value = '';
      }}
    />
  );

  if (!characters.length) {
    return (
      <Card>
        <button
          type="button"
          onClick={() => newInput.current?.click()}
          {...dropProps('new')}
          className={`w-full flex flex-col items-center justify-center gap-3 py-14 rounded-3xl transition-colors ${
            dragging ? 'bg-purple-50' : 'hover:bg-[#fcfaff]'
          }`}
        >
          {busy ? <Spinner className="w-10 h-10" /> : <UploadIcon />}
          <span className="font-bold text-slate-900">캐릭터 이미지 업로드</span>
          <span className="text-sm text-slate-500">클릭, 드래그&드롭, 붙여넣기 · 정면 전신 1장 권장</span>
          {error && <span className="text-sm text-rose-500">{error}</span>}
        </button>
        {fileInput(newInput, 'new')}
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900">
          내 캐릭터 <span className="text-slate-400 font-normal">({characters.length})</span>
        </h2>
        <button
          type="button"
          onClick={() => newInput.current?.click()}
          className="text-sm font-semibold text-purple-600 hover:text-purple-800"
        >
          + 새 캐릭터
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {characters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={`shrink-0 w-24 rounded-2xl border-2 p-1.5 text-left transition-colors ${
              c.id === selectedId ? 'border-purple-500 bg-purple-50' : 'border-[#ece2f6] hover:border-purple-200'
            }`}
          >
            <img src={c.images[0]} alt="" className="w-full aspect-square object-contain rounded-xl bg-white" />
            <span className="block mt-1 text-xs font-semibold truncate text-center">{c.name}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs text-slate-500 mb-2">
              참고 그림 {selected.images.length}/{MAX_CHARACTER_IMAGES} · ★ 첫 장이 대표예요. 다른 각도나 마음에 든 결과 그림을 더하면 더 정확해져요.
              결과 그림은 "참고 그림으로 추가" 버튼으로 바로 넣을 수 있어요.
            </p>
            <div className="grid grid-cols-4 gap-2" {...dropProps('add')}>
              {selected.images.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img}
                    alt={`참고 그림 ${i + 1}`}
                    className={`w-full aspect-square object-contain rounded-xl border bg-white ${i === 0 ? 'border-purple-400' : 'border-[#ece2f6]'}`}
                  />
                  {i === 0 ? (
                    <span className="absolute bottom-1 left-1 px-1.5 rounded-md bg-purple-600 text-white text-[10px] font-bold">★ 대표</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUpdate({ ...selected, images: [img, ...selected.images.filter((_, j) => j !== i)] })}
                      className="absolute bottom-1 left-1 px-1.5 rounded-md bg-white/90 border border-[#e6dcf1] text-[10px] text-slate-500 hover:text-purple-600"
                    >
                      ☆ 대표로
                    </button>
                  )}
                  {selected.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onUpdate({ ...selected, images: selected.images.filter((_, j) => j !== i) })}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-700 text-white text-xs leading-none"
                      aria-label="이 그림 빼기"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {selected.images.length < MAX_CHARACTER_IMAGES && (
                <button
                  type="button"
                  onClick={() => addInput.current?.click()}
                  className={`aspect-square rounded-xl border-2 border-dashed text-2xl ${
                    dragging ? 'border-purple-400 bg-purple-50 text-purple-500' : 'border-[#e3d6f1] text-purple-300 hover:border-purple-300'
                  }`}
                  aria-label="참고 그림 추가"
                >
                  {busy ? <Spinner className="w-5 h-5 mx-auto" /> : '+'}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">이름</span>
              <input
                value={selected.name}
                onChange={(e) => onUpdate({ ...selected, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e6dcf1] px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
              />
            </label>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">몸 구조</span>
                <button
                  type="button"
                  disabled={analyzingId === selected.id}
                  onClick={() => onAnalyze(selected)}
                  className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 disabled:text-slate-400"
                >
                  {analyzingId === selected.id ? (
                    <>
                      <Spinner className="w-3.5 h-3.5" /> AI가 살펴보는 중…
                    </>
                  ) : (
                    '✨ AI로 다시 분석'
                  )}
                </button>
              </div>
              <div className="mt-1.5">
                <Segmented
                  value={selected.kind ?? ''}
                  options={CHARACTER_KINDS.map((k) => ({ id: k.id, label: k.label }))}
                  onChange={(kind) => onUpdate({ ...selected, kind: kind || undefined })}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {selected.kind
                  ? CHARACTER_KINDS.find((k) => k.id === selected.kind)?.hint +
                    (selected.kind === 'humanoid' ? '. 포즈 가이드 그림도 함께 보내요.' : '. 팔다리를 만들지 않고 이 몸에 맞게 포즈를 바꿔요.')
                  : '처음 만들 때 AI가 자동으로 정해요. 직접 골라도 돼요.'}
              </p>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">캐릭터 설명 (AI가 채워요 · 고쳐도 돼요)</span>
              <textarea
                value={selected.note}
                onChange={(e) => onUpdate({ ...selected, note: e.target.value })}
                rows={3}
                placeholder="예: 노란 병아리. 팔 대신 작은 날개 2개, 주황색 다리 2개. 손동작은 날개로 표현."
                className="mt-1 w-full rounded-xl border border-[#e6dcf1] px-3 py-2 text-sm resize-none focus:outline-none focus:border-purple-400"
              />
            </label>
            <button
              type="button"
              onClick={() => confirm(`'${selected.name}' 캐릭터를 지울까요? 이미 만든 그림은 갤러리에 남아요.`) && onDelete(selected.id)}
              className="text-xs text-slate-400 hover:text-rose-500"
            >
              캐릭터 삭제
            </button>
          </div>
        </div>
      )}
      {selected && <ConceptPanel character={selected} onUpdate={onUpdate} onSuggest={onSuggestConcepts} onPlan={onPlan} />}
      {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
      {fileInput(newInput, 'new')}
      {fileInput(addInput, 'add')}
    </Card>
  );
};

export default CharacterSection;
