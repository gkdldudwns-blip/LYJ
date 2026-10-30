import React, { useEffect, useState } from 'react';
import { Character } from '../types';
import { Spinner } from './ui';

/** 캐릭터의 성격·콘셉트와 트레이드마크. 모든 포즈에 반영된다 */
const ConceptPanel: React.FC<{
  character: Character;
  onUpdate: (c: Character) => void;
  onSuggest: (c: Character) => Promise<string[]>;
  onPlan: (c: Character) => void;
}> = ({ character, onUpdate, onSuggest, onPlan }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // 다른 캐릭터로 바꾸면 이전 추천은 지운다
  useEffect(() => setSuggestions([]), [character.id]);

  const suggest = async () => {
    setBusy(true);
    try {
      setSuggestions(await onSuggest(character));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl border border-[#efe6f8] bg-[#fcfaff] p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-slate-900">콘셉트 (성격)</span>
          <button
            type="button"
            disabled={busy}
            onClick={suggest}
            className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 disabled:text-slate-400"
          >
            {busy ? (
              <>
                <Spinner className="w-3.5 h-3.5" /> 생각하는 중…
              </>
            ) : (
              '✨ AI 콘셉트 추천'
            )}
          </button>
        </div>
        <textarea
          value={character.concept ?? ''}
          onChange={(e) => onUpdate({ ...character, concept: e.target.value })}
          rows={2}
          placeholder="예: 뭐든 휘파람으로 넘기는 태평한 병아리"
          className="mt-1.5 w-full rounded-xl border border-[#e6dcf1] bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:border-purple-400"
        />
        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onUpdate({ ...character, concept: s })}
                className={`px-3 py-1.5 rounded-full border text-xs text-left ${
                  character.concept === s
                    ? 'bg-[#d9c2ef] border-[#d9c2ef] text-purple-900 font-semibold'
                    : 'bg-white border-[#e6dcf1] text-slate-600 hover:border-purple-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-xs text-slate-500">
          모든 포즈를 이 성격으로 연기해요. "당황"을 시켜도 휘파람 불며 모른 척하는 식으로, 세트 전체에 개성이 생겨요.
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-bold text-slate-900">꼭 지킬 특징 (트레이드마크)</span>
        <textarea
          value={character.traits ?? ''}
          onChange={(e) => onUpdate({ ...character, traits: e.target.value })}
          rows={2}
          placeholder="예: 부리 없음, 입은 항상 휘파람 부는 ε 모양, 리본은 머리 오른쪽 위, 손가락 없이 날개만"
          className="mt-1.5 w-full rounded-xl border border-[#e6dcf1] bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:border-purple-400"
        />
        <span className="block mt-1.5 text-xs text-slate-500">어떤 포즈에서도 바뀌면 안 되는 것을 적어요. 장마다 흔들리던 부분이 고정돼요.</span>
      </label>

      <button
        type="button"
        onClick={() => onPlan(character)}
        className="w-full py-3 rounded-2xl bg-white border-2 border-purple-200 text-purple-700 font-bold hover:bg-purple-50"
      >
        ✨ 이 콘셉트로 이모티콘 세트 기획하기
      </button>
    </div>
  );
};

export default ConceptPanel;
