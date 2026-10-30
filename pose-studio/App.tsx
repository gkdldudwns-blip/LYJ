import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import CharacterSection from './components/CharacterSection';
import PoseSection from './components/PoseSection';
import OptionsSection from './components/OptionsSection';
import ResultsSection from './components/ResultsSection';
import Gallery from './components/Gallery';
import GuidePage from './components/GuidePage';
import Lightbox from './components/Lightbox';
import SettingsModal from './components/SettingsModal';
import CustomPoseModal from './components/CustomPoseModal';
import { DEFAULT_OPTIONS, POSES } from './constants';
import { Character, GenerateOptions, Job, Page, Pose, ResultItem, Settings } from './types';
import { analyzeCharacter, describeError, generatePoseImage, resolveApiKey } from './services/geminiService';
import { downloadDataUrl, downloadZip, exportImage, safeName, urlToDataUrl } from './services/imageUtils';
import {
  ExportPrefs,
  getAll,
  loadExportPrefs,
  loadFavorites,
  loadSettings,
  put,
  remove,
  saveExportPrefs,
  saveFavorites,
  saveSettings,
  uid,
} from './services/storage';

const byNewest = <T extends { createdAt: number }>(a: T, b: T) => b.createdAt - a.createdAt;

const fileNameFor = (r: ResultItem, dataUrl: string, index?: number) =>
  `${index !== undefined ? `${String(index + 1).padStart(2, '0')}_` : ''}${safeName(r.characterName)}_${safeName(r.poseName)}.${
    dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png'
  }`;

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('studio');
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [customPoses, setCustomPoses] = useState<Pose[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<GenerateOptions>(DEFAULT_OPTIONS);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [lightbox, setLightbox] = useState<ResultItem | null>(null);
  const [showCustomPose, setShowCustomPose] = useState(false);
  const [exportPrefs, setExportPrefs] = useState<ExportPrefs>(loadExportPrefs);
  const [notice, setNotice] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAll<Character>('characters'), getAll<Pose>('poses'), getAll<ResultItem>('results')])
      .then(([cs, ps, rs]) => {
        cs.sort((a, b) => a.createdAt - b.createdAt);
        setCharacters(cs);
        setSelectedCharacterId(cs[0]?.id ?? null);
        setCustomPoses(ps.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)));
        setResults(rs.sort(byNewest));
      })
      .catch(() => setNotice('브라우저 저장소를 열지 못했어요. 시크릿 모드에서는 저장이 안 될 수 있어요.'));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const allPoses = useMemo(() => [...POSES, ...customPoses], [customPoses]);
  const selectedPoses = allPoses.filter((p) => selected.has(p.id));
  const character = characters.find((c) => c.id === selectedCharacterId) ?? null;
  const hasKey = !!resolveApiKey(settings);
  const running = jobs.filter((j) => j.status === 'queued' || j.status === 'running').length;

  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [running]);

  // ---------- 캐릭터 ----------

  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const persistCharacter = (c: Character) => {
    clearTimeout(saveTimers.current.get(c.id));
    saveTimers.current.set(
      c.id,
      setTimeout(() => put('characters', c).catch(() => setNotice('캐릭터를 저장하지 못했어요.')), 400),
    );
  };

  const createCharacter = (images: string[]) => {
    const c: Character = { id: uid(), name: `캐릭터 ${characters.length + 1}`, images, note: '', createdAt: Date.now() };
    setCharacters((cs) => [...cs, c]);
    setSelectedCharacterId(c.id);
    persistCharacter(c);
    if (hasKey) analyze(c, { quiet: true });
  };

  /** AI가 캐릭터의 몸 구조(사람형·동물·사물)와 설명을 채운다. 사용자가 쓴 설명은 덮어쓰지 않는다 */
  const analyze = async (c: Character, { quiet = false, replaceNote = false } = {}): Promise<Character> => {
    setAnalyzingId(c.id);
    try {
      const { kind, description } = await analyzeCharacter(settingsRef.current, c);
      let updated = c;
      setCharacters((cs) =>
        cs.map((x) => {
          if (x.id !== c.id) return x;
          updated = { ...x, kind, note: replaceNote || !x.note.trim() ? description : x.note };
          persistCharacter(updated);
          return updated;
        }),
      );
      return { ...c, kind, note: replaceNote || !c.note.trim() ? description : c.note };
    } catch (err) {
      if (!quiet) setNotice(`캐릭터를 분석하지 못했어요: ${describeError(err)}`);
      return c;
    } finally {
      setAnalyzingId((id) => (id === c.id ? null : id));
    }
  };

  const updateCharacter = (c: Character) => {
    setCharacters((cs) => cs.map((x) => (x.id === c.id ? c : x)));
    persistCharacter(c);
  };

  const deleteCharacter = (id: string) => {
    clearTimeout(saveTimers.current.get(id));
    const rest = characters.filter((c) => c.id !== id);
    setCharacters(rest);
    setSelectedCharacterId(rest[0]?.id ?? null);
    remove('characters', id).catch(() => undefined);
  };

  // ---------- 포즈 ----------

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next);
    saveFavorites(next);
  };

  const addCustomPose = (pose: Pose) => {
    setCustomPoses((ps) => [...ps, pose]);
    put('poses', pose).catch(() => setNotice('포즈를 저장하지 못했어요.'));
  };

  const deleteCustomPose = (id: string) => {
    setCustomPoses((ps) => ps.filter((p) => p.id !== id));
    const next = new Set(selected);
    next.delete(id);
    setSelected(next);
    remove('poses', id).catch(() => undefined);
  };

  // ---------- 생성 대기열 ----------

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const queue = useRef<Job[]>([]);
  const active = useRef(0);

  const updateJob = (id: string, patch: Partial<Job>) =>
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const runJob = async (job: Job): Promise<ResultItem> => {
    const s = settingsRef.current;
    // 마네킹 썸네일은 사람형 몸이라, 동물·사물 캐릭터에게 보내면 사람 팔다리가 생기기 쉽다
    const useGuide = s.sendPoseGuide && job.pose.thumb && (job.character.kind ?? 'humanoid') === 'humanoid';
    const poseImage = job.pose.refImage
      ? { kind: 'reference' as const, dataUrl: job.pose.refImage }
      : useGuide
        ? { kind: 'guide' as const, dataUrl: await urlToDataUrl(job.pose.thumb!) }
        : undefined;
    const caption = job.options.withCaption
      ? (job.options.captions[job.pose.id] ?? job.pose.caption ?? '').trim() || undefined
      : undefined;
    const image = await generatePoseImage({
      settings: s,
      character: job.character,
      pose: job.pose,
      options: job.options,
      poseImage,
      caption,
    });
    const result: ResultItem = {
      id: uid(),
      characterId: job.character.id,
      characterName: job.character.name,
      poseId: job.pose.id,
      poseName: job.pose.name,
      caption,
      image,
      createdAt: Date.now(),
    };
    await put('results', result).catch(() => setNotice('갤러리 저장 공간이 부족해요. 오래된 그림을 지워 주세요.'));
    return result;
  };

  const pump = useCallback(() => {
    while (active.current < settingsRef.current.concurrency && queue.current.length) {
      const job = queue.current.shift()!;
      active.current++;
      updateJob(job.id, { status: 'running', error: undefined });
      runJob(job)
        .then((result) => {
          updateJob(job.id, { status: 'done', result });
          setResults((rs) => [result, ...rs]);
        })
        .catch((err) => updateJob(job.id, { status: 'error', error: describeError(err) }))
        .finally(() => {
          active.current--;
          pump();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enqueue = (newJobs: Job[]) => {
    setJobs((js) => [...newJobs, ...js]);
    queue.current.push(...newJobs);
    pump();
  };

  const startGeneration = async () => {
    if (!character) {
      setNotice('캐릭터 그림을 먼저 올려 주세요.');
      return;
    }
    if (!selectedPoses.length) {
      setNotice('만들 포즈를 골라 주세요.');
      return;
    }
    if (!hasKey) {
      setNotice('Gemini API 키를 먼저 넣어 주세요.');
      setShowSettings(true);
      return;
    }
    const snapshot = { ...options, captions: { ...options.captions } };
    const poses = selectedPoses;
    // 아직 분석하지 않은 캐릭터는 먼저 몸 구조를 파악한다
    const ready = character.kind ? character : await analyze(character, { quiet: true });
    enqueue(
      poses.flatMap((pose) =>
        Array.from({ length: snapshot.perPose }, () => ({
          id: uid(),
          pose,
          character: ready,
          options: snapshot,
          status: 'queued' as const,
        })),
      ),
    );
    setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const retryJob = (job: Job) => {
    if (job.status === 'error') {
      updateJob(job.id, { status: 'queued', error: undefined });
      queue.current.push(job);
      pump();
    } else {
      enqueue([{ ...job, id: uid(), status: 'queued', result: undefined, error: undefined }]);
    }
  };

  // ---------- 저장·삭제 ----------

  const changeExportPrefs = (p: ExportPrefs) => {
    setExportPrefs(p);
    saveExportPrefs(p);
  };

  const downloadOne = async (r: ResultItem) => {
    try {
      const url = await exportImage(r.image, exportPrefs);
      await downloadDataUrl(url, fileNameFor(r, url));
    } catch {
      setNotice('파일을 저장하지 못했어요.');
    }
  };

  const downloadMany = async (items: ResultItem[]) => {
    setNotice(`${items.length}개를 ZIP으로 묶는 중…`);
    try {
      const files = [];
      for (const [i, r] of items.entries()) {
        const url = await exportImage(r.image, exportPrefs);
        files.push({ name: fileNameFor(r, url, i), dataUrl: url });
      }
      const stamp = new Date().toISOString().slice(0, 10);
      await downloadZip(files, `pose-studio_${stamp}.zip`);
      setNotice('');
    } catch {
      setNotice('ZIP 파일을 만들지 못했어요.');
    }
  };

  const deleteResults = (items: ResultItem[]) => {
    const ids = new Set(items.map((r) => r.id));
    setResults((rs) => rs.filter((r) => !ids.has(r.id)));
    if (lightbox && ids.has(lightbox.id)) setLightbox(null);
    for (const id of ids) remove('results', id).catch(() => undefined);
  };

  const updateSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
    setNotice('설정을 저장했어요.');
    pump();
  };

  const totalToMake = selectedPoses.length * options.perPose;

  return (
    <div className="min-h-screen">
      <Header page={page} onNavigate={setPage} onOpenSettings={() => setShowSettings(true)} hasKey={hasKey} running={running} />

      <main className="max-w-5xl mx-auto px-4 pb-32">
        {page === 'studio' && (
          <div className="space-y-5">
            <div className="text-center pt-8 pb-2">
              <h1 className="font-display text-4xl sm:text-5xl text-slate-900">캐릭터 포즈 만들기</h1>
              <p className="mt-3 text-slate-600">캐릭터 그림 올리고, 포즈 만들어 보세요!</p>
              <p className="mt-1 text-sm text-slate-500">사람이 아니어도 돼요. 병아리, 고양이, 음식, 물건 캐릭터도 그 몸에 맞게 포즈를 잡아요.</p>
              <p className="mt-1 text-xs text-slate-400">만든 그림은 이 브라우저의 내 갤러리에 저장돼요.</p>
            </div>

            {!hasKey && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <span className="flex-1">그림을 만들려면 Gemini API 키가 필요해요. 키는 이 브라우저에만 저장돼요.</span>
                <button type="button" onClick={() => setShowSettings(true)} className="shrink-0 px-4 py-2 rounded-full bg-amber-500 text-white font-bold">
                  키 넣기
                </button>
              </div>
            )}

            <CharacterSection
              characters={characters}
              selectedId={selectedCharacterId}
              onSelect={setSelectedCharacterId}
              onCreate={createCharacter}
              onUpdate={updateCharacter}
              onDelete={deleteCharacter}
              analyzingId={analyzingId}
              onAnalyze={(c) => {
                if (!hasKey) {
                  setNotice('AI 분석에는 Gemini API 키가 필요해요.');
                  setShowSettings(true);
                  return;
                }
                analyze(c, { replaceNote: true });
              }}
            />
            <PoseSection
              poses={allPoses}
              selected={selected}
              onChangeSelected={setSelected}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onAddCustom={() => setShowCustomPose(true)}
              onDeleteCustom={deleteCustomPose}
            />
            <OptionsSection options={options} onChange={setOptions} selectedPoses={selectedPoses} />
            <ResultsSection
              jobs={jobs}
              onRetry={retryJob}
              onOpen={setLightbox}
              onClear={() => setJobs((js) => js.filter((j) => j.status === 'queued' || j.status === 'running'))}
              onDownloadAll={downloadMany}
            />
          </div>
        )}

        {page === 'gallery' && (
          <Gallery
            results={results}
            prefs={exportPrefs}
            onChangePrefs={changeExportPrefs}
            onOpen={setLightbox}
            onDownloadZip={downloadMany}
            onDelete={deleteResults}
            onGoStudio={() => setPage('studio')}
          />
        )}

        {page === 'guide' && <GuidePage onStart={() => setPage('studio')} />}
      </main>

      {page === 'studio' && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-[#faf7fd] via-[#faf7fd]/95 to-transparent pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-5xl mx-auto px-4">
            <button
              type="button"
              onClick={startGeneration}
              className={`block w-full py-4 rounded-2xl text-lg font-bold text-white transition-colors ${
                totalToMake && character ? 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200' : 'bg-[#d3b6ee]'
              }`}
            >
              {!character
                ? '캐릭터를 먼저 올려 주세요'
                : `선택한 ${selectedPoses.length}개 만들기${options.perPose > 1 ? ` (${totalToMake}장)` : ''}`}
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div role="status" className="fixed z-50 left-1/2 -translate-x-1/2 bottom-24 px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-sm shadow-lg">
          {notice}
        </div>
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          envKey={!!process.env.GEMINI_API_KEY}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showCustomPose && <CustomPoseModal onSave={addCustomPose} onClose={() => setShowCustomPose(false)} />}
      {lightbox && (
        <Lightbox
          item={lightbox}
          prefs={exportPrefs}
          onChangePrefs={changeExportPrefs}
          onDownload={downloadOne}
          onDelete={(r) => deleteResults([r])}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
};

export default App;
