import JSZip from 'jszip';

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

/** 업로드한 캐릭터 그림: 긴 변 max px로 줄이고 투명 배경은 흰색으로 채운다 */
export async function normalizeImage(src: string, max = 1024): Promise<string> {
  const img = await loadImage(src);
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/png');
}

export function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error('이미지 형식을 읽을 수 없어요.');
  return { mimeType: match[1], data: match[3] };
}

/**
 * 테두리와 이어진 흰 배경을 투명하게 만든다.
 * 선으로 둘러싸인 안쪽의 흰 부분(얼굴 등)은 그대로 둔다.
 */
export function clearWhiteBackground(image: ImageData, tolerance = 28) {
  const { data, width: w, height: h } = image;
  const state = new Uint8Array(w * h); // 0: 미방문, 1: 그림, 2: 배경
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const isWhite = (p: number) => {
    const i = p * 4;
    const lo = Math.min(data[i], data[i + 1], data[i + 2]);
    const hi = Math.max(data[i], data[i + 1], data[i + 2]);
    return data[i + 3] === 0 || (255 - lo <= tolerance && hi - lo <= 24);
  };
  const visit = (p: number) => {
    if (state[p]) return;
    if (isWhite(p)) {
      state[p] = 2;
      queue[tail++] = p;
    } else {
      state[p] = 1;
    }
  };
  for (let x = 0; x < w; x++) {
    visit(x);
    visit((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    visit(y * w);
    visit(y * w + w - 1);
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    if (x > 0) visit(p - 1);
    if (x < w - 1) visit(p + 1);
    if (p >= w) visit(p - w);
    if (p < w * (h - 1)) visit(p + w);
  }
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (state[p] === 2) {
      data[i + 3] = 0;
      continue;
    }
    // 배경과 맞닿은 밝은 가장자리 픽셀은 반투명으로 풀어 흰 테두리를 없앤다
    const x = p % w;
    const touchesBg =
      (x > 0 && state[p - 1] === 2) ||
      (x < w - 1 && state[p + 1] === 2) ||
      (p >= w && state[p - w] === 2) ||
      (p < w * (h - 1) && state[p + w] === 2);
    if (!touchesBg) continue;
    const lo = Math.min(data[i], data[i + 1], data[i + 2]);
    if (lo <= 120) continue;
    const alpha = Math.max(0.05, (255 - lo) / 135);
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.max(0, Math.min(255, Math.round((data[i + c] - 255 * (1 - alpha)) / alpha)));
    }
    data[i + 3] = Math.round(alpha * 255);
  }
}

function contentBounds(image: ImageData, transparent: boolean) {
  const { data, width: w, height: h } = image;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const filled = transparent
        ? data[i + 3] > 16
        : Math.min(data[i], data[i + 1], data[i + 2]) < 235;
      if (filled) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? { x: 0, y: 0, w, h } : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export interface ExportOptions {
  /** 0이면 원본 크기, 아니면 size×size 정사각형에 여백을 두고 맞춘다 */
  size: number;
  transparent: boolean;
}

export async function exportImage(src: string, { size, transparent }: ExportOptions): Promise<string> {
  if (!size && !transparent) return src;
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (transparent) {
    clearWhiteBackground(image);
    ctx.putImageData(image, 0, 0);
  }
  if (!size) return canvas.toDataURL('image/png');

  const box = contentBounds(image, transparent);
  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const octx = out.getContext('2d')!;
  if (!transparent) {
    octx.fillStyle = '#fff';
    octx.fillRect(0, 0, size, size);
  }
  const inner = size * 0.92;
  const scale = Math.min(inner / box.w, inner / box.h);
  const dw = box.w * scale;
  const dh = box.h * scale;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(canvas, box.x, box.y, box.w, box.h, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return out.toDataURL('image/png');
}

function downloadBlob(blob: Blob, filename: string) {
  // data: 주소를 바로 쓰면 브라우저가 파일 이름을 무시할 때가 있어 Blob 주소로 내려받는다
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function downloadDataUrl(dataUrl: string, filename: string) {
  downloadBlob(await (await fetch(dataUrl)).blob(), filename);
}

export async function downloadZip(files: { name: string; dataUrl: string }[], zipName: string) {
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, splitDataUrl(f.dataUrl).data, { base64: true });
  downloadBlob(await zip.generateAsync({ type: 'blob' }), zipName);
}

/** 파일 이름에 쓸 수 없는 문자를 정리한다 */
export const safeName = (s: string) => s.replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '') || 'image';
