export type PoseCategory = 'basic' | 'positive' | 'negative' | 'info' | 'daily' | 'emoticon' | 'custom';

export interface Pose {
  id: string;
  name: string;
  category: PoseCategory;
  /** 모델에게 전달하는 포즈 설명 */
  prompt: string;
  /** 이모티콘 문구 기본값 */
  caption?: string;
  /** 기본 포즈: 썸네일 그림 경로 (public/ 기준) */
  thumb?: string;
  /** 내 포즈: 참고 이미지 (dataURL) */
  refImage?: string;
  createdAt?: number;
}

export type CharacterKind = 'humanoid' | 'creature' | 'object';

export interface Character {
  id: string;
  name: string;
  /** 정규화된 참고 이미지 (dataURL), 첫 장이 대표 */
  images: string[];
  /** 캐릭터 설명. AI 분석이 채우고 사용자가 고칠 수 있다 */
  note: string;
  /** 몸 구조. 없으면 아직 분석 전 */
  kind?: CharacterKind;
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
