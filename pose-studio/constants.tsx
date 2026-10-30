import { AspectRatio, CharacterKind, GenerateOptions, Pose, PoseCategory, Settings } from './types';

export const CATEGORIES: { id: PoseCategory; label: string; role: string; description: string }[] = [
  { id: 'basic', label: '기본', role: '기준 자세', description: '정면·45도·측면·뒷모습. 캐릭터를 잡는 기준이 돼요.' },
  { id: 'positive', label: '긍정', role: '깨달음·결론', description: '해결하고 후련해진 순간. 이야기를 닫는 컷이에요.' },
  { id: 'negative', label: '부정', role: '문제·고민', description: '지치고 답답한 순간. "내 얘기네" 하고 멈추게 하는 컷이에요.' },
  { id: 'info', label: '정보성', role: '설명·CTA', description: '짚어주고 알려주는 장면. 저장·팔로우 유도 컷에 써요.' },
  { id: 'daily', label: '일상', role: '도입', description: '출근길, 집안일, 운동처럼 누구나 겪는 장면으로 첫 컷을 열어요.' },
  { id: 'emoticon', label: '이모티콘', role: '대화용', description: '인사·감사·사과처럼 채팅에서 바로 쓰는 표정과 동작이에요.' },
  { id: 'custom', label: '내 포즈', role: '직접 추가', description: '설명이나 참고 이미지로 나만의 포즈를 추가해요.' },
];

export const CHARACTER_KINDS: { id: CharacterKind; label: string; hint: string }[] = [
  { id: 'humanoid', label: '사람형', hint: '팔다리가 사람처럼 있어요' },
  { id: 'creature', label: '동물·생물', hint: '날개·앞발·꼬리 등 몸 구조가 달라요' },
  { id: 'object', label: '사물·기타', hint: '음식·물건처럼 팔다리가 없거나 아주 작아요' },
];

export const MODEL_PRESETS: { id: string; label: string }[] = [
  { id: 'gemini-nano-banana-2.1', label: 'Nano Banana 2.1 · 추천 (빠르고 저렴)' },
  { id: 'gemini-3-pro-image', label: 'Nano Banana Pro · 최고 품질, 글자 표현 우수' },
  { id: 'gemini-3.1-flash-image', label: 'Nano Banana 2 · 이전 세대' },
  { id: 'gemini-3.1-flash-lite-image', label: 'Nano Banana 2 Lite · 가장 저렴 (일관성 약함)' },
];

/** 캐릭터 참고 그림 최대 장수. Nano Banana는 입력 그림을 14장까지 받으므로 포즈 가이드 1장을 더해도 넉넉하다 */
export const MAX_CHARACTER_IMAGES = 8;

/** 캐릭터 분석에 쓰는 텍스트 모델 (항상 최신 Flash를 가리키는 별칭) */
export const ANALYSIS_MODEL = 'gemini-flash-latest';

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'gemini-nano-banana-2.1',
  imageSize: '1K',
  concurrency: 2,
  sendPoseGuide: true,
};

export const DEFAULT_OPTIONS: GenerateOptions = {
  purpose: 'emoticon',
  aspectRatio: '1:1',
  withCaption: false,
  captions: {},
  perPose: 1,
  extra: '',
  useConcept: true,
};

export const ASPECT_RATIOS: { id: AspectRatio; label: string }[] = [
  { id: '1:1', label: '1:1 정사각형' },
  { id: '4:5', label: '4:5 인스타 세로' },
  { id: '3:4', label: '3:4 세로' },
  { id: '9:16', label: '9:16 스토리' },
];

/** 내보내기 크기: 0 = 원본 */
export const EXPORT_SIZES: { id: number; label: string }[] = [
  { id: 0, label: '원본 크기' },
  { id: 360, label: '360×360 (카카오 멈춰있는·움직이는 이모티콘)' },
  { id: 540, label: '540×540 (카카오 큰 이모티콘)' },
  { id: 1080, label: '1080×1080 (인스타툰)' },
];

// 썸네일(public/poses/<id>.webp)은 기본 마네킹으로 그린 포즈 그림이고, 사람형 캐릭터에는 포즈 가이드로도 보낸다.
// 프롬프트는 몸짓·감정 중심으로 쓰고, 날개·앞발 등 캐릭터 몸에 맞게 바꾸는 일은 geminiService가 지시한다.
const p = (id: string, name: string, category: PoseCategory, prompt: string, caption?: string): Pose => ({
  id,
  name,
  category,
  prompt,
  caption,
  thumb: `poses/${id}.webp`,
});

export const POSES: Pose[] = [
  // ---------- 기본 ----------
  p('front', '정면', 'basic', 'Standing straight and facing the viewer, arms relaxed at the sides, calm neutral mood. A clean reference view.'),
  p('three-quarter', '45도 측면', 'basic', 'Standing in a three-quarter view, body and face turned about 45 degrees to the right, arms relaxed, calm mood.'),
  p('side', '측면', 'basic', 'Standing in full side profile facing right, arms relaxed, calm mood.'),
  p('back', '뒷모습', 'basic', 'Standing seen from directly behind, so we see the back of the head and body, arms relaxed.'),

  // ---------- 긍정 ----------
  p('thumbs-up', '엄지척', 'positive', 'Confident thumbs-up: one arm stretched out giving a big thumbs-up, the other hand on the hip, a proud happy grin. A small sparkle nearby.'),
  p('v-sign', '브이', 'positive', 'Cheerful V-sign (peace sign) held up next to the face with one hand, body leaning slightly, playful wink and big smile.'),
  p('hooray', '만세', 'positive', 'Hooray! Both arms thrown up high in celebration, body stretched up on tiptoes, laughing with joy. Sparkles around.'),
  p('jump', '점프', 'positive', 'Jumping for joy high in the air, knees tucked up, both arms raised, ecstatic. A small shadow on the ground below.'),
  p('clap', '박수', 'positive', 'Clapping both hands together in front of the chest, delighted smile, little impact lines around the hands.'),
  p('finger-heart', '손하트', 'positive', 'Making a small Korean finger heart toward the viewer with one hand, cheeky wink, tiny hearts floating.'),
  p('proud', '뿌듯', 'positive', 'Proud and satisfied: both hands on the hips, chest out, chin raised, smug closed-eye smile, sparkles around.'),
  p('idea', '깨달음', 'positive', 'Eureka moment: one index finger raised up, eyes wide and sparkling, a glowing light bulb above the head.'),
  p('touched', '감동', 'positive', 'Deeply moved and touched: both hands clasped together at the chest, sparkling teary eyes, trembling happy smile.'),
  p('flower', '꽃받침', 'positive', 'Cute "flower frame" pose: both hands cupped under the chin framing the face like petals, adorable bright smile, blushing cheeks.'),
  p('dance', '신나는 춤', 'positive', 'Happy dance: one arm pointing up diagonally, the other arm across the body, one knee lifted, music notes around, joyful.'),
  p('double-thumbs', '최고', 'positive', 'The best!: both arms stretched forward giving two big thumbs-up, beaming grin with sparkling eyes.'),

  // ---------- 부정 ----------
  p('head-clutch', '머리 감싸기', 'negative', 'Panicking: clutching the top of the head with both hands, elbows out, knees slightly bent, sweat drops flying around.'),
  p('cold-sweat-back', '식은땀 뒷모습', 'negative', 'Seen from behind, shoulders tense and stiff, nervous cold sweat drops popping around the head (we only see the back).'),
  p('tremble', '덜덜', 'negative', 'Trembling with anxiety: arms stiff at the sides, whole body shaking (short shake lines on both sides), nervous wavy mouth.'),
  p('desk-slump', '책상에 엎드림', 'negative', 'Slumped face-down on a desk with the arms folded under the head, completely drained, gloomy vertical lines above. Only the desk edge is drawn.'),
  p('chin-sigh', '턱 괴고 한숨', 'negative', 'Sitting behind a desk resting the chin on one hand, half-closed bored eyes, letting out a long sigh puff. Only the desk edge is drawn.'),
  p('peek-worry', '빼꼼 걱정', 'negative', 'Worried peeking: crouched behind the edge of a table with both hands on the edge, only the head and hands visible above it, anxious.'),
  p('cry', '엉엉 울기', 'negative', 'Crying loudly: rubbing the eyes with both fists, streams of tears, mouth open wailing.'),
  p('shock', '충격', 'negative', 'Shocked: jaw dropped, eyes popped wide, arms flung out stiffly to the sides, shock lines bursting around.'),
  p('angry', '화남', 'negative', 'Angry: fists clenched at the sides, body tense and leaning forward, gritted teeth, an anger vein mark, steam puffing from the head.'),
  p('sulk', '삐짐', 'negative', 'Sulking: arms crossed tightly, head turned away to the side with a pout, cheeks puffed out.'),
  p('melted', '녹아내림', 'negative', 'Completely exhausted: lying face-down flat on the floor like a melted puddle, limbs limp, wavy fatigue lines rising above.'),
  p('soul-out', '영혼 가출', 'negative', 'Spaced out: standing limp with arms hanging, blank stare, a small ghost-like soul floating out of the head.'),
  p('droop', '축 처짐', 'negative', 'Deep sigh: shoulders slumped, head drooping forward, arms dangling, a big sigh puff coming out.'),
  p('despair', '좌절', 'negative', 'Despair: on hands and knees on the floor with the head hanging low (OTL pose), gloomy dark lines above.'),
  p('stomp', '짜증', 'negative', 'Frustrated tantrum: fists clenched down at the sides, stomping one foot hard, scrunched angry face, impact lines at the foot.'),
  p('exhausted', '피곤', 'negative', 'Exhausted zombie: hunched forward, arms dangling, heavy drooping eyelids and dark circles, gloomy lines above.'),
  p('face-cover', '얼굴 감싸기', 'negative', 'Embarrassed or ashamed: covering the face with both hands, peeking through the fingers, head lowered, cheeks red.'),

  // ---------- 정보성 ----------
  p('point-side', '옆 가리키기', 'info', 'Explaining: pointing with one index finger to the side toward empty space (where information would go), other hand on the hip, friendly confident smile.'),
  p('point-up', '위 가리키기', 'info', 'Pointing upward at something above with one index finger, looking up, mouth open as if saying "Look here!".'),
  p('point-down', '아래 가리키기', 'info', 'Pointing down with one hand toward a caption or button below, leaning forward a little, cheerful "check this out" expression.'),
  p('point-down-both', '양손 아래 가리키기', 'info', 'Both hands pointing downward at the bottom of the frame (asking viewers to like, save and follow), big friendly smile.'),
  p('mic', '마이크 설명', 'info', 'Presenter: holding a microphone near the mouth with one hand, pointing to the side with the other, speaking enthusiastically.'),
  p('pointer', '지시봉', 'info', 'Teacher mode: holding a long pointer stick aimed at something to the side, knowing smile.'),
  p('sign', '팻말 들기', 'info', 'Holding up a BLANK rectangular signboard on a stick beside the head with one hand (the sign is completely empty), smiling.'),
  p('magnifier', '돋보기', 'info', 'Investigating: leaning forward and peering through a magnifying glass held in one hand, curious and focused.'),
  p('raise-hand', '손 들기', 'info', 'Attention please!: one hand raised high like asking a question, eager expression, an exclamation mark above.'),

  // ---------- 일상 ----------
  p('phone', '휴대폰 보기', 'daily', 'Scrolling a smartphone held with both hands at chest height, head tilted down at the screen, absorbed.'),
  p('call', '전화 통화', 'daily', 'Talking on the phone: holding a phone to the ear with one hand, the other hand gesturing, chatty mood.'),
  p('laptop', '노트북 작업', 'daily', 'Working on a laptop on a desk, typing, focused; the character sits behind the open laptop. Only the desk edge is drawn.'),
  p('coffee', '커피 한 잔', 'daily', 'Sipping hot coffee from a mug held in one hand, relaxed with eyes closed, steam rising from the mug.'),
  p('eat', '밥 먹기', 'daily', 'Eating: holding a rice bowl in one hand and chopsticks in the other, cheeks stuffed, happy.'),
  p('commute', '출근길', 'daily', 'Commuting to work: walking briskly to the side with a bag in one hand, slightly tired but determined.'),
  p('subway', '지하철 손잡이', 'daily', 'Standing in a crowded subway holding a hanging strap handle with one raised hand, swaying, sleepy commuter mood. Only the strap handles are drawn.'),
  p('run-late', '지각 달리기', 'daily', 'Running late: sprinting to the side with arms pumping, sweat flying, panicked, speed lines behind.'),
  p('workout', '운동', 'daily', 'Working out: lifting a dumbbell in a bicep curl with one arm, determined, a drop of sweat.'),
  p('stretch', '스트레칭', 'daily', 'Stretching on a yoga mat: sitting cross-legged with both arms raised overhead, calm deep breathing with eyes closed.'),
  p('sleep', '잠자기', 'daily', 'Sleeping peacefully lying on the back with a pillow and a blanket, eyes closed, "Zzz" floating up.'),
  p('phone-lying', '누워서 폰', 'daily', 'Lazy weekend: lying on the floor on the stomach, propped on the elbows, looking at a phone, legs kicked up behind.'),
  p('clean', '청소', 'daily', 'Cleaning: sweeping the floor with a broom held in both hands, humming happily.'),
  p('cook', '요리', 'daily', 'Cooking: holding a frying pan with one hand and flipping food in the air, focused cheerful look.'),
  p('shopping', '장보기', 'daily', 'Shopping: carrying full shopping bags in both hands, satisfied smile.'),
  p('cheers', '짠!', 'daily', 'Cheers!: raising a foamy beer mug high in a toast, happy flushed cheeks.'),
  p('read', '독서', 'daily', 'Reading a book held open with both hands, calm and focused.'),
  p('music', '음악 듣기', 'daily', 'Listening to music with big headphones, eyes closed, swaying, music notes floating.'),
  p('study', '공부', 'daily', 'Studying at a desk, writing in a notebook with a pen, concentrating. Only the desk edge is drawn.'),

  // ---------- 이모티콘 ----------
  p('hello', '안녕', 'emoticon', 'Waving hello energetically with one hand, big bright smile, little motion lines by the hand.', '안녕!'),
  p('thanks', '감사합니다', 'emoticon', 'Polite deep bow of gratitude: bending forward at the waist with the head lowered and hands together in front, sincere.', '감사합니다'),
  p('sorry', '미안해요', 'emoticon', 'Apologizing: palms pressed together in front of the face, eyes squeezed shut, head slightly bowed, apologetic sweat drop.', '미안해요'),
  p('congrats', '축하해', 'emoticon', 'Celebrating: pulling a party popper with confetti bursting out, ecstatic, other arm raised.', '축하해!'),
  p('love', '사랑해', 'emoticon', 'Love!: both arms raised and curved over the head to make a big heart shape, loving smile, hearts floating.', '사랑해'),
  p('fighting', '화이팅', 'emoticon', 'Fighting!: pumping one fist up in the air, the other fist at the waist, determined sparkling eyes, full of energy.', '화이팅!'),
  p('ok', 'OK', 'emoticon', 'Okay!: making an OK hand sign beside the face, confident wink.', 'OK!'),
  p('no', '안 돼', 'emoticon', 'No way!: crossing both forearms in a big X in front of the chest, stern face.', '안 돼!'),
  p('gasp', '헉', 'emoticon', 'Gasp!: both hands pressed to the cheeks, eyes popped wide, mouth in an O shape, startled, an exclamation mark.', '헉!'),
  p('sleepy', '졸려', 'emoticon', 'Sleepy yawn: covering a big yawn with one hand, teary half-closed eyes, swaying, "Zzz".', '졸려…'),
  p('hungry', '배고파', 'emoticon', 'Hungry: holding the rumbling belly with both hands, drooling, pleading eyes.', '배고파'),
  p('curious', '궁금', 'emoticon', 'Curious: head tilted to one side, index finger on the chin, a question mark floating.', '응?'),
  p('goodnight', '잘 자', 'emoticon', 'Good night: hugging a big pillow, wearing a sleeping cap, sleepy smile with closed eyes, "Zzz".', '잘 자'),
  p('tease', '메롱', 'emoticon', 'Teasing: sticking the tongue out and pulling down one lower eyelid with a finger (Korean "merong"), playful.', '메롱'),
  p('shy', '부끄', 'emoticon', 'Shy: hands clasped behind the back, body twisting, looking away with bright red blushing cheeks, a small heart.', '부끄'),
  p('waiting', '기다릴게', 'emoticon', 'Waiting patiently: sitting on the floor hugging the knees, looking up with puppy eyes.', '기다릴게'),
  p('no-work', '출근 싫어', 'emoticon', 'Tantrum: lying on the back on the floor flailing arms and legs, crying, refusing to go to work.', '출근 싫어'),
  p('off-work', '퇴근!', 'emoticon', 'Off work!: leaping into the air with joy, swinging a bag overhead, huge smile.', '퇴근!'),
];
