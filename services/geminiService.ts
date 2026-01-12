
import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, CalculationResult } from "../types";

export const getPensionAnalysis = async (input: UserInput, result: CalculationResult) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    Analyze this South Korean National Pension projection for 2026 standards:
    - User Age: ${input.age}
    - Monthly Gross Income: ${input.income.toLocaleString()} KRW
    - Registration Type: ${input.type === 'employee' ? 'Employee' : 'Individual'}
    - Expected Start Year: ${result.pensionStartYear}
    - Monthly Premium: ${result.monthlyPremium.toLocaleString()} KRW
    - Estimated Monthly Pension: ${result.estimatedMonthlyPension.toLocaleString()} KRW
    - Remaining Contribution Years: ${result.yearsToContribute}
    
    Provide a professional financial analysis in Korean. 
    Include:
    1. A short summary of their situation.
    2. 3 actionable tips for better retirement planning (e.g., ISA, IRP, Voluntary increase).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.STRING,
              description: "A summary of the pension situation in Korean.",
            },
            advice: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 professional financial advice points in Korean.",
            },
          },
          required: ["analysis", "advice"],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      analysis: "AI 분석을 불러오는 중 오류가 발생했습니다. 예상 수령액은 2026년 국민연금 개편안(보험료율 9.5%, 소득대체율 43%)을 기준으로 산출되었습니다.",
      advice: [
        "개인연금(IRP, 연금저축)을 활용해 세액공제와 노후 자금을 동시에 확보하세요.",
        "ISA 계좌를 통해 비과세 혜택을 극대화하는 투자 전략을 세워보세요.",
        "정기적인 공적연금 가입 확인을 통해 누락된 기간이 없는지 체크하세요."
      ]
    };
  }
};
