
import React from 'react';
import { CalculationResult, AiAnalysisResult } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  result: CalculationResult;
  aiAnalysis: AiAnalysisResult | null;
}

const ResultView: React.FC<Props> = ({ result, aiAnalysis }) => {
  const chartData = [
    { name: '현재', val: 0 },
    { name: '납부완료', val: result.totalEstimatedContribution / 10000 },
    { name: '수령 10년', val: (result.estimatedMonthlyPension * 12 * 10) / 10000 },
    { name: '수령 20년', val: (result.estimatedMonthlyPension * 12 * 20) / 10000 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
          <p className="text-xs text-blue-600 font-bold uppercase mb-1">예상 수령 시기</p>
          <p className="text-xl font-bold text-blue-900">{result.pensionStartYear}년</p>
          <p className="text-xs text-blue-400">65세부터 평생</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
          <p className="text-xs text-emerald-600 font-bold uppercase mb-1">월 보험료</p>
          <p className="text-xl font-bold text-emerald-900">{result.monthlyPremium.toLocaleString()}원</p>
          <p className="text-xs text-emerald-400">2026 개편안 기준</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center">
          <p className="text-xs text-orange-600 font-bold uppercase mb-1">예상 월 수령액</p>
          <p className="text-xl font-bold text-orange-900">{result.estimatedMonthlyPension.toLocaleString()}원</p>
          <p className="text-xs text-orange-400">미래 가치 추정</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">AI</span>
          전문가 분석 리포트
        </h3>
        {aiAnalysis ? (
          <div className="space-y-4">
            <p className="text-slate-600 leading-relaxed text-sm">
              {aiAnalysis.analysis}
            </p>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">추천 재테크 전략</p>
              <ul className="grid gap-2">
                {aiAnalysis.advice.map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm">
                    <span className="bg-white text-blue-600 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs border border-blue-100">{idx + 1}</span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold mb-6">생애 연금 흐름 시뮬레이션 (단위: 만원)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-slate-400 mt-4 leading-relaxed text-center">
          * 위 차트는 단순 누적 납입금 대비 예상 수령 누계액을 비교한 시각화 자료입니다.<br/>
          * 화폐 가치 변화 및 실제 물가 상승률은 반영되지 않은 추정치입니다.
        </p>
      </div>
    </div>
  );
};

export default ResultView;
