import { ANALYSIS_MODEL } from '../constants';
import { Character, CharacterKind, GenerateOptions, Pose, PoseIdea, Settings } from '../types';
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
  if (character.traits?.trim())
    lines.push(`- TRADEMARK TRAITS that must appear exactly like this in every image, whatever the pose (may be in Korean): ${character.traits.trim()}`);
  if (options.useConcept && character.concept?.trim())
    lines.push(
      '',
      `PERSONALITY / CONCEPT (may be in Korean): ${character.concept.trim()}`,
      "- Act the pose in this personality. If the pose's emotion seems to clash with it, keep the requested pose and show it through this personality; a comic contrast is welcome.",
    )
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
        (character.images.length > 1 ? ' (the first one is the main reference; the others show the same character from other angles or in other poses).' : '.'),
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
    }, NO_SDK_RETRY),
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

/** 텍스트 모델에게 JSON으로 답을 받는다 (캐릭터 그림을 함께 보여 준다) */
type JsonSchema = Record<string, unknown>;
const str = { type: 'string' };
const obj = (properties: Record<string, JsonSchema>): JsonSchema => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
});

const ANALYSIS_SCHEMA = obj({ kind: { type: 'string', enum: ['humanoid', 'creature', 'object'] }, description: str });
const CONCEPTS_SCHEMA = obj({ concepts: { type: 'array', items: str } });
const IDEAS_SCHEMA = obj({ ideas: { type: 'array', items: obj({ name: str, caption: str, scene: str, prompt: str }) } });

async function askJson<T>(settings: Settings, prompt: string, character: Character, schema: JsonSchema): Promise<T> {
  const ai = await client(settings);
  const interaction = await withRetry(() =>
    ai.interactions.create(
      {
        model: ANALYSIS_MODEL,
        input: [{ type: 'text', text: prompt }, ...character.images.map(imageBlock)],
        // Interactions API는 JSON 출력을 response_format으로 지정한다 (response_mime_type만 주면 400)
        response_format: { type: 'text', mime_type: 'application/json', schema },
        store: false,
      },
      NO_SDK_RETRY,
    ),
  );
  const json = /\{[\s\S]*\}/.exec(interaction.output_text ?? '')?.[0];
  if (!json) throw new Error('AI 답변을 읽지 못했어요. 다시 시도해 주세요.');
  return JSON.parse(json) as T;
}

/** 캐릭터가 사람형인지, 어떤 몸 구조인지 AI에게 묻는다 */
export async function analyzeCharacter(settings: Settings, character: Character): Promise<CharacterAnalysis> {
  const parsed = await askJson<Partial<CharacterAnalysis>>(settings, ANALYSIS_PROMPT, character, ANALYSIS_SCHEMA);
  const kind: CharacterKind = parsed.kind === 'creature' || parsed.kind === 'object' ? parsed.kind : 'humanoid';
  return { kind, description: (parsed.description ?? '').trim() };
}

const describe = (c: Character) =>
  [
    c.note.trim() && `Description: ${c.note.trim()}`,
    c.traits?.trim() && `Trademark traits: ${c.traits.trim()}`,
    c.concept?.trim() && `Concept: ${c.concept.trim()}`,
  ]
    .filter(Boolean)
    .join('\n');

/** 그림과 설명을 보고 이모티콘 세트용 성격·콘셉트 후보를 받는다 */
export async function suggestConcepts(settings: Settings, character: Character): Promise<string[]> {
  const prompt = `You are a planner of Korean chat sticker (emoticon) sets. Look at the CHARACTER REFERENCE image(s) below.
${describe(character)}

Propose 5 distinct, catchy personality concepts that would make this character's sticker set stand out.
- Ground each one in something visible in the drawing (a facial habit, accessory, body shape...).
- Each is one short Korean phrase (max 30 characters), like "뭐든 휘파람으로 넘기는 태평한 병아리".
Reply with JSON only: {"concepts": ["...", "..."]}`;
  const parsed = await askJson<{ concepts?: unknown }>(settings, prompt, character, CONCEPTS_SCHEMA);
  return (Array.isArray(parsed.concepts) ? parsed.concepts : [])
    .filter((x): x is string => typeof x === 'string' && !!x.trim())
    .map((x) => x.trim())
    .slice(0, 5);
}

/** 콘셉트에 맞는 이모티콘 아이디어(이름·문구·포즈 설명)를 count개 기획한다 */
export async function planPoseIdeas(
  settings: Settings,
  character: Character,
  count: number,
  avoid: string[],
): Promise<PoseIdea[]> {
  const prompt = `You are a planner of Korean chat sticker (emoticon) sets. Look at the CHARACTER REFERENCE image(s) below.
${describe(character)}

Plan ${count} sticker ideas for one set.
- Every idea must be useful in everyday Korean chat (greetings, thanks, sorry, yes/no, cheering, reactions, feelings, daily life) AND clearly show the concept.
- All ideas must be different from each other${avoid.length ? ` and from these existing poses: ${avoid.join(', ')}` : ''}.
- Use only the body parts this character really has (for example wings instead of hands).
For each idea give:
- "name": short Korean title (max 8 characters)
- "caption": short Korean chat phrase for the sticker (max 10 characters)
- "scene": one short Korean sentence describing the scene for the artist (max 30 characters)
- "prompt": 1-2 English sentences describing the pose, gesture, expression and any small prop, for an image model
Reply with JSON only: {"ideas": [{"name": "...", "caption": "...", "scene": "...", "prompt": "..."}]}`;
  const parsed = await askJson<{ ideas?: unknown }>(settings, prompt, character, IDEAS_SCHEMA);
  return (Array.isArray(parsed.ideas) ? parsed.ideas : [])
    .map((x) => x as Partial<PoseIdea>)
    .filter((x) => typeof x.name === 'string' && typeof x.prompt === 'string' && x.name.trim() && x.prompt.trim())
    .map((x) => ({
      name: x.name!.trim(),
      caption: (x.caption ?? '').trim(),
      scene: (x.scene ?? '').trim(),
      prompt: x.prompt!.trim(),
    }))
    .slice(0, count);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const statusOf = (err: unknown): number | undefined => {
  const s = (err as { status?: unknown })?.status;
  return typeof s === 'number' ? s : undefined;
};

// 재시도는 withRetry가 맡는다. SDK도 따로 재시도하면 한도 초과(무료 등급) 때 같은 요청을 여러 번 보낸다
const NO_SDK_RETRY = { retries: { strategy: 'none' as const } };

const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * 다시 해도 소용없는 한도 초과: 무료 등급이라 이 모델 한도가 0이거나, 하루 한도를 다 쓴 경우.
 * 분당 요청 수 초과(잠깐 쉬면 풀림)와 구분한다.
 */
export function quotaBlock(err: unknown): 'billing' | 'daily' | null {
  if (statusOf(err) !== 429) return null;
  const raw = messageOf(err);
  if (/limit:\s*0\b|free[_ -]?tier/i.test(raw)) return 'billing';
  if (/per[_ -]?day|daily/i.test(raw)) return 'daily';
  return null;
}

/** 요청이 잠깐 몰리거나(429) 서버가 바쁠 때(5xx) 잠시 쉬었다 다시 시도한다 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = statusOf(err);
      const retryable = (status === 429 && !quotaBlock(err)) || (status !== undefined && status >= 500);
      if (!retryable || i >= attempts) throw err;
      await sleep(i * 8000);
    }
  }
}

export const BILLING_MESSAGE =
  '무료 API 키로는 이미지 모델을 쓸 수 없어요. Google AI Studio에서 결제(유료 등급)를 켜 주세요. 1K 그림 1장에 약 50원이에요.';

export function describeError(err: unknown): string {
  const status = statusOf(err);
  const raw = messageOf(err);
  const block = quotaBlock(err);
  if (block === 'billing') return BILLING_MESSAGE;
  if (block === 'daily') return '오늘 쓸 수 있는 양을 다 썼어요. 내일 다시 시도하거나 Google AI Studio에서 등급을 올려 주세요.';
  if (status === 400 && /api[_ ]?key/i.test(raw)) return 'API 키가 올바르지 않아요. 설정에서 키를 확인해 주세요.';
  if (status === 401 || status === 403) return 'API 키 권한이 없어요. 키가 맞는지, 결제(유료 등급)가 켜져 있는지 확인해 주세요.';
  if (status === 404) return '모델을 찾을 수 없어요. 설정에서 다른 모델을 골라 주세요.';
  if (status === 429)
    return '요청이 너무 많아요. 잠시 후 다시 시도하거나 설정에서 동시 생성 수를 줄여 주세요. 계속 이러면 Google AI Studio에서 결제(유료 등급)가 켜져 있는지 확인해 주세요.';
  if (status !== undefined && status >= 500) return 'Gemini 서버가 바빠요. 잠시 후 다시 시도해 주세요.';
  if (/safety|blocked|prohibited/i.test(raw)) return '안전 정책 때문에 이 이미지는 만들 수 없었어요. 포즈나 추가 요청을 바꿔 보세요.';
  if (/failed to fetch|network/i.test(raw)) return '네트워크 오류예요. 인터넷 연결을 확인해 주세요.';
  return raw;
}
