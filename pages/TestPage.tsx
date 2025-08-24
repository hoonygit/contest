import React, { useState, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTestQuestions } from '../services/questionService';
import { evaluateAnswer } from '../services/geminiService';
import { saveResult } from '../services/storageService';
import useSpeech from '../hooks/useSpeech';
import { Question, UserInfo, Answer, TestResult, QuestionType } from '../types';
import { TOTAL_QUESTIONS, ANSWER_TIMEOUT_SECONDS } from '../constants';
import { Mic, Volume2, User, Users, Bot, Loader2, Image as ImageIcon } from 'lucide-react';

type TestState =
  | { status: 'IDLE' }
  | { status: 'REQUESTING_PERMISSION' }
  | { status: 'GETTING_USER_INFO', stage: 'name' | 'gender' | 'ageGroup' }
  | { status: 'STARTING_TEST' }
  | { status: 'ASKING_QUESTION', qIndex: number }
  | { status: 'LISTENING', qIndex: number }
  | { status: 'EVALUATING', qIndex: number }
  | { status: 'COMPLETED' }
  | { status: 'ERROR', message: string };

type Action =
  | { type: 'START_TEST' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED' }
  | { type: 'USER_INFO_COLLECTED'; field: keyof UserInfo, value: any }
  | { type: 'QUESTIONS_LOADED' }
  | { type: 'QUESTION_ASKED', qIndex: number }
  | { type: 'ANSWER_RECEIVED', answer: string }
  | { type: 'EVALUATION_COMPLETE' }
  | { type: 'TEST_FINISHED' }
  | { type: 'ERROR', message: string };

const initialState: TestState = { status: 'IDLE' };

const testReducer = (state: TestState, action: Action): TestState => {
    switch (action.type) {
        case 'START_TEST': return { status: 'REQUESTING_PERMISSION' };
        case 'PERMISSION_GRANTED': return { status: 'GETTING_USER_INFO', stage: 'name' };
        case 'PERMISSION_DENIED': return { status: 'ERROR', message: '마이크 사용 권한이 필요합니다.' };
        case 'USER_INFO_COLLECTED':
            if (state.status === 'GETTING_USER_INFO') {
                if (state.stage === 'name') return { ...state, stage: 'gender' };
                if (state.stage === 'gender') return { ...state, stage: 'ageGroup' };
                if (state.stage === 'ageGroup') return { status: 'STARTING_TEST' };
            }
            return state;
        case 'QUESTIONS_LOADED': return { status: 'ASKING_QUESTION', qIndex: 0 };
        case 'QUESTION_ASKED': return { status: 'LISTENING', qIndex: action.qIndex };
        case 'ANSWER_RECEIVED': return { status: 'EVALUATING', qIndex: state.status === 'LISTENING' ? state.qIndex : -1 };
        case 'EVALUATION_COMPLETE':
            if (state.status === 'EVALUATING' || state.status === 'LISTENING') {
                const nextIndex = state.qIndex + 1;
                return nextIndex < TOTAL_QUESTIONS ? { status: 'ASKING_QUESTION', qIndex: nextIndex } : { status: 'COMPLETED' };
            }
            return state;
        case 'TEST_FINISHED': return { status: 'IDLE' };
        case 'ERROR': return { status: 'ERROR', message: action.message };
        default: return state;
    }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const TestPage: React.FC = () => {
    const [state, dispatch] = useReducer(testReducer, initialState);
    const [userInfo, setUserInfo] = useState<Partial<UserInfo>>({});
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const { speak, listen, isSpeaking, isListening } = useSpeech();
    const navigate = useNavigate();

    useEffect(() => {
        const runTestFlow = async () => {
            try {
                switch (state.status) {
                    case 'REQUESTING_PERMISSION':
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            stream.getTracks().forEach(track => track.stop());
                            dispatch({ type: 'PERMISSION_GRANTED' });
                        } catch (err) {
                            dispatch({ type: 'PERMISSION_DENIED' });
                        }
                        break;
                    
                    case 'GETTING_USER_INFO':
                        const askAndListen = async (
                            question: string,
                            field: keyof UserInfo,
                            process: (v: string) => string | null,
                            grammar?: string[]
                        ) => {
                            const MAX_RETRIES = 3;
                            let retries = 0;

                            await speak(question);
                            await delay(500);

                            while (retries < MAX_RETRIES) {
                                try {
                                    const response = await listen(ANSWER_TIMEOUT_SECONDS, grammar);
                                    setCurrentTranscript(response);

                                    if (response.trim().includes('다시')) {
                                        await speak("네, 다시 질문해 드릴게요.");
                                        await speak(question);
                                        await delay(500);
                                        continue;
                                    }

                                    const processedValue = process(response);
                                    if (processedValue !== null) {
                                        setUserInfo(prev => ({ ...prev, [field]: processedValue as any }));
                                        dispatch({ type: 'USER_INFO_COLLECTED', field, value: processedValue });
                                        return;
                                    } else {
                                        retries++;
                                        if (retries < MAX_RETRIES) {
                                            await speak("죄송합니다, 잘 이해하지 못했어요. 다시 말씀해주세요.");
                                            await speak(question);
                                            await delay(500);
                                        }
                                    }
                                } catch (err) {
                                    if (err === 'no-speech' || err === 'Listening timeout.') {
                                        retries++;
                                        if (retries < MAX_RETRIES) {
                                            const message = err === 'no-speech'
                                                ? "아무런 답변이 들리지 않았습니다. 다시 한 번 말씀해주시겠어요?"
                                                : "답변 시간이 초과되었습니다. 다시 한 번 말씀해주시겠어요?";
                                            await speak(message);
                                            await speak(question);
                                            await delay(500);
                                        }
                                    } else {
                                        throw err;
                                    }
                                }
                            }
                            throw new Error("음성 입력을 받는 데 실패하여 테스트를 중단합니다.");
                        };
                        
                        if (state.stage === 'name' && !userInfo.name) {
                            await askAndListen('테스트를 시작하겠습니다. 먼저 성함을 말씀해주세요.', 'name', (v) => v || null);
                        } else if (state.stage === 'gender' && !userInfo.gender) {
                             const genderGrammar = ['남성', '여성', '남자', '여자', '기타'];
                             const processGender = (v: string): '남성' | '여성' | '기타' | null => {
                                const cleanV = v.replace(/\s+/g, '').toLowerCase();
                                if (cleanV.includes('남성') || cleanV.includes('남자')) {
                                    return '남성';
                                }
                                if (cleanV.includes('여성') || cleanV.includes('여자')) {
                                    return '여성';
                                }
                                if (cleanV.includes('기타')) {
                                    return '기타';
                                }
                                return null;
                            };
                            await askAndListen('성별을 말씀해주세요. 예를 들어, 남성 또는 여성.', 'gender', processGender, genderGrammar);
                        } else if (state.stage === 'ageGroup' && !userInfo.ageGroup) {
                            const ageGrammar = [
                                '10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대',
                                '십대', '이십대', '삼십대', '사십대', '오십대', '육십대', '칠십대', '팔십대', '구십대',
                                '열살', '스무살', '서른살', '마흔살', '쉰살', '예순살', '일흔살', '여든살', '아흔살',
                                '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔',
                                '십', '이십', '삼십', '사십', '오십', '육십', '칠십', '팔십', '구십'
                            ];
                            const processAgeGroup = (v: string): UserInfo['ageGroup'] | null => {
                                const cleanV = v.replace(/\s+/g, '');
                                if (cleanV.includes('10') || cleanV.includes('십') || cleanV.includes('열')) return '10대';
                                if (cleanV.includes('20') || cleanV.includes('이십') || cleanV.includes('스무') || cleanV.includes('스물')) return '20대';
                                if (cleanV.includes('30') || cleanV.includes('삼십') || cleanV.includes('서른')) return '30대';
                                if (cleanV.includes('40') || cleanV.includes('사십') || cleanV.includes('마흔')) return '40대';
                                if (cleanV.includes('50') || cleanV.includes('오십') || cleanV.includes('쉰')) return '50대';
                                if (cleanV.includes('60') || cleanV.includes('육십') || cleanV.includes('예순')) return '60대';
                                if (cleanV.includes('70') || cleanV.includes('칠십') || cleanV.includes('일흔') ||
                                    cleanV.includes('80') || cleanV.includes('팔십') || cleanV.includes('여든') ||
                                    cleanV.includes('90') || cleanV.includes('구십') || cleanV.includes('아흔')) return '70대 이상';
                                return null;
                            };
                            await askAndListen('연령대를 말씀해주세요. 예를 들어, 10대, 20대.', 'ageGroup', processAgeGroup, ageGrammar);
                        }
                        break;

                    case 'STARTING_TEST':
                        await speak(`${userInfo.name}님, 반갑습니다. 지금부터 인지 능력 평가를 시작하겠습니다. 총 ${TOTAL_QUESTIONS}개의 문항이 제시됩니다.`);
                        setQuestions(getTestQuestions());
                        dispatch({ type: 'QUESTIONS_LOADED' });
                        break;

                    case 'ASKING_QUESTION':
                        const currentQuestion = questions[state.qIndex];
                        await speak(currentQuestion.text);
                        await delay(500); // Add a brief pause for better user experience
                        dispatch({ type: 'QUESTION_ASKED', qIndex: state.qIndex });
                        break;
                    
                    case 'LISTENING':
                        let userAnswer: string | null = null;
                        const MAX_RETRIES = 3;
                        let retries = 0;

                        while (retries < MAX_RETRIES) {
                            try {
                                const receivedAnswer = await listen(ANSWER_TIMEOUT_SECONDS);
                                setCurrentTranscript(receivedAnswer);

                                if (receivedAnswer.trim().includes('다시')) {
                                    await speak("네, 질문을 다시 들려드릴게요.");
                                    const qToRetry = questions[state.qIndex];
                                    await speak(qToRetry.text);
                                    await delay(500);
                                    continue;
                                }
                                
                                userAnswer = receivedAnswer;
                                break;
                            } catch (err) {
                                if (err === 'no-speech' || err === 'Listening timeout.') {
                                    retries++;
                                    if (retries < MAX_RETRIES) {
                                        const message = err === 'no-speech'
                                            ? "아무런 답변이 들리지 않았습니다. 다시 한 번 말씀해주시겠어요?"
                                            : "답변 시간이 초과되었습니다. 다시 한 번 말씀해주시겠어요?";
                                        await speak(message);
                                        const qToRetry = questions[state.qIndex];
                                        await speak(qToRetry.text);
                                        await delay(500);
                                    }
                                } else {
                                    throw err;
                                }
                            }
                        }

                        if (userAnswer) {
                            dispatch({ type: 'ANSWER_RECEIVED', answer: userAnswer });
                        } else {
                            await speak("답변이 없어 이 문항을 건너뛰겠습니다.");
                            const qSkipped = questions[state.qIndex];
                            setAnswers(prev => [...prev, { questionId: qSkipped.id, userAnswer: '답변 없음', score: 0, explanation: '사용자가 답변하지 않았습니다.' }]);
                            dispatch({ type: 'EVALUATION_COMPLETE' });
                        }
                        break;

                    case 'EVALUATING':
                        const q = questions[state.qIndex];
                        const { score, explanation } = await evaluateAnswer(q, currentTranscript);
                        setAnswers(prev => [...prev, { questionId: q.id, userAnswer: currentTranscript, score, explanation }]);
                        setCurrentTranscript('');
                        dispatch({ type: 'EVALUATION_COMPLETE' });
                        break;
                    
                    case 'COMPLETED':
                        const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
                        await speak(`모든 테스트가 완료되었습니다. 잠시 후 결과 페이지로 이동합니다. 총점은 ${totalScore}점 입니다.`);
                        const finalResult: TestResult = {
                            id: new Date().toISOString(),
                            userInfo: userInfo as UserInfo,
                            answers,
                            totalScore,
                            timestamp: Date.now()
                        };
                        saveResult(finalResult);
                        navigate(`/results/${finalResult.id}`);
                        break;
                }
            } catch (err: any) {
                console.error(err);
                const message = typeof err === 'string' ? err : err.message || '알 수 없는 오류가 발생했습니다.';
                dispatch({ type: 'ERROR', message });
                speak(`오류가 발생했습니다: ${message}`);
            }
        };

        runTestFlow();
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    const renderContent = () => {
        const currentQuestion = (state.status === 'ASKING_QUESTION' || state.status === 'LISTENING' || state.status === 'EVALUATING') ? questions[state.qIndex] : null;

        const StatusIndicator = ({ icon, text, color } : {icon: React.ReactNode, text: string, color: string}) => (
             <div className={`flex items-center justify-center space-x-3 p-4 rounded-lg bg-opacity-10 ${color}`}>
                {icon}
                <span className="text-xl font-medium">{text}</span>
            </div>
        );

        let statusElement = null;
        if(isSpeaking) statusElement = <StatusIndicator icon={<Volume2 className="w-8 h-8 text-blue-500 animate-pulse" />} text="말하는 중..." color="bg-blue-500"/>;
        else if(isListening) statusElement = <StatusIndicator icon={<Mic className="w-8 h-8 text-red-500 animate-pulse" />} text="듣는 중..." color="bg-red-500"/>;
        else if(state.status === 'EVALUATING') statusElement = <StatusIndicator icon={<Loader2 className="w-8 h-8 text-purple-500 animate-spin" />} text="답변 평가 중..." color="bg-purple-500"/>;

        switch (state.status) {
            case 'IDLE':
                return <button onClick={() => dispatch({ type: 'START_TEST' })} className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105">테스트 시작하기</button>;
            case 'ERROR':
                return <div className="text-red-500 text-xl">{state.message}</div>;
            case 'REQUESTING_PERMISSION':
                return <div className="text-xl">마이크 권한을 요청하는 중...</div>;
            case 'GETTING_USER_INFO':
                const infoStageText = { name: '성함', gender: '성별', ageGroup: '연령대' };
                return (
                    <div className="text-center space-y-4">
                        <User className="w-16 h-16 mx-auto text-indigo-500"/>
                        <p className="text-2xl font-semibold">{infoStageText[state.stage]} 정보를 수집 중입니다.</p>
                        {statusElement}
                        <p className="text-gray-600 text-lg h-8">{currentTranscript}</p>
                    </div>
                );
            case 'STARTING_TEST':
                return (
                     <div className="text-center space-y-4">
                        <Users className="w-16 h-16 mx-auto text-teal-500"/>
                        <p className="text-2xl font-semibold">테스트 준비 중...</p>
                        {statusElement}
                    </div>
                )
            case 'ASKING_QUESTION':
            case 'LISTENING':
            case 'EVALUATING':
                const qIndex = state.status === 'ASKING_QUESTION' ? state.qIndex : state.status === 'LISTENING' ? state.qIndex : state.status === 'EVALUATING' ? state.qIndex : 0;
                return (
                    <div className="w-full max-w-2xl text-center">
                        <div className="mb-6">
                            <span className="text-indigo-500 font-semibold">문항 {qIndex + 1} / {TOTAL_QUESTIONS}</span>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${((qIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}></div>
                            </div>
                        </div>
                        {currentQuestion?.type === QuestionType.BOSTON_NAMING && currentQuestion.image ? (
                             <div className="mb-6 p-4 border-4 border-gray-200 rounded-lg bg-white shadow-lg">
                                <img src={currentQuestion.image} alt="Boston Naming Test" className="w-full h-auto object-contain rounded-md max-h-80" />
                            </div>
                        ) : (
                             <div className="mb-6 p-4 min-h-[352px] flex items-center justify-center">
                                <ImageIcon className="w-32 h-32 text-gray-300" />
                            </div>
                        )}
                        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                             <div className="flex items-start space-x-4">
                                <Bot className="w-8 h-8 text-indigo-500 flex-shrink-0 mt-1"/>
                                <p className="text-2xl font-medium text-left">{currentQuestion?.text}</p>
                            </div>
                             <div className="border-t pt-4">
                                {statusElement}
                            </div>
                            {currentTranscript && (
                                <div className="text-lg text-green-700 font-semibold h-8 mt-4">
                                    <p>"{currentTranscript}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'COMPLETED':
                 return <div className="text-xl">테스트 완료! 결과 페이지로 이동합니다...</div>;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[60vh]">
            {renderContent()}
        </div>
    );
};

export default TestPage;