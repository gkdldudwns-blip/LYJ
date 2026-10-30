import React, { useState } from 'react';
import { MODEL_PRESETS } from '../constants';
import { ImageSize, Settings } from '../types';
import { Modal, Segmented, Toggle } from './ui';

const SettingsModal: React.FC<{
  settings: Settings;
  envKey: boolean;
  onSave: (s: Settings) => void;
  onClose: () => void;
}> = ({ settings, envKey, onSave, onClose }) => {
  const [draft, setDraft] = useState(settings);
  const [show, setShow] = useState(false);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setDraft({ ...draft, [key]: value });
  const isPreset = MODEL_PRESETS.some((m) => m.id === draft.model);

  return (
    <Modal title="설정" onClose={onClose}>
      <div className="space-y-6">
        <div>
          <label className="block">
            <span className="text-sm font-bold text-slate-800">Gemini API 키</span>
            <div className="mt-2 flex gap-2">
              <input
                type={show ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={(e) => set('apiKey', e.target.value)}
                placeholder={envKey ? '환경 변수의 키를 쓰는 중 (비워 둬도 돼요)' : 'AIza로 시작하는 키'}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 rounded-xl border border-[#e6dcf1] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-purple-400"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="shrink-0 px-3 rounded-xl border border-[#e6dcf1] text-xs text-slate-500"
              >
                {show ? '숨기기' : '보기'}
              </button>
            </div>
          </label>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            키는{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-purple-600 underline">
              Google AI Studio
            </a>
            에서 무료로 만들 수 있어요. 키는 이 브라우저에만 저장되고, 그림을 만들 때 Google에만 보내져요. 그래서 다른 사람이 이 페이지 주소를
            알아도 내 키 없이는 쓸 수 없어요.
          </p>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-800 mb-2">이미지 모델</p>
          <div className="space-y-1.5">
            {MODEL_PRESETS.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={draft.model === m.id} onChange={() => set('model', m.id)} className="accent-purple-600" />
                <span>{m.label}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={!isPreset} onChange={() => set('model', '')} className="accent-purple-600" />
              <span className="shrink-0">직접 입력</span>
              <input
                value={isPreset ? '' : draft.model}
                onChange={(e) => set('model', e.target.value.trim())}
                placeholder="모델 ID"
                className="flex-1 min-w-0 rounded-lg border border-[#e6dcf1] px-2 py-1 text-sm font-mono"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-800 mb-2">해상도</p>
          <Segmented<ImageSize>
            value={draft.imageSize}
            options={[
              { id: '1K', label: '1K (빠름)' },
              { id: '2K', label: '2K (선명, 비용↑)' },
            ]}
            onChange={(v) => set('imageSize', v)}
          />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-800 mb-2">동시에 그리는 수</p>
          <Segmented
            value={draft.concurrency}
            options={[1, 2, 3, 4].map((n) => ({ id: n, label: `${n}개` }))}
            onChange={(v) => set('concurrency', v)}
          />
          <p className="mt-2 text-xs text-slate-500">무료 키는 분당 요청 수가 적어요. "요청이 너무 많아요" 오류가 나면 1개로 줄이세요.</p>
        </div>

        <Toggle
          checked={draft.sendPoseGuide}
          onChange={(v) => set('sendPoseGuide', v)}
          label="포즈 가이드 그림 함께 보내기"
          hint="사람형 캐릭터일 때 썸네일 그림을 같이 보내 포즈를 더 정확히 따라 하게 해요. 동물·사물 캐릭터에는 보내지 않아요. 마네킹 모양이 섞여 나오면 꺼 보세요."
        />

        <button
          type="button"
          onClick={() => {
            onSave({ ...draft, model: draft.model || MODEL_PRESETS[0].id });
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
        >
          저장
        </button>
      </div>
    </Modal>
  );
};

export default SettingsModal;
