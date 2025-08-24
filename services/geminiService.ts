
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set. Gemini evaluation will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

interface EvaluationResponse {
  score: number;
  explanation: string;
}

export const evaluateAnswer = async (question: Question, userAnswer: string): Promise<EvaluationResponse> => {
  if (!API_KEY) {
    // Fallback for local development without API key
    const isCorrect = userAnswer.toLowerCase().includes(question.correctAnswer.toLowerCase());
    return {
      score: isCorrect ? 1 : 0,
      explanation: isCorrect ? '정답입니다.' : '정답과 다릅니다.',
    };
  }

  const prompt = `
    You are an evaluator for a cognitive impairment test. Your task is to determine if the user's answer is correct.
    Be flexible with minor variations in phrasing, but the core meaning must be correct. For calculation or specific memory questions, the answer must be exact.

    - Question: "${question.text}"
    - Expected Answer: "${question.correctAnswer}"
    - User's Answer: "${userAnswer}"

    Is the user's answer correct?
    Provide your response in a JSON object with two fields: "score" (1 for correct, 0 for incorrect) and "explanation" (a brief, one-sentence explanation in Korean).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "1 for correct, 0 for incorrect." },
            explanation: { type: Type.STRING, description: "A brief explanation in Korean." },
          },
        },
      },
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (typeof result.score === 'number' && typeof result.explanation === 'string') {
      return result;
    } else {
      throw new Error("Invalid JSON structure from Gemini.");
    }

  } catch (error) {
    console.error("Error evaluating answer with Gemini:", error);
    // Fallback in case of API error
    return {
      score: 0,
      explanation: "AI 평가 중 오류가 발생했습니다."
    };
  }
};
