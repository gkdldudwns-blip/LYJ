import React from 'react';
import { ASPECT_RATIOS } from '../constants';
import { GenerateOptions, Pose, Purpose } from '../types';
import { Card, Segmented, Toggle } from './ui';

const PURPOSES: { id: Purpose; label: string }[] = [
  { id: 'emoticon', label: '이모티콘' },
  { id: 'instatoon', label: '인스타툰' },
];

const OptionsSection: React.FC<{
  options: GenerateOptions;
  onChange: (o: GenerateOptions) => void;
  selectedPoses: Pose[];
}> = ({ options, onChange, selectedPoses }) => {
  const set = <K extends keyof GenerateOptions>(key: K, value: GenerateOptions[K]) => onChange({ ...options, [key]: value });

  return (
    <Card className="p-5 sm:p-6 space-y-5">
      <h2 className="font-bold text-slate-900">만들기 옵션</h2>

      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">용도</p>
        <Segmented
          value={options.purpose}
          options={PURPOSES}
          onChange={(purpose) =>
            onChange({ ...options, purpose, aspectRatio: purpose === 'emoticon' ? '1:1' : options.aspectRatio })
          }
        />
        <p className="text-xs text-slate-500 mt-2">
          {options.purpose === 'emoticon'
            ? '작게 봐도 알아보기 쉽게 표정과 동작을 또렷하게 그려요. 저장할 때 360×360 투명 배경으로 바꿀 수 있어요.'
            : '인스타툰 컷에 넣기 좋은 자연스러운 연기로 그려요.'}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">비율</p>
        <Segmented value={options.aspectRatio} options={ASPECT_RATIOS} onChange={(v) => set('aspectRatio', v)} />
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">포즈당 장수</p>
        <Segmented
          value={options.perPose}
          options={[1, 2, 3, 4].map((n) => ({ id: n, label: `${n}장` }))}
          onChange={(v) => set('perPose', v)}
        />
      </div>

      <div className="space-y-3">
        <Toggle
          checked={options.withCaption}
          onChange={(v) => set('withCaption', v)}
          label="그림에 문구 넣기"
          hint="이모티콘처럼 '감사합니다' 같은 글자를 그림 안에 손글씨로 넣어요. 한글은 가끔 틀릴 수 있어요."
        />
        {options.withCaption && (
          <div className="rounded-2xl bg-[#faf7fd] border border-[#efe6f8] p-3 space-y-2">
            {selectedPoses.length === 0 && <p className="text-xs text-slate-400">포즈를 고르면 포즈별 문구를 적을 수 있어요.</p>}
            {selectedPoses.map((p) => (
              <label key={p.id} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-xs text-slate-600 truncate">{p.name}</span>
                <input
                  value={options.captions[p.id] ?? p.caption ?? ''}
                  onChange={(e) => set('captions', { ...options.captions, [p.id]: e.target.value })}
                  placeholder="비워 두면 글자 없이"
                  className="flex-1 min-w-0 rounded-lg border border-[#e6dcf1] px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-purple-400"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-slate-600">추가 요청 (선택)</span>
        <textarea
          value={options.extra}
          onChange={(e) => set('extra', e.target.value)}
          rows={2}
          placeholder="예: 겨울 목도리를 두르고, 선은 조금 더 굵게"
          className="mt-1 w-full rounded-xl border border-[#e6dcf1] px-3 py-2 text-sm resize-none focus:outline-none focus:border-purple-400"
        />
      </label>
    </Card>
  );
};

export default OptionsSection;
