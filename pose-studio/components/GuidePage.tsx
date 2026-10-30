import React from 'react';
import { CATEGORIES } from '../constants';
import { Card } from './ui';

const STEPS = [
  {
    title: '내 캐릭터 한 장 올리기',
    body: '정면 전신 그림 1장이면 돼요. 사람이 아니어도 괜찮아요. 병아리·고양이·음식 캐릭터도 AI가 몸 구조를 파악해서 그 몸에 맞게 포즈를 잡아요.',
  },
  { title: '쓰고 싶은 포즈 고르기', body: '기본·긍정·부정·정보성·일상·이모티콘 중에서 여러 개를 한 번에 골라요. 없는 포즈는 "내 포즈"로 추가해요.' },
  { title: '같은 그림체로 받기', body: '내 캐릭터가 그 포즈로 그려져 나와요. 투명 배경, 이모티콘 규격으로 바로 저장할 수 있어요.' },
];

const GuidePage: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="space-y-6">
    <div className="text-center pt-6">
      <span className="text-xs font-bold text-purple-600">이모티콘 · 인스타툰 작업용</span>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl text-slate-900">캐릭터 포즈 생성기</h1>
      <p className="mt-3 text-slate-600 leading-relaxed">
        포즈를 매번 새로 고민하지 마세요.
        <br />내 캐릭터 그림 한 장만 올리세요.
      </p>
      <button type="button" onClick={onStart} className="mt-6 px-7 py-3.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-200">
        포즈 만들러 가기
      </button>
    </div>

    <Card className="p-5 sm:p-6">
      <h2 className="font-bold text-lg mb-4">이렇게 사용해요</h2>
      <ol className="space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3 rounded-2xl bg-[#faf7fd] border border-[#efe6f8] p-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
            <span>
              <span className="block font-bold text-slate-900">{s.title}</span>
              <span className="block text-sm text-slate-600 mt-0.5">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>

    <Card className="p-5 sm:p-6">
      <h2 className="font-bold text-lg mb-4">포즈 유형</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {CATEGORIES.map((c, i) => (
          <div key={c.id} className="rounded-2xl border border-[#efe6f8] bg-[#fcfaff] p-4">
            <p className="font-bold text-slate-900">
              <span className="text-purple-300 mr-2">{String(i + 1).padStart(2, '0')}</span>
              {c.label}
            </p>
            <p className="text-sm text-purple-600 mt-1">{c.role}</p>
            <p className="text-sm text-slate-600 mt-1">{c.description}</p>
          </div>
        ))}
      </div>
    </Card>

    <Card className="p-5 sm:p-6 space-y-4 text-sm text-slate-700 leading-relaxed">
      <h2 className="font-bold text-lg text-slate-900">이모티콘 만들 때</h2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          카카오 이모티콘 스튜디오 제안 기준으로 멈춰있는 이모티콘은 <b>360×360 PNG 32개</b>예요. 저장할 때 "360×360"과 "흰 배경
          투명하게"를 켜면 바로 맞춰져요.
        </li>
        <li>"그림에 문구 넣기"를 켜면 이모티콘 탭 포즈마다 기본 문구(안녕!, 감사합니다 등)가 채워져요. 원하는 말로 바꿔도 돼요.</li>
        <li>한글 글자가 틀리게 나오면 문구 없이 만든 뒤 직접 글씨를 얹거나, 설정에서 Nano Banana Pro 모델로 바꿔 보세요.</li>
        <li>최신 규격과 심사 기준은 카카오 이모티콘 스튜디오 공지를 꼭 확인하세요.</li>
      </ul>
      <h2 className="font-bold text-lg text-slate-900 pt-2">인스타툰 만들 때</h2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          <b>스토리텔링</b>: 일상(도입) → 부정(문제·고민) → 긍정(해결) 순서로 고르면 한 편이 굴러가요.
        </li>
        <li>
          <b>썸네일</b>: 첫 컷에서 멈추게 하는 과장된 표정(충격, 녹아내림, 식은땀 뒷모습)이 잘 먹혀요.
        </li>
        <li>
          <b>마지막 컷</b>: 정보성의 "양손 아래 가리키기"로 저장·공유·팔로우를 부탁해요.
        </li>
      </ul>
    </Card>
  </div>
);

export default GuidePage;
