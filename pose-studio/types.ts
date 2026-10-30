export type PoseCategory = 'basic' | 'positive' | 'negative' | 'info' | 'daily' | 'emoticon' | 'custom';

export type Gesture = 'fist' | 'open' | 'thumb' | 'v' | 'point' | 'pointUp' | 'pointDown' | 'ok' | 'heart';

/** [어깨 각도(아래=0, 바깥으로 +), 팔꿈치 굽힘, 손 모양, 레이어(f=몸 앞, h=머리 위)] */
export type ArmSpec = [number, number?, Gesture?, ('f' | 'h')?];

export type PropKind =
  | 'phone' | 'mic' | 'cup' | 'beer' | 'sign' | 'pointer' | 'laptop' | 'book' | 'bag'
  | 'dumbbell' | 'pan' | 'broom' | 'bowl' | 'chopsticks' | 'magnifier' | 'popper'
  | 'headphones' | 'pillow' | 'blanket' | 'mat' | 'money' | 'pen' | 'hand' | 'desk' | 'floor' | 'cap';

export interface Prop {
  k: PropKind;
  /** 손(L/R)이나 머리 기준으로 붙일 때. 없으면 화면 좌표 */
  at?: 'L' | 'R' | 'head';
  x?: number;
  y?: number;
  r?: number;
  s?: number;
  g?: Gesture;
  /** 캐릭터보다 뒤에 그리기 */
  back?: boolean;
}

export type FxKind =
  | 'drops' | 'sweat' | 'tears' | 'heart' | 'spark' | 'text' | 'anger' | 'shake' | 'lines'
  | 'gloom' | 'steam' | 'blush' | 'bulb' | 'soul' | 'shadow' | 'confetti';

export interface Fx {
  k: FxKind;
  x: number;
  y: number;
  r?: number;
  s?: number;
  t?: string;
}

export interface Figure {
  view?: 'front' | 'back';
  /** 얼굴 가이드선 방향: [좌우(-1~1), 위아래(-1~1)] */
  face?: [number, number];
  head?: { x?: number; y?: number; rot?: number };
  armL?: ArmSpec | false;
  armR?: ArmSpec | false;
  legs?: 'stand' | 'side' | 'walk' | 'jump' | 'spread' | 'kneel' | 'sit' | 'hidden';
  rot?: number;
  x?: number;
  y?: number;
  props?: Prop[];
  fx?: Fx[];
}

export interface Pose {
  id: string;
  name: string;
  category: PoseCategory;
  /** 모델에게 전달하는 포즈 설명 */
  prompt: string;
  /** 이모티콘 문구 기본값 */
  caption?: string;
  figure?: Figure;
  /** 내 포즈: 참고 이미지 (dataURL) */
  refImage?: string;
  createdAt?: number;
}

export interface Character {
  id: string;
  name: string;
  /** 정규화된 참고 이미지 (dataURL), 첫 장이 대표 */
  images: string[];
  note: string;
  createdAt: number;
}

export interface ResultItem {
  id: string;
  characterId: string;
  characterName: string;
  poseId: string;
  poseName: string;
  caption?: string;
  image: string;
  createdAt: number;
}

export type Purpose = 'emoticon' | 'instatoon';
export type AspectRatio = '1:1' | '4:5' | '3:4' | '9:16';
export type ImageSize = '1K' | '2K';

export interface Settings {
  apiKey: string;
  model: string;
  imageSize: ImageSize;
  concurrency: number;
  sendPoseGuide: boolean;
}

export interface GenerateOptions {
  purpose: Purpose;
  aspectRatio: AspectRatio;
  withCaption: boolean;
  captions: Record<string, string>;
  perPose: number;
  extra: string;
}

export type JobStatus = 'queued' | 'running' | 'done' | 'error';

export interface Job {
  id: string;
  pose: Pose;
  character: Character;
  options: GenerateOptions;
  status: JobStatus;
  result?: ResultItem;
  error?: string;
}

export type Page = 'studio' | 'gallery' | 'guide';
