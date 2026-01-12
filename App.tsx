
import React, { useState } from 'react';
import { UserInput, CalculationResult, AiAnalysisResult, RegistrationType } from './types';
import { PENSION_CONSTANTS } from './constants';
import CalculatorForm from './components/CalculatorForm';
import ResultView from './components/ResultView';
import { getPensionAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);

  const calculatePension = async (input: UserInput) => {
    setLoading(true);
    setAiAnalysis(null);

    // 1. Premium Calculation (2026 Standards)
    const { PREMIUM_RATE, LOWER_LIMIT, UPPER_LIMIT, RETIREMENT_AGE, MAX_CONTRIBUTION_AGE, INCOME_REPLACEMENT_RATE, REFERENCE_YEARS } = PENSION_CONSTANTS;
    
    let standard = input.income;
    if (standard < LOWER_LIMIT) standard = LOWER_LIMIT;
    if (standard > UPPER_LIMIT) standard = UPPER_LIMIT;
    standard = Math.floor(standard / 1000) * 1000;

    const totalPremium = Math.floor(standard * PREMIUM_RATE);
    const myShare = (input.type === RegistrationType.EMPLOYEE) ? Math.floor(totalPremium / 2) : totalPremium;

    // 2. Timing
    const currentYear = new Date().getFullYear();
    const waitYears = RETIREMENT_AGE - input.age;
    const startYear = currentYear + waitYears;
    const yearsToContribute = Math.max(10, MAX_CONTRIBUTION_AGE - input.age);

    // 3. Estimated Pension
    // Simplified model: replacementRate * income * (years / 40)
    let estimated = (standard * INCOME_REPLACEMENT_RATE) * (yearsToContribute / REFERENCE_YEARS);
    if (estimated < 250000) estimated = 250000; // Floor

    const calcResult: CalculationResult = {
      pensionStartYear: startYear,
      monthlyPremium: myShare,
      estimatedMonthlyPension: Math.floor(estimated),
      yearsToContribute,
      totalEstimatedContribution: myShare * 12 * yearsToContribute
    };

    setResult(calcResult);

    // 4. AI Analysis
    const analysis = await getPensionAnalysis(input, calcResult);
    setAiAnalysis(analysis);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      <header className="text-center mb-12">
        <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-4 uppercase tracking-widest">
          2026 Pension Reform Simulator
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
          국민연금 <span className="text-blue-600">AI 계산기</span>
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
          2026년 개편안 기준 보험료와 수령액을 분석하고,<br/>
          당신의 은퇴 설계를 위한 AI 맞춤형 제안을 받아보세요.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-10">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
            📊 정보 입력
          </h2>
          <CalculatorForm onCalculate={calculatePension} isLoading={loading} />
          
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notice</h4>
            <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-3">
              <li>보험료율 9.5%, 소득대체율 43% 기준 시뮬레이션입니다.</li>
              <li>실제 수령액은 물가상승률 및 개인 소득 이력에 따라 차이가 있습니다.</li>
              <li>본 자료는 법적 효력이 없으며 참고용으로만 활용하십시오.</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7">
          {result ? (
            <ResultView result={result} aiAnalysis={aiAnalysis} />
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 animate-pulse">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium">왼쪽에서 정보를 입력하시면<br/>정밀 분석 결과가 여기에 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-24 text-center border-t border-slate-100 pt-8 pb-12">
        <p className="text-sm text-slate-400">© 2025 AI Pension Lab. Powered by Gemini Flash 3.</p>
      </footer>
    </div>
  );
};

export default App;
