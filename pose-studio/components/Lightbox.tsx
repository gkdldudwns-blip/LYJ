import React, { useEffect, useState } from 'react';
import { ResultItem } from '../types';
import { ExportPrefs } from '../services/storage';
import { exportImage } from '../services/imageUtils';
import ExportControls from './ExportControls';
import { CHECKER, Modal, Spinner } from './ui';

const Lightbox: React.FC<{
  item: ResultItem;
  prefs: ExportPrefs;
  onChangePrefs: (p: ExportPrefs) => void;
  onDownload: (item: ResultItem) => void;
  onAddReference: (item: ResultItem) => void;
  onDelete: (item: ResultItem) => void;
  onClose: () => void;
}> = ({ item, prefs, onChangePrefs, onDownload, onAddReference, onDelete, onClose }) => {
  const [preview, setPreview] = useState(item.image);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    exportImage(item.image, prefs)
      .then((url) => alive && setPreview(url))
      .catch(() => alive && setPreview(item.image))
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [item.image, prefs]);

  return (
    <Modal title={`${item.characterName} · ${item.poseName}`} onClose={onClose} wide>
      <div className={`relative rounded-2xl border border-[#ece2f6] overflow-hidden ${prefs.transparent ? CHECKER : 'bg-white'}`}>
        <img src={preview} alt={item.poseName} className="w-full max-h-[60vh] object-contain" />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <Spinner className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="mt-4 space-y-4">
        <ExportControls prefs={prefs} onChange={onChangePrefs} />
        <button
          type="button"
          onClick={() => onDownload(item)}
          className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
        >
          PNG 저장
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onAddReference(item)}
            className="flex-1 py-3 rounded-2xl border-2 border-purple-200 text-purple-700 font-bold hover:bg-purple-50"
          >
            ＋ 참고 그림으로 추가
          </button>
          <button
            type="button"
            onClick={() => confirm('이 그림을 갤러리에서 지울까요?') && onDelete(item)}
            className="px-4 py-3 rounded-2xl border border-[#e6dcf1] text-slate-500 hover:text-rose-500"
          >
            삭제
          </button>
        </div>
        <p className="text-xs text-slate-400">
          "참고 그림으로 추가"는 이 그림을 '{item.characterName}'의 참고 그림에 넣어요. 다음 그림부터 함께 참고해서 더 일관되게 그려요.
        </p>
        <p className="text-xs text-slate-400">
          투명 배경은 테두리와 이어진 흰 부분만 지워요. 선으로 둘러싸인 안쪽 흰색(얼굴 등)은 그대로 남아요.
        </p>
      </div>
    </Modal>
  );
};

export default Lightbox;
