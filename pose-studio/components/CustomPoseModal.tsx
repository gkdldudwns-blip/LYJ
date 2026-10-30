import React, { useRef, useState } from 'react';
import { Pose } from '../types';
import { normalizeImage, readFileAsDataUrl } from '../services/imageUtils';
import { uid } from '../services/storage';
import { Modal } from './ui';

const CustomPoseModal: React.FC<{ onSave: (p: Pose) => void; onClose: () => void }> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [caption, setCaption] = useState('');
  const [refImage, setRefImage] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const valid = name.trim() && (prompt.trim() || refImage);

  return (
    <Modal title="내 포즈 추가" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">포즈 이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 우산 쓰고 걷기"
            className="mt-1 w-full rounded-xl border border-[#e6dcf1] px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">포즈 설명 (한국어로 써도 돼요)</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="예: 비 오는 날 노란 우산을 한 손에 들고 걸어가는 모습. 다른 손은 주머니에. 살짝 들뜬 표정."
            className="mt-1 w-full rounded-xl border border-[#e6dcf1] px-3 py-2 text-sm resize-none focus:outline-none focus:border-purple-400"
          />
          <span className="text-xs text-slate-400">몸 방향, 팔다리 위치, 표정, 소품을 구체적으로 적을수록 정확해요.</span>
        </label>
        <div>
          <span className="text-xs font-semibold text-slate-600">참고 이미지 (선택)</span>
          <p className="text-xs text-slate-400">직접 찍은 사진이나 대충 그린 스케치를 올리면 그 자세를 따라 해요.</p>
          <div className="mt-2 flex items-center gap-3">
            {refImage ? (
              <div className="relative">
                <img src={refImage} alt="참고 이미지" className="w-24 h-24 object-contain rounded-xl border border-[#e6dcf1]" />
                <button
                  type="button"
                  onClick={() => setRefImage(undefined)}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-700 text-white text-xs"
                  aria-label="참고 이미지 빼기"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-[#dccbee] text-purple-400 text-2xl"
              >
                +
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) setRefImage(await normalizeImage(await readFileAsDataUrl(f), 768));
            }}
          />
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">기본 문구 (선택, 이모티콘용)</span>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="예: 비 온다!"
            className="mt-1 w-full rounded-xl border border-[#e6dcf1] px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
          />
        </label>
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            onSave({
              id: `custom-${uid()}`,
              name: name.trim(),
              category: 'custom',
              prompt: prompt.trim() || 'Copy the pose shown in the POSE REFERENCE image.',
              caption: caption.trim() || undefined,
              refImage,
              createdAt: Date.now(),
            });
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold"
        >
          포즈 저장
        </button>
      </div>
    </Modal>
  );
};

export default CustomPoseModal;
