
import React from 'react';
import { UserInput, RegistrationType } from '../types';

interface Props {
  onCalculate: (data: UserInput) => void;
  isLoading: boolean;
}

const CalculatorForm: React.FC<Props> = ({ onCalculate, isLoading }) => {
  const [age, setAge] = React.useState<string>('30');
  const [income, setIncome] = React.useState<string>('3000000');
  const [type, setType] = React.useState<RegistrationType>(RegistrationType.EMPLOYEE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate({
      age: parseInt(age),
      income: parseInt(income),
      type,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 block">현재 나이 (만)</label>
        <div className="relative">
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg"
            placeholder="예: 30"
            min="18"
            max="60"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">세</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 block">현재 월 급여 (세전)</label>
        <div className="relative">
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg"
            placeholder="예: 3,000,000"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">원</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 block">가입 유형</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as RegistrationType)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg appearance-none cursor-pointer"
        >
          <option value={RegistrationType.EMPLOYEE}>직장 가입자 (회사 50% 부담)</option>
          <option value={RegistrationType.INDIVIDUAL}>지역 가입자 (본인 100% 부담)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            분석 중...
          </>
        ) : (
          '내 연금 정밀 분석하기'
        )}
      </button>
    </form>
  );
};

export default CalculatorForm;
