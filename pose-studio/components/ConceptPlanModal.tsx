import React, { useState } from 'react';
import { Character, PoseIdea } from '../types';
import { Modal, Segmented, Spinner } from './ui';

/** 콘셉트에 맞는 이모티콘 아이디어를 받아 골라서 "내 포즈"로 넣는다 */
const ConceptPlanModal: React.FC<{
  character: Character;
  onPlan: (c: Character, count: number) => Promise<PoseIdea[]>;
  onAdd: (ideas: PoseIdea[]) => void;
  onClose: () => void;
}> = ({ character, onPlan, onAdd, onClose }) => {
  const [count, setCount] = useState(16);
  const [ideas, setIdeas] = useState<PoseIdea[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const plan = async () => {
    setBusy(true);
    try {
      const next = await onPlan(character, count);
      setIdeas(next);
      setPicked(new Set(next.map((_, i) => i)));
    } finally {
      setBusy(false);
    }
  };

  const toggle = (i: number) => {
    const next = new Set(picked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setPicked(next);
  };

  return (
    <Modal title="콘셉트로 이모티콘 세트 기획" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="rounded-2xl bg-[#faf7fd] border border-[#efe6f8] p-4 text-sm">
          <p className="text-xs font-semibold text-slate-500">{character.name}의 콘셉트</p>
          <p className="mt-1 font-bold text-slate-900">{character.concept?.trim() || '(콘셉트를 아직 안 적었어요. 적어 두면 더 개성 있게 기획해요)'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">아이디어 개수</span>
          <Segmented<number> value={count} options={[8, 16, 24].map((n) => ({ id: n, label: `${n}개` }))} onChange={setCount} />
        </div>
        <p className="text-xs text-slate-500">라인 스티커는 8·16·24·32·40개 단위로 낼 수 있어요. 이미 있는 포즈와 겹치지 않게 기획해요.</p>

        <button
          type="button"
          disabled={busy}
          onClick={plan}
          className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold flex items-center justify-center gap-2"
        >
          {busy && <Spinner className="w-5 h-5 text-white" />}
          {busy ? 'AI가 기획하는 중…' : ideas.length ? '다시 기획하기' : '아이디어 만들기'}
        </button>

        {ideas.length > 0 && (
          <>
            <ul className="grid sm:grid-cols-2 gap-2">
              {ideas.map((idea, i) => (
                <li key={i}>
                  <label
                    className={`flex gap-3 rounded-2xl border-2 p-3 cursor-pointer ${
                      picked.has(i) ? 'border-purple-400 bg-purple-50/50' : 'border-[#ece2f6] bg-white'
                    }`}
                  >
                    <input type="checkbox" checked={picked.has(i)} onChange={() => toggle(i)} className="mt-1 accent-purple-600" />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900">
                        {idea.name}
                        {idea.caption && <span className="ml-1.5 font-normal text-purple-600">“{idea.caption}”</span>}
                      </span>
                      <span className="block mt-1 text-xs text-slate-600 leading-snug">{idea.scene || idea.prompt}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={!picked.size}
              onClick={() => onAdd(ideas.filter((_, i) => picked.has(i)))}
              className="sticky bottom-0 w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold shadow-lg"
            >
              선택한 {picked.size}개를 내 포즈에 넣고 고르기
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ConceptPlanModal;
