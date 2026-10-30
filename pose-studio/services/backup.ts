import JSZip from 'jszip';
import { Character, Pose, ResultItem } from '../types';
import { splitDataUrl } from './imageUtils';

// 다른 기기로 옮길 때 쓰는 백업 파일(.zip): backup.json + 그림 파일들.
// API 키는 넣지 않는다.
export interface BackupData {
  characters: Character[];
  results: ResultItem[];
  poses: Pose[];
  favorites: string[];
}

const MANIFEST = 'backup.json';
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

export async function createBackup(data: BackupData): Promise<Blob> {
  const zip = new JSZip();
  const save = (dataUrl: string, name: string) => {
    const { mimeType, data: base64 } = splitDataUrl(dataUrl);
    const path = `${name}.${EXT[mimeType] ?? 'png'}`;
    zip.file(path, base64, { base64: true });
    return path;
  };
  const manifest: BackupData & { app: string; version: number; createdAt: number } = {
    app: 'jooniverstudio',
    version: 1,
    createdAt: Date.now(),
    characters: data.characters.map((c) => ({ ...c, images: c.images.map((img, i) => save(img, `characters/${c.id}_${i}`)) })),
    results: data.results.map((r) => ({ ...r, image: save(r.image, `results/${r.id}`) })),
    poses: data.poses.map((p) => (p.refImage ? { ...p, refImage: save(p.refImage, `poses/${p.id}`) } : p)),
    favorites: data.favorites,
  };
  zip.file(MANIFEST, JSON.stringify(manifest));
  return zip.generateAsync({ type: 'blob' });
}

export async function readBackup(file: Blob): Promise<BackupData> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error('백업 파일(.zip)이 아니에요.');
  }
  const manifestFile = zip.file(MANIFEST);
  if (!manifestFile) throw new Error('Jooniverstudio 백업 파일이 아니에요.');
  const manifest = JSON.parse(await manifestFile.async('string')) as BackupData;
  const load = async (path: string) => {
    const entry = zip.file(path);
    if (!entry) throw new Error(`백업 파일이 손상됐어요 (${path} 없음).`);
    const ext = path.split('.').pop()?.toLowerCase() ?? 'png';
    return `data:${MIME[ext] ?? 'image/png'};base64,${await entry.async('base64')}`;
  };
  return {
    characters: await Promise.all(
      (manifest.characters ?? []).map(async (c) => ({ ...c, images: await Promise.all(c.images.map(load)) })),
    ),
    results: await Promise.all((manifest.results ?? []).map(async (r) => ({ ...r, image: await load(r.image) }))),
    poses: await Promise.all(
      (manifest.poses ?? []).map(async (p) => (p.refImage ? { ...p, refImage: await load(p.refImage) } : p)),
    ),
    favorites: manifest.favorites ?? [],
  };
}
