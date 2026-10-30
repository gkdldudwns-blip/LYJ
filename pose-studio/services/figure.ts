import { ArmSpec, Figure, Fx, Gesture, Prop } from '../types';

// 포즈 썸네일이자 모델에게 보내는 "포즈 가이드" 마네킹 (viewBox 200x200)
const INK = '#1f1f1f';
const GUIDE = '#b5b5b5';
const HEAD = { x: 100, y: 78, r: 44 };
const SHOULDER = { L: [86, 126], R: [114, 126] } as const;
const UPPER = 20;
const FORE = 18;
const LIMB = 13;
const LIMB_IN = 6;
const FINGER = 8;
const FINGER_IN = 3;

type P = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;
const n = (v: number) => Math.round(v * 10) / 10;
const pts = (ps: P[]) => ps.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
const add = (a: P, b: P, k = 1): P => [a[0] + b[0] * k, a[1] + b[1] * k];
const rotateDir = ([x, y]: P, deg: number): P => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [x * c - y * s, x * s + y * c];
};

const stroke = (w: number, color = INK) =>
  `fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const outline = (w = 3.5) => `fill="#fff" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"`;

interface Arm {
  shoulder: P;
  elbow: P;
  hand: P;
  dir: P;
  spec: ArmSpec;
}

function armGeom(side: 'L' | 'R', spec: ArmSpec): Arm {
  const [a, e = 0] = spec;
  const sx = side === 'L' ? -1 : 1;
  const u: P = [sx * Math.sin(rad(a)), Math.cos(rad(a))];
  const d: P = [sx * Math.sin(rad(a + e)), Math.cos(rad(a + e))];
  const shoulder: P = [...SHOULDER[side]] as P;
  const elbow = add(shoulder, u, UPPER);
  const hand = add(elbow, d, FORE);
  return { shoulder, elbow, hand, dir: d, spec };
}

/** 손가락 선분 목록 (손 위치, 팔 방향 기준) */
function fingers(g: Gesture | undefined, h: P, d: P): P[][] {
  switch (g) {
    case 'thumb':
      return [[add(h, [0, -4]), add(h, [0, -13])]];
    case 'v':
      return [[h, add(h, [-5, -13])], [h, add(h, [5, -13])]];
    case 'point':
      return [[h, add(h, d, 12)]];
    case 'pointUp':
      return [[h, add(h, [0, -13])]];
    case 'pointDown':
      return [[h, add(h, [0, 13])]];
    case 'open':
      return [-40, 0, 40].map((deg) => [h, add(h, rotateDir(d, deg), 9)]);
    case 'ok':
      return [[h, add(h, [0, -12])]];
    default:
      return [];
  }
}

function gestureExtra(g: Gesture | undefined, h: P, d: P): string {
  if (g === 'ok') {
    const c = add(h, d, 8);
    return `<circle cx="${n(c[0])}" cy="${n(c[1])}" r="4" ${outline(3)}/>`;
  }
  if (g === 'heart') {
    return fxHeart(h[0], h[1] - 15, 0.7);
  }
  return '';
}

/** 검은 외곽선 + 흰 속을 겹쳐 통통한 팔다리를 만든다 */
function limbs(lines: P[][], fingerLines: P[][] = []): string {
  const black =
    lines.map((l) => `<polyline points="${pts(l)}" ${stroke(LIMB)}/>`).join('') +
    fingerLines.map((l) => `<polyline points="${pts(l)}" ${stroke(FINGER)}/>`).join('');
  const white =
    lines.map((l) => `<polyline points="${pts(l)}" ${stroke(LIMB_IN, '#fff')}/>`).join('') +
    fingerLines.map((l) => `<polyline points="${pts(l)}" ${stroke(FINGER_IN, '#fff')}/>`).join('');
  return black + white;
}

function drawArm(arm: Arm): string {
  const g = arm.spec[2];
  return limbs([[arm.shoulder, arm.elbow, arm.hand]], fingers(g, arm.hand, arm.dir)) + gestureExtra(g, arm.hand, arm.dir);
}

function drawHand(at: P, g: Gesture | undefined, r = 0): string {
  const d = rotateDir([0, -1], r);
  return limbs([[at, at]], fingers(g, at, d)) + gestureExtra(g, at, d);
}

const LEGS: Record<NonNullable<Figure['legs']>, P[][]> = {
  stand: [[[92, 152], [91, 171]], [[108, 152], [109, 171]]],
  side: [[[97, 152], [96, 171]], [[103, 152], [105, 171]]],
  walk: [[[92, 152], [83, 169]], [[108, 152], [115, 170]]],
  jump: [[[92, 152], [82, 165]], [[108, 152], [118, 165]]],
  spread: [[[92, 152], [79, 170]], [[108, 152], [121, 170]]],
  kneel: [[[92, 152], [91, 162]], [[108, 152], [109, 162]]],
  sit: [[[92, 154], [76, 160]], [[108, 154], [124, 160]]],
  hidden: [],
};

const BODY = 'M87,116 C84,128 80,140 80,148 Q80,157 89,157 L111,157 Q120,157 120,148 C120,140 116,128 113,116 Z';

function drawHead(fig: Figure): string {
  const hx = HEAD.x + (fig.head?.x ?? 0);
  const hy = HEAD.y + (fig.head?.y ?? 0);
  const { r } = HEAD;
  let guide = '';
  if (fig.view !== 'back') {
    const [fx, fy] = fig.face ?? [0, 0];
    const vx = Math.max(-0.95, Math.min(0.95, fx));
    const vy = Math.max(-0.95, Math.min(0.95, fy));
    const g = stroke(3.2, GUIDE);
    guide +=
      Math.abs(vx) < 0.03
        ? `<line x1="${hx}" y1="${hy - r + 2}" x2="${hx}" y2="${hy + r - 2}" ${g}/>`
        : `<path d="M${hx},${hy - r + 2} A${n(Math.abs(vx) * r)},${r - 2} 0 0 ${vx > 0 ? 1 : 0} ${hx},${hy + r - 2}" ${g}/>`;
    guide +=
      Math.abs(vy) < 0.03
        ? `<line x1="${hx - r + 2}" y1="${hy}" x2="${hx + r - 2}" y2="${hy}" ${g}/>`
        : `<path d="M${hx - r + 2},${hy} A${r - 2},${n(Math.abs(vy) * r)} 0 0 ${vy > 0 ? 0 : 1} ${hx + r - 2},${hy}" ${g}/>`;
  }
  const rot = fig.head?.rot ? ` transform="rotate(${fig.head.rot},${hx},${hy})"` : '';
  return `<g${rot}><circle cx="${hx}" cy="${hy}" r="${r}" ${outline(4)}/>${guide}</g>`;
}

// ---------- 소품 ----------

function propShape(p: Prop): string {
  const o = outline();
  switch (p.k) {
    case 'phone':
      return `<rect x="-7" y="-11" width="14" height="22" rx="3" ${o}/><line x1="-3" y1="7" x2="3" y2="7" ${stroke(2)}/>`;
    case 'mic':
      return `<line x1="0" y1="0" x2="0" y2="16" ${stroke(5)}/><circle cx="0" cy="-4" r="7" fill="${INK}"/>`;
    case 'cup':
      return `<path d="M10,-3 q9,0 6,8 q-2,4 -8,3" ${stroke(3)}/><path d="M-10,-9 L10,-9 L8,11 L-8,11 Z" ${o}/>`;
    case 'beer':
      return `<path d="M10,-3 q9,0 7,9 q-2,4 -8,3" ${stroke(3)}/><rect x="-10" y="-8" width="20" height="22" rx="2" ${o}/><path d="M-11,-7 q1,-7 7,-5 q3,-6 8,-2 q6,-3 7,6 Z" ${o}/><path d="M-4,0 v9 M4,0 v9" ${stroke(2)}/>`;
    case 'sign':
      return `<line x1="0" y1="0" x2="0" y2="20" ${stroke(4)}/><rect x="-28" y="-38" width="56" height="38" rx="3" ${o}/>`;
    case 'pointer':
      return `<line x1="0" y1="0" x2="0" y2="-52" ${stroke(3)}/><circle cx="0" cy="-53" r="2.5" fill="${INK}"/>`;
    case 'laptop':
      return `<path d="M-32,-30 L32,-30 L28,8 L-28,8 Z" ${o}/><circle cx="0" cy="-12" r="4" ${stroke(2.5)}/><line x1="-38" y1="10" x2="38" y2="10" ${stroke(4)}/>`;
    case 'book':
      return `<path d="M0,-8 Q-10,-14 -21,-9 L-21,10 Q-10,5 0,11 Q10,5 21,10 L21,-9 Q10,-14 0,-8 Z" ${o}/><line x1="0" y1="-8" x2="0" y2="11" ${stroke(2.5)}/>`;
    case 'bag':
      return `<path d="M-6,8 q0,-9 6,-9 q6,0 6,9" ${stroke(3)}/><rect x="-12" y="7" width="24" height="18" rx="3" ${o}/>`;
    case 'dumbbell':
      return `<line x1="-12" y1="0" x2="12" y2="0" ${stroke(4)}/><rect x="-18" y="-8" width="7" height="16" rx="2" fill="${INK}"/><rect x="11" y="-8" width="7" height="16" rx="2" fill="${INK}"/>`;
    case 'pan':
      return `<line x1="0" y1="0" x2="20" y2="0" ${stroke(5)}/><ellipse cx="38" cy="0" rx="19" ry="7" ${o}/>`;
    case 'broom':
      return `<line x1="0" y1="-30" x2="0" y2="28" ${stroke(3.5)}/><path d="M-9,28 L9,28 L14,44 L-14,44 Z" ${o}/><path d="M-5,32 l-2,10 M0,32 v10 M5,32 l2,10" ${stroke(1.8)}/>`;
    case 'bowl':
      return `<path d="M-13,-3 L13,-3 Q12,12 0,12 Q-12,12 -13,-3 Z" ${o}/>`;
    case 'chopsticks':
      return `<path d="M0,4 L-6,-22 M3,4 L2,-23" ${stroke(2.5)}/>`;
    case 'magnifier':
      return `<line x1="0" y1="0" x2="9" y2="9" ${stroke(5)}/><circle cx="-8" cy="-8" r="11" ${o}/>`;
    case 'popper':
      return `<path d="M0,6 L-9,-22 L9,-22 Z" ${o}/><path d="M-4,-14 l8,-3 M-6,-6 l11,-3" ${stroke(2)}/>`;
    case 'headphones':
      return `<path d="M-47,6 A48,48 0 0 1 47,6" ${stroke(6)}/><rect x="-55" y="-8" width="14" height="28" rx="6" ${o}/><rect x="41" y="-8" width="14" height="28" rx="6" ${o}/>`;
    case 'pillow':
      return `<rect x="-34" y="-13" width="68" height="26" rx="13" ${o}/>`;
    case 'blanket':
      return `<path d="M-56,-22 Q-30,-30 0,-24 Q30,-30 58,-22 L58,20 L-56,20 Z" ${o}/><path d="M-40,-12 l6,10 M10,-14 l6,10" ${stroke(2)}/>`;
    case 'mat':
      return `<path d="M-68,-7 L68,-7 L80,7 L-80,7 Z" ${o}/>`;
    case 'money':
      return `<rect x="-11" y="-7" width="22" height="14" rx="1.5" ${o}/><circle cx="0" cy="0" r="3.5" ${stroke(2)}/>`;
    case 'pen':
      return `<line x1="0" y1="0" x2="0" y2="-20" ${stroke(3.5)}/>`;
    case 'cap':
      return `<path d="M-40,8 Q-38,-26 0,-30 Q38,-26 40,8 Z" ${o}/><circle cx="34" cy="-30" r="6" ${outline(3)}/>`;
    case 'desk':
      // 책상 아래(다리·몸통)를 가린다
      return `<rect x="-90" y="0" width="180" height="60" fill="#fff"/><line x1="-80" y1="0" x2="80" y2="0" ${stroke(4)}/>`;
    case 'floor':
      return `<line x1="-82" y1="0" x2="82" y2="0" ${stroke(3)}/>`;
    default:
      return '';
  }
}

function placeProp(p: Prop, origin: P): string {
  const x = origin[0] + (p.x ?? 0);
  const y = origin[1] + (p.y ?? 0);
  if (p.k === 'hand') return drawHand([x, y], p.g, p.r);
  const tr = `translate(${n(x)},${n(y)})${p.r ? ` rotate(${p.r})` : ''}${p.s ? ` scale(${p.s})` : ''}`;
  return `<g transform="${tr}">${propShape(p)}</g>`;
}

// ---------- 효과 ----------

function fxHeart(x: number, y: number, s = 1): string {
  return `<g transform="translate(${n(x)},${n(y)}) scale(${s})"><path d="M0,7 C-14,-2 -9,-14 0,-7 C9,-14 14,-2 0,7 Z" ${outline(3)}/></g>`;
}

function fxShape(f: Fx): string {
  switch (f.k) {
    case 'drops':
      return `<circle cx="0" cy="0" r="4" ${outline(2.5)}/><circle cx="10" cy="-7" r="3" ${outline(2.5)}/><circle cx="5" cy="9" r="2.2" ${outline(2)}/>`;
    case 'sweat':
      return `<path d="M0,-9 Q6,0 5,5 A5,5 0 1 1 -5,5 Q-6,0 0,-9 Z" ${outline(2.5)}/>`;
    case 'tears':
      return `<path d="M0,0 q-4,7 0,13 q4,7 0,13 M8,0 q-4,7 0,13 q4,7 0,13" ${stroke(3)}/>`;
    case 'heart':
      return `<path d="M0,7 C-14,-2 -9,-14 0,-7 C9,-14 14,-2 0,7 Z" ${outline(3)}/>`;
    case 'spark':
      return `<path d="M0,-10 Q1.5,-1.5 10,0 Q1.5,1.5 0,10 Q-1.5,1.5 -10,0 Q-1.5,-1.5 0,-10 Z" ${outline(2.5)}/>`;
    case 'text':
      return `<text x="0" y="0" font-size="24" font-weight="900" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" fill="${INK}">${f.t ?? ''}</text>`;
    case 'anger':
      return `<path d="M-9,-3 q6,0 6,-6 M3,-9 q0,6 6,6 M9,3 q-6,0 -6,6 M-3,9 q0,-6 -6,-6" ${stroke(3)}/>`;
    case 'shake':
      return `<path d="M0,-9 L0,9 M6,-6 L6,6" ${stroke(2.5)}/>`;
    case 'lines':
      return `<path d="M0,0 L12,0 M1,-9 L11,-14 M1,9 L11,14" ${stroke(2.5)}/>`;
    case 'gloom':
      return `<path d="M-18,0 v14 M-6,-4 v18 M6,-2 v16 M18,0 v12" ${stroke(2.5)}/>`;
    case 'steam':
      return `<path d="M-7,0 q-5,-6 0,-11 q5,-6 0,-11 M7,0 q-5,-6 0,-11 q5,-6 0,-11" ${stroke(2.5)}/>`;
    case 'blush':
      return `<path d="M-7,4 l4,-8 M-1,4 l4,-8 M5,4 l4,-8" ${stroke(2)}/>`;
    case 'bulb':
      return `<path d="M-9,5 A11,11 0 1 1 9,5 L6,11 L-6,11 Z" ${outline(3)}/><path d="M-4,15 h8 M-19,-8 l-6,-3 M19,-8 l6,-3 M0,-18 v-6" ${stroke(2.5)}/>`;
    case 'soul':
      return `<path d="M-9,10 Q-11,-11 0,-13 Q11,-11 9,10 Q5,6 0,10 Q-5,6 -9,10 Z" ${outline(2.5)}/><path d="M-3,-3 v2 M3,-3 v2" ${stroke(2)}/>`;
    case 'shadow':
      return `<ellipse cx="0" cy="0" rx="26" ry="5" fill="#d4d4d4"/>`;
    case 'confetti':
      return `<path d="M-14,-6 l5,3 M-2,-14 l3,5 M10,-8 l5,-3 M-10,8 l4,4 M8,6 l5,2 M0,2 l2,-5" ${stroke(2.5)}/>`;
    default:
      return '';
  }
}

function drawFx(f: Fx): string {
  const tr = `translate(${n(f.x)},${n(f.y)})${f.r ? ` rotate(${f.r})` : ''}${f.s ? ` scale(${f.s})` : ''}`;
  return `<g transform="${tr}">${fxShape(f)}</g>`;
}

// ---------- 조립 ----------

export function renderFigureSVG(fig: Figure, size = 200): string {
  const armL = fig.armL === false ? null : armGeom('L', fig.armL ?? [12, 4]);
  const armR = fig.armR === false ? null : armGeom('R', fig.armR ?? [12, 4]);
  const arms = [armL, armR].filter((a): a is Arm => a !== null);
  const layer = (l?: 'f' | 'h') => arms.filter((a) => a.spec[3] === l).map(drawArm).join('');

  const headOrigin: P = [HEAD.x + (fig.head?.x ?? 0), HEAD.y + (fig.head?.y ?? 0)];
  const anchor = (p: Prop): P | null => {
    if (p.at === 'L') return armL?.hand ?? null;
    if (p.at === 'R') return armR?.hand ?? null;
    if (p.at === 'head') return headOrigin;
    return null;
  };
  const attached = (fig.props ?? []).filter((p) => p.at && anchor(p));
  const world = (fig.props ?? []).filter((p) => !p.at);
  const placeAttached = (back: boolean) =>
    attached.filter((p) => !!p.back === back).map((p) => placeProp(p, anchor(p)!)).join('');

  const body =
    limbs(LEGS[fig.legs ?? 'stand']) +
    layer(undefined) +
    `<path d="${BODY}" ${outline(4)}/>` +
    layer('f') +
    placeAttached(true) +
    drawHead(fig) +
    layer('h') +
    placeAttached(false);

  const tr = [
    fig.x || fig.y ? `translate(${fig.x ?? 0},${fig.y ?? 0})` : '',
    fig.rot ? `rotate(${fig.rot},100,120)` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content =
    world.filter((p) => p.back).map((p) => placeProp(p, [0, 0])).join('') +
    `<g${tr ? ` transform="${tr}"` : ''}>${body}</g>` +
    world.filter((p) => !p.back).map((p) => placeProp(p, [0, 0])).join('') +
    (fig.fx ?? []).map(drawFx).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}"><rect width="200" height="200" fill="#fff"/>${content}</svg>`;
}

export function figureDataUrl(fig: Figure): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderFigureSVG(fig))}`;
}

/** 모델에게 보낼 PNG 포즈 가이드 */
export async function figureToPng(fig: Figure, size = 512): Promise<string> {
  const img = new Image();
  img.src = figureDataUrl(fig);
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  return canvas.toDataURL('image/png');
}
