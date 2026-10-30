import React, { useRef, useState } from 'react';
import { Modal, Spinner } from './ui';

const BackupModal: React.FC<{
  counts: { characters: number; results: number; poses: number };
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
  onClose: () => void;
}> = ({ counts, onExport, onImport, onClose }) => {
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (kind: 'export' | 'import', task: () => Promise<void>) => {
    setBusy(kind);
    try {
      await task();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal title="다른 기기로 옮기기" onClose={onClose}>
      <div className="space-y-5 text-sm text-slate-700">
        <p className="leading-relaxed">
          캐릭터·갤러리·내 포즈는 기기마다 따로 저장돼요. PC에서 하던 걸 휴대폰에서 이어서 하려면 이렇게 옮겨 주세요.
        </p>

        <ol className="space-y-3">
          <li className="rounded-2xl bg-[#faf7fd] border border-[#efe6f8] p-4">
            <p className="font-bold text-slate-900">1. 지금 기기에서 백업 파일 만들기</p>
            <p className="text-xs text-slate-500 mt-1">
              캐릭터 {counts.characters}개 · 갤러리 그림 {counts.results}장 · 내 포즈 {counts.poses}개가 .zip 파일 하나로 저장돼요.
            </p>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => run('export', onExport)}
              className="mt-3 w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold flex items-center justify-center gap-2"
            >
              {busy === 'export' && <Spinner className="w-5 h-5 text-white" />}
              백업 파일 만들기
            </button>
          </li>
          <li className="rounded-2xl bg-[#faf7fd] border border-[#efe6f8] p-4">
            <p className="font-bold text-slate-900">2. 파일을 다른 기기로 보내기</p>
            <p className="text-xs text-slate-500 mt-1">카카오톡 나에게 보내기, 에어드롭, 구글 드라이브, 메일 등 편한 방법으로 보내요.</p>
          </li>
          <li className="rounded-2xl bg-[#faf7fd] border border-[#efe6f8] p-4">
            <p className="font-bold text-slate-900">3. 다른 기기에서 불러오기</p>
            <p className="text-xs text-slate-500 mt-1">
              그 기기에서 이 앱을 열고 여기서 파일을 고르면 돼요. 이미 있는 것은 그대로 두고, 없는 것만 더하거나 새 내용으로 바꿔요.
            </p>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => fileRef.current?.click()}
              className="mt-3 w-full py-3 rounded-2xl border-2 border-purple-200 text-purple-700 font-bold hover:bg-purple-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy === 'import' && <Spinner className="w-5 h-5" />}
              백업 파일 불러오기
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) run('import', () => onImport(f));
              }}
            />
          </li>
        </ol>

        <p className="text-xs text-slate-400">API 키는 백업에 들어가지 않아요. 새 기기에서는 설정에서 한 번 넣어 주세요.</p>
      </div>
    </Modal>
  );
};

export default BackupModal;
