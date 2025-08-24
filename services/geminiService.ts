
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

export const generateCategoryAnalysis = async (categoryName: string, score: number, totalQuestions: number): Promise<string> => {
    if (!API_KEY) {
        return "API 키가 설정되지 않아 AI 분석을 제공할 수 없습니다.";
    }

    const prompt = `
        You are a helpful assistant providing feedback on a cognitive assessment. Your response must be in Korean.
        Based on the user's performance in the '${categoryName}' category, provide a brief, one or two-sentence analysis.
        The user scored ${score} out of ${totalQuestions}.

        Guidelines:
        - Be encouraging and supportive.
        - Do NOT provide any medical diagnosis or advice. This is not a medical tool.
        - Frame the feedback in general terms (e.g., "능력이 안정적으로 보입니다." or "꾸준한 두뇌 활동이 도움이 될 수 있습니다.").
        - Keep it simple and easy to understand for a non-expert.
        - Your entire response should be just the analysis text, without any preamble or titles.

        Example for a low score in '기억력' (Memory): "최근 사건이나 정보를 기억하는 데 약간의 어려움이 있을 수 있습니다. 꾸준한 두뇌 훈련 활동이 도움이 될 수 있습니다."
        Example for a high score in '언어 기능' (Language Function): "언어를 이해하고 표현하는 능력이 안정적으로 보입니다. 이는 의사소통에 있어 중요한 강점입니다."
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error generating analysis for ${categoryName}:`, error);
        return "AI 분석 중 오류가 발생했습니다.";
    }
};
