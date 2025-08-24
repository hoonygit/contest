
export enum QuestionType {
  GENERAL = 'GENERAL',
  BOSTON_NAMING = 'BOSTON_NAMING',
}

export interface Question {
  id: number;
  type: QuestionType;
  category: string;
  text: string;
  image?: string;
  correctAnswer: string;
}

export interface UserInfo {
  name: string;
  gender: '남성' | '여성' | '기타';
  ageGroup: '10대' | '20대' | '30대' | '40대' | '50대' | '60대' | '70대 이상';
}

export interface Answer {
  questionId: number;
  userAnswer: string;
  score: number;
  explanation: string;
}

export interface TestResult {
  id: string;
  userInfo: UserInfo;
  answers: Answer[];
  totalScore: number;
  timestamp: number;
}