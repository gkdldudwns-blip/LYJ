import { ANALYSIS_MODEL } from '../constants';
import { Character, CharacterKind, GenerateOptions, Pose, Settings } from '../types';
import { splitDataUrl } from './imageUtils';

export interface GenerateRequest {
  settings: Settings;
  character: Character;
  pose: Pose;
  options: GenerateOptions;
  /** 기본 포즈의 마네킹 썸네일(가이드) 또는 내 포즈의 참고 이미지 */
  poseImage?: { kind: 'guide' | 'reference'; dataUrl: string };
  caption?: string;
}

export const resolveApiKey = (settings: Settings) => settings.apiKey.trim() || process.env.GEMINI_API_KEY || '';

async function client(settings: Settings) {
  const apiKey = resolveApiKey(settings);
  if (!apiKey) throw new Error('Gemini API 키가 없어요. 오른쪽 위 설정에서 입력해 주세요.');
  // SDK가 커서 처음 쓸 때 불러온다
  const { GoogleGenAI } = await import('@google/genai');
  return new GoogleGenAI({ apiKey });
}

const imageBlock = (dataUrl: string) => {
  const { mimeType, data } = splitDataUrl(dataUrl);
  return { type: 'image' as const, mime_type: mimeType, data };
};

function buildInstructions({ character, pose, options, caption }: GenerateRequest): string {
  const lines = [
    'TASK: Draw the character from the CHARACTER REFERENCE in this pose:',
    pose.prompt,
    '',
    'BODY / ANATOMY:',
    `- ${KIND_LINE[character.kind ?? 'humanoid']}`,
    "- Perform the pose with the character's OWN body exactly as it is built in the reference.",
    '- If the pose mentions hands, fingers, arms or legs the character does not have, translate them: wings, paws, flippers or tiny nubs act as hands (e.g. a wing raised like a waving hand, a wing tip curled into a thumbs-up). If it has no limbs at all, express the pose with body tilt, squash and stretch, facial expression and comic symbols.',
    "- NEVER add human arms, hands, fingers or legs that the character does not have, and never change its species, body shape or proportions.",
    '',
    'KEEP THE CHARACTER IDENTICAL:',
    '- Same art style, line weight, line color and coloring method. If the reference is black-and-white line art, keep it black-and-white; if it is colored, use exactly the same palette.',
    '- Same head-to-body proportions, face design, eyes, hair, outfit and accessories.',
    '- It must look like the same artist drew it on the same day. Do not redesign the character and do not add details that are not in the reference.',
  ];
  if (character.note.trim()) lines.push(`- Description of this character (may be in Korean): ${character.note.trim()}`);
  lines.push(
    '',
    'COMPOSITION:',
    '- Exactly one character, the whole body visible unless the pose says otherwise, centered with a comfortable margin, filling about 80% of the frame.',
    '- Plain pure white (#FFFFFF) background. No scenery, no colored floor, no frame or border, no drop shadow, no watermark or signature. Small props mentioned in the pose are fine.',
  );
  lines.push(
    options.purpose === 'emoticon'
      ? '- PURPOSE: a chat sticker (Korean emoticon). Make the expression and gesture big, clear and readable even at 360x360 pixels, with a simple bold silhouette, while keeping the reference line style.'
      : '- PURPOSE: a character cut for an Instagram comic (instatoon) panel. Natural, expressive acting that fits a story panel.',
  );
  lines.push(
    caption
      ? `- TEXT: Hand-letter the Korean text "${caption}" exactly once, in bold cute lettering that matches the drawing, placed beside or above the character without covering it. Spell it exactly as given: ${caption}`
      : '- Do not draw any text, letters, speech bubbles or captions.',
  );
  if (options.extra.trim()) lines.push('', `EXTRA REQUEST FROM THE ARTIST (may be in Korean): ${options.extra.trim()}`);
  return lines.join('\n');
}

const KIND_LINE: Record<CharacterKind, string> = {
  humanoid: 'This character has a human-like body (two arms with hands and two legs), even if it is stylized or chibi.',
  creature: 'This character is an animal or creature whose body differs from a human (for example wings instead of arms, paws, four legs, a tail, or no arms).',
  object: 'This character is an object, food or a blob with no limbs or only tiny ones.',
};

export async function generatePoseImage(req: GenerateRequest): Promise<string> {
  const ai = await client(req.settings);

  const { character, poseImage } = req;
  const input: ({ type: 'text'; text: string } | ReturnType<typeof imageBlock>)[] = [
    {
      type: 'text',
      text:
        `You will draw a NEW illustration of an existing cartoon character in a new pose.\n` +
        `The next ${character.images.length} image(s) are the CHARACTER REFERENCE of the same character` +
        (character.images.length > 1 ? ' (the first one is the main front view).' : '.'),
    },
    ...character.images.map(imageBlock),
  ];
  if (poseImage?.kind === 'guide') {
    input.push(
      {
        type: 'text',
        text:
          'The next image is a POSE GUIDE drawn with a generic doodle mannequin (a round head with cross-shaped guide lines and no face). ' +
          'Use it ONLY to understand the body pose, gesture, head direction and prop placement; the cross lines only show where the face is pointing. ' +
          "Do NOT copy the mannequin's look, round head, cross lines, line style or proportions; draw the CHARACTER instead. " +
          'Comic symbols in the guide (sparkles, sweat drops, hearts, !, ?, Z, music notes) are optional mood hints.',
      },
      imageBlock(poseImage.dataUrl),
    );
  } else if (poseImage?.kind === 'reference') {
    input.push(
      {
        type: 'text',
        text:
          'The next image is a POSE REFERENCE (a photo or sketch). Copy only the body pose, gesture and expression from it; ' +
          "ignore its drawing style, the person's identity, clothes and background.",
      },
      imageBlock(poseImage.dataUrl),
    );
  }
  input.push({ type: 'text', text: buildInstructions(req) });

  const interaction = await withRetry(() =>
    ai.interactions.create({
      model: req.settings.model,
      input,
      response_format: {
        type: 'image',
        aspect_ratio: req.options.aspectRatio,
        image_size: req.settings.imageSize,
      },
      // 캐릭터 그림을 Google 서버에 대화 기록으로 남기지 않는다
      store: false,
    }),
  );

  const out = interaction.output_image;
  if (!out?.data) {
    const reason = interaction.output_text?.trim();
    throw new Error(reason ? `이미지가 만들어지지 않았어요: ${reason}` : '이미지가 만들어지지 않았어요. 다시 시도해 주세요.');
  }
  return `data:${out.mime_type ?? 'image/png'};base64,${out.data}`;
}

export interface CharacterAnalysis {
  kind: CharacterKind;
  description: string;
}

const ANALYSIS_PROMPT = `You help an artist turn their character into stickers in many poses. Look at the CHARACTER REFERENCE image(s) and reply with JSON only:
{"kind": "humanoid" | "creature" | "object", "description": "<Korean>"}
- kind: "humanoid" if it has a human-like body with two arms ending in hands and two legs (even if chibi or animal-headed); "creature" if it is an animal or creature whose body differs from a human (wings instead of arms, paws, four legs, no arms, a tail...); "object" if it is food, an object or a blob with no limbs or only tiny ones.
- description: 2-3 short Korean sentences: what it is, key colors and features, which body parts it can pose with (e.g. "팔 대신 작은 날개 2개, 주황색 다리 2개, 손가락 없음"), and finally how hand gestures should be expressed (e.g. "손동작은 날개로 표현").`;

/** 캐릭터가 사람형인지, 어떤 몸 구조인지 AI에게 묻는다 */
export async function analyzeCharacter(settings: Settings, character: Character): Promise<CharacterAnalysis> {
  const ai = await client(settings);
  const interaction = await withRetry(() =>
    ai.interactions.create({
      model: ANALYSIS_MODEL,
      input: [{ type: 'text', text: ANALYSIS_PROMPT }, ...character.images.map(imageBlock)],
      response_mime_type: 'application/json',
      store: false,
    }),
  );
  const text = interaction.output_text ?? '';
  const json = /\{[\s\S]*\}/.exec(text)?.[0];
  if (!json) throw new Error('캐릭터 분석 결과를 읽지 못했어요.');
  const parsed = JSON.parse(json) as Partial<CharacterAnalysis>;
  const kind: CharacterKind = parsed.kind === 'creature' || parsed.kind === 'object' ? parsed.kind : 'humanoid';
  return { kind, description: (parsed.description ?? '').trim() };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const statusOf = (err: unknown): number | undefined => {
  const s = (err as { status?: unknown })?.status;
  return typeof s === 'number' ? s : undefined;
};

/** 요청이 몰리거나(429) 서버가 바쁠 때(5xx) 잠시 쉬었다 다시 시도한다 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = statusOf(err);
      const retryable = status === 429 || (status !== undefined && status >= 500);
      if (!retryable || i >= attempts) throw err;
      await sleep(i * 8000);
    }
  }
}

export function describeError(err: unknown): string {
  const status = statusOf(err);
  const raw = err instanceof Error ? err.message : String(err);
  if (status === 400 && /api[_ ]?key/i.test(raw)) return 'API 키가 올바르지 않아요. 설정에서 키를 확인해 주세요.';
  if (status === 401 || status === 403) return 'API 키 권한이 없어요. 키가 맞는지, 결제(유료 등급)가 필요한 모델인지 확인해 주세요.';
  if (status === 404) return '모델을 찾을 수 없어요. 설정에서 다른 모델을 골라 주세요.';
  if (status === 429) return '요청이 너무 많아요. 잠시 후 다시 시도하거나, 설정에서 동시 생성 수를 줄여 주세요.';
  if (status !== undefined && status >= 500) return 'Gemini 서버가 바빠요. 잠시 후 다시 시도해 주세요.';
  if (/safety|blocked|prohibited/i.test(raw)) return '안전 정책 때문에 이 이미지는 만들 수 없었어요. 포즈나 추가 요청을 바꿔 보세요.';
  if (/failed to fetch|network/i.test(raw)) return '네트워크 오류예요. 인터넷 연결을 확인해 주세요.';
  return raw;
}
