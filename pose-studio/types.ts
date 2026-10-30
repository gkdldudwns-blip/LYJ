export type PoseCategory = 'basic' | 'positive' | 'negative' | 'info' | 'daily' | 'emoticon' | 'custom';

export interface Pose {
  id: string;
  name: string;
  category: PoseCategory;
  /** 모델에게 전달하는 포즈 설명 */
  prompt: string;
  /** 이모티콘 문구 기본값 */
  caption?: string;
  /** 화면에 보여 줄 한국어 장면 설명 (기획으로 만든 내 포즈) */
  desc?: string;
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
  /** 성격·콘셉트. 모든 포즈를 이 성격으로 연기한다 (예: 뭐든 휘파람으로 넘기는 태평한 병아리) */
  concept?: string;
  /** 어떤 포즈에서도 지킬 트레이드마크 (예: 부리 없음, 리본은 머리 오른쪽 위) */
  traits?: string;
  createdAt: number;
}

/** 콘셉트로 기획한 이모티콘 아이디어 하나 */
export interface PoseIdea {
  name: string;
  caption: string;
  /** 한국어 장면 설명 (화면용) */
  scene: string;
  /** 이미지 모델에게 보낼 영어 포즈 설명 */
  prompt: string;
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
  /** 캐릭터 콘셉트를 연기에 반영할지 */
  useConcept: boolean;
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
