
export enum RegistrationType {
  EMPLOYEE = 'employee',
  INDIVIDUAL = 'individual'
}

export interface UserInput {
  age: number;
  income: number;
  type: RegistrationType;
}

export interface CalculationResult {
  pensionStartYear: number;
  monthlyPremium: number;
  estimatedMonthlyPension: number;
  yearsToContribute: number;
  totalEstimatedContribution: number;
}

export interface AiAnalysisResult {
  analysis: string;
  advice: string[];
}
