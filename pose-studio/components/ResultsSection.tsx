import React from 'react';
import { Job, ResultItem } from '../types';
import { Card, Spinner } from './ui';

const ResultsSection: React.FC<{
  jobs: Job[];
  onRetry: (job: Job) => void;
  onOpen: (item: ResultItem) => void;
  onAddReference: (items: ResultItem[]) => void;
  onClear: () => void;
  onDownloadAll: (items: ResultItem[]) => void;
}> = ({ jobs, onRetry, onOpen, onAddReference, onClear, onDownloadAll }) => {
  if (!jobs.length) return null;
  const done = jobs.filter((j) => j.status === 'done' && j.result).map((j) => j.result!);
  const pending = jobs.filter((j) => j.status === 'queued' || j.status === 'running').length;
  const failed = jobs.filter((j) => j.status === 'error').length;

  return (
    <Card className="p-5 sm:p-6" >
      <div id="results" className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-slate-900">
          만든 그림{' '}
          <span className="text-slate-400 font-normal text-sm">
            완료 {done.length}
            {pending > 0 && ` · 진행 중 ${pending}`}
            {failed > 0 && ` · 실패 ${failed}`}
          </span>
        </h2>
        <div className="flex items-center gap-3 text-sm">
          {done.length > 0 && (
            <button type="button" onClick={() => onDownloadAll(done)} className="font-semibold text-purple-600 hover:text-purple-800">
              전체 저장 (ZIP)
            </button>
          )}
          {pending === 0 && (
            <button type="button" onClick={onClear} className="text-slate-400 hover:text-slate-600">
              목록 비우기
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-1">만든 그림은 자동으로 내 갤러리에 저장돼요.</p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-2xl border border-[#ece2f6] overflow-hidden bg-white">
            <div className="aspect-square flex items-center justify-center bg-[#fcfaff]">
              {job.status === 'done' && job.result ? (
                <button type="button" onClick={() => onOpen(job.result!)} className="w-full h-full">
                  <img src={job.result.image} alt={job.pose.name} className="w-full h-full object-contain" />
                </button>
              ) : job.status === 'error' ? (
                <div className="p-3 text-center">
                  <p className="text-xs text-rose-500 leading-snug line-clamp-5">{job.error}</p>
                  <button
                    type="button"
                    onClick={() => onRetry(job)}
                    className="mt-2 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold"
                  >
                    다시 시도
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
                  <Spinner className="w-8 h-8" />
                  {job.status === 'running' ? '그리는 중…' : '대기 중'}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-2.5 py-2 text-xs">
              <span className="font-semibold text-slate-700 truncate">{job.pose.name}</span>
              {job.status === 'done' && job.result && (
                <span className="shrink-0 flex gap-2">
                  <button type="button" onClick={() => onAddReference([job.result!])} className="text-purple-600 hover:text-purple-800">
                    ＋참고
                  </button>
                  <button type="button" onClick={() => onRetry(job)} className="text-purple-600 hover:text-purple-800">
                    다시
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ResultsSection;
